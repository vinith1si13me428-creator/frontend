// src/components/MarketData.js - Real-time Market Information
import React, { useState, useEffect } from 'react';
import APIService from '../services/apiService';

function MarketData({ symbol, data }) {
  const [marketData, setMarketData] = useState(data || {});
  const [prevPrice, setPrevPrice] = useState(0);
  const [priceDirection, setPriceDirection] = useState('neutral');
  const [loading, setLoading] = useState(!data);

  // Fetch market data
  const fetchMarketData = async () => {
    if (!symbol) return;

    try {
      setLoading(true);
      const newData = await APIService.getMarketData(symbol);
      const currentPrice = parseFloat(newData.mark_price || 0);
      const lastPrice = parseFloat(marketData.mark_price || 0);

      if (lastPrice > 0) {
        setPrevPrice(lastPrice);
        if (currentPrice > lastPrice) {
          setPriceDirection('up');
        } else if (currentPrice < lastPrice) {
          setPriceDirection('down');
        } else {
          setPriceDirection('neutral');
        }
      }

      setMarketData(newData);
    } catch (err) {
      console.error('Market data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update when data prop changes
  useEffect(() => {
    if (data) {
      setMarketData(data);
      setLoading(false);
    }
  }, [data]);

  // Auto-refresh if no data prop provided
  useEffect(() => {
    if (!data) {
      fetchMarketData();
      const interval = setInterval(fetchMarketData, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [symbol, data]);

  // Reset price direction after animation
  useEffect(() => {
    if (priceDirection !== 'neutral') {
      const timer = setTimeout(() => setPriceDirection('neutral'), 1000);
      return () => clearTimeout(timer);
    }
  }, [priceDirection]);

  const formatPrice = (price) => {
    const num = parseFloat(price || 0);
    return num >= 1000 ? num.toLocaleString() : num.toFixed(4);
  };

  const formatVolume = (volume) => {
    const num = parseFloat(volume || 0);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const calculate24hChange = () => {
    const current = parseFloat(marketData.mark_price || 0);
    const open24h = parseFloat(marketData.open || marketData.price_24h_ago || 0);

    if (current === 0 || open24h === 0) return { amount: 0, percent: 0 };

    const amount = current - open24h;
    const percent = (amount / open24h) * 100;

    return { amount, percent };
  };

  const change24h = calculate24hChange();

  if (loading) {
    return (
      <div className="market-loading">
        <div className="loading-spinner"></div>
        <p>Loading market data...</p>
      </div>
    );
  }

  return (
    <div className="market-data-panel">
      <div className="panel-header">
        <h3>📊 Market Data - {symbol}</h3>
        <div className="status-indicator">
          <div className="status-dot online"></div>
          Live
        </div>
      </div>

      {/* Enhanced Price Display */}
      <div className="price-showcase">
        <div className="price-label">Current Price</div>
        <div className={`price-value typography-mono ${priceDirection === 'up' ? 'flash-up' : priceDirection === 'down' ? 'flash-down' : ''}`}>
          ${formatPrice(marketData.mark_price)}
        </div>
        <div className="price-change">
          <span className={`change-amount ${change24h.amount >= 0 ? 'positive' : 'negative'}`}>
            {change24h.amount >= 0 ? '+' : ''}{formatPrice(change24h.amount)}
          </span>
          <span className={`change-percent ${change24h.percent >= 0 ? 'positive' : 'negative'}`}>
            ({change24h.percent >= 0 ? '+' : ''}{change24h.percent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Market Stats Grid */}
      <div className="market-stats-grid">
        <div className="stat-card">
          <div className="stat-label">24h High</div>
          <div className="stat-value positive">${formatPrice(marketData.high)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">24h Low</div>
          <div className="stat-value negative">${formatPrice(marketData.low)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Volume</div>
          <div className="stat-value">{formatVolume(marketData.volume)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open Interest</div>
          <div className="stat-value">{formatVolume(marketData.open_interest)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Funding Rate</div>
          <div className={`stat-value ${parseFloat(marketData.funding_rate || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(parseFloat(marketData.funding_rate || 0) * 100).toFixed(4)}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Index Price</div>
          <div className="stat-value">${formatPrice(marketData.index_price)}</div>
        </div>
      </div>

      {/* Price Levels */}
      <div className="price-levels glass" style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>📈 Price Levels</h4>
        
        <div className="bid-ask">
          <div className="bid-level">
            <div className="level-label">Best Bid</div>
            <div className="level-price positive">
              ${formatPrice(marketData.best_bid_price)}
            </div>
            <div className="level-size">
              {formatVolume(marketData.best_bid_size)}
            </div>
          </div>
          
          <div className="ask-level">
            <div className="level-label">Best Ask</div>
            <div className="level-price negative">
              ${formatPrice(marketData.best_ask_price)}
            </div>
            <div className="level-size">
              {formatVolume(marketData.best_ask_size)}
            </div>
          </div>
        </div>

        {marketData.best_bid_price && marketData.best_ask_price && (
          <div className="spread" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span className="spread-label">Spread:</span>
            <span className="spread-value typography-mono">
              ${(parseFloat(marketData.best_ask_price) - parseFloat(marketData.best_bid_price)).toFixed(4)}
            </span>
            <span className="spread-percent" style={{ marginLeft: '0.5rem' }}>
              ({(((parseFloat(marketData.best_ask_price) - parseFloat(marketData.best_bid_price)) / parseFloat(marketData.best_ask_price)) * 100).toFixed(3)}%)
            </span>
          </div>
        )}
      </div>

      {/* Market Status */}
      <div className="market-status glass" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="stat-label">Market Status:</span>
            <span className="stat-value positive" style={{ marginLeft: '0.5rem' }}>
              {marketData.trading_status || 'Active'}
            </span>
          </div>
          <div>
            <span className="stat-label">Last Update:</span>
            <span className="stat-value typography-mono" style={{ marginLeft: '0.5rem' }}>
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketData;
