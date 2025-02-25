import { useLastPrice } from '../hooks/useLastPrice';

const OrderBook = () => {
  const { lastPrice, status } = useLastPrice();

  return (
    <div>
      <h1>OrderBook</h1>
      <h2 className="text-2xl font-bold">Last Price: {lastPrice}</h2>
      <h2 className="text-2xl font-bold">Status: {status}</h2>
    </div>
  );
};

export default OrderBook;
