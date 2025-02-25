export interface Quote {
  price: number;
  size: number;
  total: number;
  isNew: boolean;
  sizeChanged: boolean;
  sizeIncreased: boolean;
}

export interface OrderBookData {
  bids: [string, string][];
  asks: [string, string][];
  seqNum: number;
  prevSeqNum: number;
  type: 'snapshot' | 'delta';
  timestamp: number;
  symbol: string;
}

export interface TradeData {
  symbol: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  tradeId: number;
  timestamp: number;
}
