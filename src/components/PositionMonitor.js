// src/components/PositionMonitor.js - Real-time Position Monitoring
import React, { useState, useEffect } from 'react';
import APIService from '../services/apiService';

function PositionMonitor({ symbol }) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch position data
  const fetchPosition = async () => {
    if (!symbol) return;

    try {
      setLoading(true);
      setError(null);
      const data = await APIService.getPositions(symbol);

      // Handle both single position and array response
      if (Array.isArray(data)) {
        setPositions(data.filter(pos => Math.abs(pos.size || 0) > 0));
      } else if (data && Object.keys(data).length > 0 && Math.abs(data.size || 0) > 0) {
        setPositions([data]);
      } else {
        setPositions([]);
      }
    } catch (err) {
      setError(err.message);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh positions
  useEffect(() => {
    fetchPosition();
    const interval = setInterval(fetchPosition, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [symbol]);

  const calculatePnL = (position) => {
    const size = parseFloat(position.size || 0);
    const entryPrice = parseFloat(position.entry_price || 0);
    const markPrice = parseFloat(position.mark_price || position.current_price || 0);

    if (size === 0 || entryPrice === 0 || markPrice === 0) return 0;

    return size > 0 
      ? (markPrice - entryPrice) * Math.abs(size) // Long position
      : (entryPrice - markPrice) * Math.abs(size); // Short position
  };

  const calculatePnLPercentage = (position) => {
    const entryPrice = parseFloat(position.entry_price || 0);
    const markPrice = parseFloat(position.mark_price || position.current_price || 0);

    if (entryPrice === 0 || markPrice === 0) return 0;

    const size = parseFloat(position.size || 0);
    return size > 0 
      ? ((markPrice - entryPrice) / entryPrice) * 100 // Long
      : ((entryPrice - markPrice) / entryPrice) * 100; // Short
  };

  const getPositionSide = (size) => {
    const sizeFloat = parseFloat(size || 0);
    if (sizeFloat > 0) return 'LONG';
    if (sizeFloat < 0) return 'SHORT';
    return 'FLAT';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading && positions.length === 0) {
    return (
      <div className="position-loading">
        <div className="loading-spinner"></div>
        <p>Loading positions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="positions-panel">
        <div className="panel-header">
          <h3>💼 Positions - {symbol}</h3>
          <button className="refresh-btn glass" onClick={fetchPosition}>
            🔄 Refresh
          </button>
        </div>
        <div className="message-alert error">
          <h4>Failed to load positions</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="positions-panel">
      <div className="panel-header">
        <h3>💼 Positions - {symbol}</h3>
        <button className="refresh-btn glass" onClick={fetchPosition}>
          🔄 Refresh
        </button>
      </div>

      {positions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h4>No Open Positions</h4>
          <p className="empty-subtitle">Start trading to see your positions here</p>
        </div>
      ) : (
        <div className="positions-grid">
          {positions.map((position, index) => {
            const pnl = calculatePnL(position);
            const pnlPercentage = calculatePnLPercentage(position);
            const positionSide = getPositionSide(position.size);
            
            return (
              <div key={index} className={`position-card ${positionSide.toLowerCase()}`}>
                <div className="position-header">
                  <div className="position-symbol">
                    <span className="symbol typography-display">{position.symbol || symbol}</span>
                    <span className={`side-badge ${positionSide.toLowerCase()}`}>
                      {positionSide}
                    </span>
                  </div>
                  <div className="position-pnl">
                    <div className={`pnl-amount ${pnl >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(pnl)}
                    </div>
                    <div className={`pnl-percent ${pnlPercentage >= 0 ? 'positive' : 'negative'}`}>
                      ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%)
                    </div>
                  </div>
                </div>
                
                <div className="position-details">
                  <div className="detail-row">
                    <span className="label">Size:</span>
                    <span className="value typography-mono">{Math.abs(position.size || 0).toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Entry Price:</span>
                    <span className="value typography-mono">${parseFloat(position.entry_price || 0).toFixed(4)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Mark Price:</span>
                    <span className="value typography-mono">${parseFloat(position.mark_price || position.current_price || 0).toFixed(4)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Margin:</span>
                    <span className="value typography-mono">{formatCurrency(position.margin || 0)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Leverage:</span>
                    <span className="value typography-mono">{parseFloat(position.leverage || 1).toFixed(1)}x</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Liquidation:</span>
                    <span className="value negative typography-mono">
                      ${parseFloat(position.liquidation_price || 0).toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Position Actions */}
                <div className="position-actions glass" style={{ margin: '1rem', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}>
                      ➕ Add Margin
                    </button>
                    <button className="btn-danger" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}>
                      ❌ Close Position
                    </button>
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="risk-metrics glass" style={{ margin: '1rem', padding: '0.75rem', borderRadius: '8px' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--warning)' }}>⚠️ Risk Metrics</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div>
                      <span className="label">Maintenance Margin:</span>
                      <div className="value typography-mono">{formatCurrency(position.maintenance_margin || 0)}</div>
                    </div>
                    <div>
                      <span className="label">Distance to Liq:</span>
                      <div className={`value typography-mono ${position.liquidation_price ? 'negative' : ''}`}>
                        {position.liquidation_price && position.mark_price 
                          ? `${(Math.abs((parseFloat(position.liquidation_price) - parseFloat(position.mark_price)) / parseFloat(position.mark_price)) * 100).toFixed(2)}%`
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Position Summary */}
      {positions.length > 0 && (
        <div className="position-summary glass" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>📊 Position Summary</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div className="summary-stat">
              <div className="stat-label">Total Positions</div>
              <div className="stat-value">{positions.length}</div>
            </div>
            <div className="summary-stat">
              <div className="stat-label">Total PnL</div>
              <div className={`stat-value ${positions.reduce((sum, pos) => sum + calculatePnL(pos), 0) >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(positions.reduce((sum, pos) => sum + calculatePnL(pos), 0))}
              </div>
            </div>
            <div className="summary-stat">
              <div className="stat-label">Total Margin</div>
              <div className="stat-value">
                {formatCurrency(positions.reduce((sum, pos) => sum + parseFloat(pos.margin || 0), 0))}
              </div>
            </div>
            <div className="summary-stat">
              <div className="stat-label">Avg Leverage</div>
              <div className="stat-value">
                {(positions.reduce((sum, pos) => sum + parseFloat(pos.leverage || 1), 0) / positions.length).toFixed(1)}x
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PositionMonitor;
