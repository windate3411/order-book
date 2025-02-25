import { useOrderBook } from '../hooks/useOrderBook';
import { useLastPrice } from '../hooks/useLastPrice';
import { Quote } from '../types/orderBook';

const formatNumber = (num: number): string =>
  num.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

const OrderBook: React.FC = () => {
  const { orderBook } = useOrderBook();
  const { lastPrice, status } = useLastPrice();

  const getLastPriceInfo = () => {
    switch (status) {
      case 'higher':
        return {
          classes: 'bg-buy-bar text-buy-price',
          arrowTransform: 'rotate-180',
        };
      case 'lower':
        return {
          classes: 'bg-sell-bar text-sell-price',
          arrowTransform: '',
        };
      case 'even':
      default:
        return {
          classes: 'bg-row-default text-default',
          arrowTransform: 'hidden',
        };
    }
  };

  const renderQuotes = (quotes: Quote[] | undefined, isBuy: boolean) => {
    const quotesToRender = [...(quotes || [])];
    const totalSize = quotesToRender.reduce((sum, q) => sum + q.size, 0) || 1;

    return (
      <div className="min-h-[320px]">
        {quotesToRender.map((quote, index) => (
          <div
            key={`${quote.price}-${index}`}
            className={`
              flex items-center h-10 
              hover:bg-row-hover transition-colors
              ${
                quote.isNew
                  ? isBuy
                    ? 'bg-flash-green animate-flash-once'
                    : 'bg-flash-red animate-flash-once'
                  : ''
              }
            `}
          >
            <div
              className={`w-1/3 px-2 py-1 ${
                isBuy ? 'text-buy-price' : 'text-sell-price'
              }`}
            >
              {quote.price > 0 ? formatNumber(quote.price) : '-'}
            </div>
            <div className="w-1/3 px-2 py-1 relative text-default">
              {formatNumber(quote.size)}
              {quote.sizeChanged && (
                <span
                  className={`
                    absolute inset-0 
                    ${quote.sizeIncreased ? 'bg-flash-green' : 'bg-flash-red'}
                    animate-flash
                  `}
                />
              )}
            </div>
            <div className="w-1/3 px-2 py-1 text-default relative">
              {formatNumber(quote.total)}
              <div
                className={`
                  absolute inset-0 h-full rounded
                  ${isBuy ? 'bg-buy-bar' : 'bg-sell-bar'}
                  flex justify-end flex-row-reverse
                `}
                style={{
                  width: `${
                    quote.total > 0 ? (quote.total / totalSize) * 100 : 0
                  }%`,
                  right: 0,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!orderBook) {
    return <div className="text-default p-4">Loading Order Book...</div>;
  }

  const { classes, arrowTransform } = getLastPriceInfo();

  return (
    <div className="min-h-screen bg-dark p-4">
      <h1 className="text-2xl font-bold mb-4 text-default">Order Book</h1>
      <div className="rounded-lg shadow-lg bg-dark">
        <div className="space-y-px">
          <div className="flex items-center h-10 text-head text-sm">
            <div className="w-1/3 px-2">Price (USD)</div>
            <div className="w-1/3 px-2">Size</div>
            <div className="w-1/3 px-2">Total</div>
          </div>

          <div>{renderQuotes(orderBook.asks, false)}</div>

          <div className="flex justify-center items-center h-10 my-4">
            <span
              className={`flex items-center justify-center px-2 py-1 rounded w-full text-center text-2xl font-bold ${classes}`}
            >
              {lastPrice ? formatNumber(lastPrice) : 'N/A'}
              {lastPrice !== null && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  role="presentation"
                  fill="currentColor"
                  fillRule="nonzero"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-4 h-4 ml-2 ${arrowTransform}`}
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              )}
            </span>
          </div>
          <div>{renderQuotes(orderBook.bids, true)}</div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
