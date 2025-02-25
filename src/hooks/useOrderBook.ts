import { useEffect, useState, useCallback, useRef } from 'react';
import { OrderBookData, Quote } from '../types/orderBook';

const ORDERBOOK_WS_URL = 'wss://ws.btse.com/ws/oss/futures';

const EMPTY_QUOTE: Quote = {
  price: 0,
  size: 0,
  total: 0,
  isNew: false,
  sizeChanged: false,
  sizeIncreased: false,
};

function sortAndSlice(
  map: Map<number, number>,
  isBids: boolean,
  limit = 8
): Quote[] {
  let arr = Array.from(map.entries()).map(([price, size]) => ({
    price,
    size,
    total: 0,
    isNew: false,
    sizeChanged: false,
    sizeIncreased: false,
  }));

  arr.sort((a, b) => b.price - a.price);

  arr = arr.slice(0, limit);

  if (isBids) {
    arr.forEach((quote, i) => {
      quote.total = arr
        .slice(arr.length - 1 - i)
        .reduce((sum, q) => sum + q.size, 0);
    });
  } else {
    for (let i = 0; i < arr.length; i++) {
      arr[i].total = arr.slice(i).reduce((sum, q) => sum + q.size, 0);
    }
  }

  return arr;
}

function applyAnimationFlags(prevQuotes: Quote[], newQuotes: Quote[]): Quote[] {
  return newQuotes.map((newQ) => {
    const prevQ = prevQuotes.find((p) => p.price === newQ.price);

    if (!prevQ) {
      return { ...newQ, isNew: true, sizeChanged: false, sizeIncreased: false };
    } else {
      const sizeChanged = newQ.size !== prevQ.size;
      const sizeIncreased = newQ.size > prevQ.size;
      return {
        ...newQ,
        isNew: false,
        sizeChanged,
        sizeIncreased,
      };
    }
  });
}

export const useOrderBook = () => {
  const bidsMapRef = useRef<Map<number, number>>(new Map());
  const asksMapRef = useRef<Map<number, number>>(new Map());

  const [orderBook, setOrderBook] = useState<{ bids: Quote[]; asks: Quote[] }>({
    bids: Array.from({ length: 8 }, () => ({ ...EMPTY_QUOTE })),
    asks: Array.from({ length: 8 }, () => ({ ...EMPTY_QUOTE })),
  });

  const lastSeqNum = useRef<number | null>(null);
  const wsOrderBookRef = useRef<WebSocket | null>(null);

  const subscribeOrderBook = useCallback((ws: WebSocket) => {
    ws.send(
      JSON.stringify({
        op: 'subscribe',
        args: ['update:BTCPFC_0'],
      })
    );
  }, []);

  const mergeData = useCallback((data: OrderBookData) => {
    // 如果是 snapshot，代表要重置整個 order book
    if (data.type === 'snapshot') {
      bidsMapRef.current.clear();
      asksMapRef.current.clear();
    }

    data.bids?.forEach(([priceStr, sizeStr]) => {
      const price = Number(priceStr);
      const size = Number(sizeStr);
      if (size === 0) {
        bidsMapRef.current.delete(price);
      } else {
        bidsMapRef.current.set(price, size);
      }
    });

    data.asks?.forEach(([priceStr, sizeStr]) => {
      const price = Number(priceStr);
      const size = Number(sizeStr);
      if (size === 0) {
        asksMapRef.current.delete(price);
      } else {
        asksMapRef.current.set(price, size);
      }
    });

    const newBids = sortAndSlice(bidsMapRef.current, true, 8);
    const newAsks = sortAndSlice(asksMapRef.current, false, 8);

    setOrderBook((prev) => {
      const finalBids = applyAnimationFlags(prev.bids, newBids);
      const finalAsks = applyAnimationFlags(prev.asks, newAsks);
      return { bids: finalBids, asks: finalAsks };
    });
  }, []);

  const handleOrderBookMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const response = JSON.parse(event.data);

        if (response.topic === 'update:BTCPFC_0' && response.data) {
          const data: OrderBookData = response.data;
          if (!data.bids && !data.asks) {
            console.warn('No bids or asks in OrderBook data, skipping update.');
            return;
          }

          if (data.seqNum !== undefined) {
            if (
              data.type === 'delta' &&
              lastSeqNum.current !== null &&
              data.prevSeqNum !== lastSeqNum.current
            ) {
              console.warn('Sequence mismatch, resubscribing...');
              wsOrderBookRef.current?.close();
              wsOrderBookRef.current = new WebSocket(ORDERBOOK_WS_URL);
              subscribeOrderBook(wsOrderBookRef.current);
              return;
            }
            lastSeqNum.current = data.seqNum;
          }

          mergeData(data);
        }
      } catch (error) {
        console.error('Error processing OrderBook message:', error);
      }
    },
    [subscribeOrderBook, mergeData]
  );

  useEffect(() => {
    wsOrderBookRef.current = new WebSocket(ORDERBOOK_WS_URL);

    wsOrderBookRef.current.onopen = () => {
      console.log('OrderBook WebSocket connected');
      subscribeOrderBook(wsOrderBookRef.current!);
    };
    wsOrderBookRef.current.onmessage = handleOrderBookMessage;
    wsOrderBookRef.current.onerror = (error) =>
      console.error('WebSocket OrderBook error:', error);
    wsOrderBookRef.current.onclose = () =>
      console.log('WebSocket OrderBook closed');

    return () => {
      wsOrderBookRef.current?.close();
    };
  }, [subscribeOrderBook, handleOrderBookMessage]);

  return { orderBook };
};
