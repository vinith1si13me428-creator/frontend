// src/components/AlertsPanel.js - Trading Alerts and Notifications
import React, { useState, useEffect } from 'react';

function AlertsPanel({ strategies, positions }) {
  const [alerts, setAlerts] = useState([]);
  const [showAll, setShowAll] = useState(false);

  // Generate alerts based on strategy and position data
  useEffect(() => {
    const newAlerts = [];
    const currentTime = Date.now();

    // Strategy alerts
    Object.entries(strategies || {}).forEach(([symbol, strategy]) => {
      if (strategy.running) {
        // Check for strategy warnings
        if (strategy.error) {
          newAlerts.push({
            id: `${symbol}-error`,
            type: 'error',
            symbol: symbol,
            title: 'Strategy Error',
            message: strategy.error,
            timestamp: currentTime,
            priority: 'high'
          });
        }

        // Check for long-running strategies without trades
        if (strategy.start_time) {
          const startTime = new Date(strategy.start_time).getTime();
          const runningHours = (currentTime - startTime) / (1000 * 60 * 60);

          if (runningHours > 24) {
            newAlerts.push({
              id: `${symbol}-longtime`,
              type: 'warning',
              symbol: symbol,
              title: 'Long Running Strategy',
              message: `Strategy running for ${Math.floor(runningHours)}h without trades`,
              timestamp: currentTime,
              priority: 'low'
            });
          }
        }
      }
    });

    // Position alerts (mock - would need position data)
    if (positions && positions.length > 0) {
      positions.forEach((position, index) => {
        // Check for high P&L positions
        const pnl = parseFloat(position.unrealized_pnl || 0);
        const margin = parseFloat(position.margin || 0);

        if (margin > 0) {
          const pnlPercent = (pnl / margin) * 100;

          if (pnlPercent > 50) {
            newAlerts.push({
              id: `pos-${index}-profit`,
              type: 'success',
              symbol: position.symbol,
              title: 'High Profit Position',
              message: `Position up ${pnlPercent.toFixed(1)}% - Consider taking profits`,
              timestamp: currentTime,
              priority: 'medium'
            });
          } else if (pnlPercent < -20) {
            newAlerts.push({
              id: `pos-${index}-loss`,
              type: 'warning',
              symbol: position.symbol,
              title: 'Position At Loss',
              message: `Position down ${Math.abs(pnlPercent).toFixed(1)}% - Monitor closely`,
              timestamp: currentTime,
              priority: 'high'
            });
          }
        }
      });
    }

    // Merge with existing alerts, avoiding duplicates
    setAlerts(prevAlerts => {
      const existingIds = prevAlerts.map(alert => alert.id);
      const uniqueNewAlerts = newAlerts.filter(alert => !existingIds.includes(alert.id));

      // Keep only alerts from last 24 hours
      const dayAgo = currentTime - (24 * 60 * 60 * 1000);
      const validAlerts = [...prevAlerts, ...uniqueNewAlerts]
        .filter(alert => alert.timestamp > dayAgo)
        .sort((a, b) => b.timestamp - a.timestamp);

      return validAlerts;
    });
  }, [strategies, positions]);

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 5);
  const hasHighPriority = alerts.some(alert => alert.priority === 'high');

  return (
    <div className={`alerts-panel ${hasHighPriority ? 'has-urgent' : ''}`}>
      <div className="panel-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🔔 Alerts 
          {hasHighPriority && <span className="urgent-indicator">🚨</span>}
        </h3>
        
        <div className="alerts-actions">
          <button className="toggle-btn" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show Less' : `Show All (${alerts.length})`}
          </button>
          {alerts.length > 0 && (
            <button className="clear-btn" onClick={clearAllAlerts}>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="alerts-container">
        {alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔕</div>
            <h4>No alerts</h4>
            <p className="empty-subtitle">All systems running smoothly</p>
          </div>
        ) : (
          <div className="alerts-list">
            {displayedAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`alert-item ${alert.type} premium-card`}
                style={{ marginBottom: '0.75rem' }}
              >
                <div className="alert-header">
                  <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                  <span className="alert-symbol">{alert.symbol}</span>
                  <span className="alert-time">{formatTimestamp(alert.timestamp)}</span>
                  <button 
                    className="dismiss-btn" 
                    onClick={() => dismissAlert(alert.id)}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
                
                <h4 className="alert-title">{alert.title}</h4>
                <p className="alert-message">{alert.message}</p>
                
                {alert.priority === 'high' && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.25rem 0.5rem', 
                    background: 'var(--danger-bg)', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    color: 'var(--danger)',
                    fontWeight: '600'
                  }}>
                    🔥 HIGH PRIORITY
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Summary */}
      {alerts.length > 0 && (
        <div className="alert-summary glass" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
            <div>
              <div style={{ color: 'var(--danger)', fontWeight: '600', fontSize: '1.2rem' }}>
                {alerts.filter(a => a.type === 'error').length}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Errors</div>
            </div>
            <div>
              <div style={{ color: 'var(--warning)', fontWeight: '600', fontSize: '1.2rem' }}>
                {alerts.filter(a => a.type === 'warning').length}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Warnings</div>
            </div>
            <div>
              <div style={{ color: 'var(--success)', fontWeight: '600', fontSize: '1.2rem' }}>
                {alerts.filter(a => a.type === 'success').length}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Success</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.2rem' }}>
                {alerts.filter(a => a.priority === 'high').length}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>High Priority</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertsPanel;
