import { useEffect, useState, useCallback, useRef } from 'react';

const TRADE_WS_URL = 'wss://ws.btse.com/ws/futures';

export const useLastPrice = () => {
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [status, setStatus] = useState<'higher' | 'lower' | 'even'>('even');
  const wsTradeRef = useRef<WebSocket | null>(null);

  const subscribeTradeHistory = useCallback((ws: WebSocket) => {
    ws.send(
      JSON.stringify({
        op: 'subscribe',
        args: ['tradeHistoryApi:BTCPFC'],
      })
    );
  }, []);

  const handleTradeMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const response = JSON.parse(event.data);
        console.log('Trade Response:', response);

        if (
          response.topic === 'tradeHistoryApi' &&
          response.data &&
          Array.isArray(response.data)
        ) {
          const data = response.data as Array<{ price: number }>;
          if (data.length > 0 && data[0].price !== undefined) {
            const newPrice = data[0].price;
            setLastPrice(newPrice);

            if (lastPrice !== null) {
              if (newPrice > lastPrice) {
                setStatus('higher');
              } else if (newPrice < lastPrice) {
                setStatus('lower');
              } else {
                setStatus('even');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing Trade message:', error);
      }
    },
    [lastPrice]
  );

  useEffect(() => {
    wsTradeRef.current = new WebSocket(TRADE_WS_URL);

    wsTradeRef.current.onopen = () => {
      console.log('Trade WebSocket connected');
      subscribeTradeHistory(wsTradeRef.current!);
    };
    wsTradeRef.current.onmessage = handleTradeMessage;
    wsTradeRef.current.onerror = (error) =>
      console.error('WebSocket Trade error:', error);
    wsTradeRef.current.onclose = () => console.log('WebSocket Trade closed');

    return () => {
      wsTradeRef.current?.close();
    };
  }, [subscribeTradeHistory, handleTradeMessage]);

  return { lastPrice, status };
};
