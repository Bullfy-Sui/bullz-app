import { useGetPriceList } from "@/common-api-services/token-price.ts";
import { formatTokenPrice, formatPercentageChange, shortenAddress } from "@/common-api-services/token-price.ts/utils";

export const TokenPriceDisplay = () => {
  const { data: priceList, isLoading, error, isError } = useGetPriceList();

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Token Prices</h2>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-300 h-10 w-10"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold mb-2 text-red-800">Error Loading Prices</h2>
        <p className="text-red-600">
          {error instanceof Error ? error.message : "Failed to load token prices"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Token Prices</h2>
      {priceList && priceList.length > 0 ? (
        <div className="space-y-4">
          {priceList.map((token) => {
            const change5m = formatPercentageChange(token.percentagePriceChange5m);
            const change1h = formatPercentageChange(token.percentagePriceChange1h);
            
            return (
              <div key={token.coinAddress} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <img 
                  src={token.imageUrl} 
                  alt={token.name}
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml;base64,${btoa(`
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="20" fill="#F7F7F7"/>
                        <text x="20" y="25" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">${token.symbol}</text>
                      </svg>
                    `)}`;
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{token.name}</h3>
                      <p className="text-xs text-gray-500">{token.symbol}</p>
                      <p className="text-xs text-gray-400" title={token.coinAddress}>
                        {shortenAddress(token.coinAddress)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatTokenPrice(token.currentPrice)}</p>
                      <div className="flex space-x-2 text-sm">
                        <span className={change5m.colorClass} title="5 minute change">
                          5m: {change5m.value}
                        </span>
                        <span className={change1h.colorClass} title="1 hour change">
                          1h: {change1h.value}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Decimals: {token.decimals}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">No token prices available</p>
      )}
      
      {/* Refresh indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Prices update every 2 minutes
        </p>
      </div>
    </div>
  );
}; 