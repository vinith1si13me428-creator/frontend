// src/components/OrderBook.js - Real-time Order Book Display
import React, { useState, useEffect } from 'react';
import APIService from '../services/apiService';

function OrderBook({ symbol }) {
  const [orderBook, setOrderBook] = useState({ buy: [], sell: [] });
  const [loading, setLoading] = useState(true);
  const [spread, setSpread] = useState(0);
  const [maxTotal, setMaxTotal] = useState(0);

  // Fetch order book data
  const fetchOrderBook = async () => {
    if (!symbol) return;

    try {
      // This would need to be implemented in APIService
      // For now, we'll simulate with market data
      const marketData = await APIService.getMarketData(symbol);

      // Mock order book data based on current price
      const currentPrice = parseFloat(marketData.mark_price || 0);
      if (currentPrice > 0) {
        const mockOrderBook = generateMockOrderBook(currentPrice);
        setOrderBook(mockOrderBook);

        // Calculate spread
        const bestBid = mockOrderBook.buy[0]?.price || 0;
        const bestAsk = mockOrderBook.sell[0]?.price || 0;
        setSpread(bestAsk - bestBid);

        // Calculate max total for visualization
        const allTotals = [...mockOrderBook.buy, ...mockOrderBook.sell].map(o => o.total);
        setMaxTotal(Math.max(...allTotals));
      }
    } catch (err) {
      console.error('Order book fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock order book data (replace with real API call)
  const generateMockOrderBook = (price) => {
    const levels = 15;
    const buy = [];
    const sell = [];

    // Generate buy orders (bids)
    let total = 0;
    for (let i = 0; i < levels; i++) {
      const orderPrice = price * (1 - (i + 1) * 0.0001);
      const size = Math.random() * 1000 + 100;
      total += size;
      buy.push({
        price: orderPrice,
        size: size,
        total: total
      });
    }

    // Generate sell orders (asks)
    total = 0;
    for (let i = 0; i < levels; i++) {
      const orderPrice = price * (1 + (i + 1) * 0.0001);
      const size = Math.random() * 1000 + 100;
      total += size;
      sell.unshift({
        price: orderPrice,
        size: size,
        total: total
      });
    }

    return { buy, sell };
  };

  useEffect(() => {
    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [symbol]);

  const formatPrice = (price) => parseFloat(price).toFixed(4);
  const formatSize = (size) => {
    if (size >= 1000000) return (size / 1000000).toFixed(1) + 'M';
    if (size >= 1000) return (size / 1000).toFixed(1) + 'K';
    return size.toFixed(0);
  };

  const getVolumeBarWidth = (total) => {
    return maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="orderbook-loading">
        <div className="loading-spinner"></div>
        <p>Loading order book...</p>
      </div>
    );
  }

  return (
    <div className="orderbook-panel">
      <div className="panel-header">
        <h3>📋 Order Book - {symbol}</h3>
        <div className="orderbook-controls">
          <button className="refresh-btn glass" onClick={fetchOrderBook}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="orderbook-container glass">
        {/* Header */}
        <div className="orderbook-header">
          <div>Price</div>
          <div>Size</div>
          <div>Total</div>
        </div>

        {/* Sell Orders (Asks) */}
        <div className="orderbook-section sell-section">
          {orderBook.sell.map((order, index) => (
            <div key={`sell-${index}`} className="orderbook-row">
              <div 
                className="volume-bar sell" 
                style={{ width: `${getVolumeBarWidth(order.total)}%` }}
              ></div>
              <div className="order-price sell typography-mono">
                {formatPrice(order.price)}
              </div>
              <div className="order-size typography-mono">
                {formatSize(order.size)}
              </div>
              <div className="order-total typography-mono">
                {formatSize(order.total)}
              </div>
            </div>
          ))}
        </div>

        {/* Spread Display */}
        <div className="spread-row">
          <div className="spread-info">
            <span className="spread-label">Spread:</span>
            <span className="spread-value typography-mono">
              ${spread.toFixed(4)}
            </span>
            <span className="spread-percent">
              ({((spread / orderBook.sell[0]?.price) * 100 || 0).toFixed(3)}%)
            </span>
          </div>
        </div>

        {/* Buy Orders (Bids) */}
        <div className="orderbook-section buy-section">
          {orderBook.buy.map((order, index) => (
            <div key={`buy-${index}`} className="orderbook-row">
              <div 
                className="volume-bar buy" 
                style={{ width: `${getVolumeBarWidth(order.total)}%` }}
              ></div>
              <div className="order-price buy typography-mono">
                {formatPrice(order.price)}
              </div>
              <div className="order-size typography-mono">
                {formatSize(order.size)}
              </div>
              <div className="order-total typography-mono">
                {formatSize(order.total)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Book Statistics */}
      <div className="orderbook-stats glass" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div className="stat-label">Total Bids:</div>
            <div className="stat-value positive typography-mono">
              {formatSize(orderBook.buy.reduce((sum, order) => sum + order.size, 0))}
            </div>
          </div>
          <div>
            <div className="stat-label">Total Asks:</div>
            <div className="stat-value negative typography-mono">
              {formatSize(orderBook.sell.reduce((sum, order) => sum + order.size, 0))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div className="stat-label">Best Bid:</div>
            <div className="stat-value positive typography-mono">
              ${formatPrice(orderBook.buy[0]?.price || 0)}
            </div>
          </div>
          <div>
            <div className="stat-label">Best Ask:</div>
            <div className="stat-value negative typography-mono">
              ${formatPrice(orderBook.sell[0]?.price || 0)}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <div className="stat-label">Market Depth:</div>
          <div className="stat-value">
            {orderBook.buy.length + orderBook.sell.length} levels
          </div>
        </div>
      </div>

      {/* Market Sentiment Indicator */}
      <div className="market-sentiment glass" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px' }}>
        <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>📊 Market Sentiment</h5>
        
        {(() => {
          const totalBids = orderBook.buy.reduce((sum, order) => sum + order.size, 0);
          const totalAsks = orderBook.sell.reduce((sum, order) => sum + order.size, 0);
          const totalVolume = totalBids + totalAsks;
          const bidPercentage = totalVolume > 0 ? (totalBids / totalVolume) * 100 : 50;
          
          return (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem' 
              }}>
                <span className="positive">Bullish: {bidPercentage.toFixed(1)}%</span>
                <span className="negative">Bearish: {(100 - bidPercentage).toFixed(1)}%</span>
              </div>
              
              <div style={{ 
                height: '8px', 
                borderRadius: '4px', 
                background: 'var(--secondary-bg)', 
                overflow: 'hidden' 
              }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${bidPercentage}%`, 
                    background: 'var(--gradient-success)',
                    transition: 'width 0.3s ease'
                  }}
                ></div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default OrderBook;
