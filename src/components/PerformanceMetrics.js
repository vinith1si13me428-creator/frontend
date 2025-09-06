// src/components/PerformanceMetrics.js - Trading Performance Analytics
import React, { useState, useEffect } from 'react';
import APIService from '../services/apiService';

function PerformanceMetrics({ strategies }) {
  const [tradeStats, setTradeStats] = useState({});
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const [stats, trades] = await Promise.all([
        APIService.getTradeStats(),
        APIService.getTrades()
      ]);

      setTradeStats(stats);
      setRecentTrades(trades.slice(0, 10)); // Last 10 trades
    } catch (err) {
      console.error('Performance data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeframe]);

  // Calculate additional metrics
  const calculateMetrics = () => {
    const { total_trades, winning_trades, losing_trades, total_pnl, closed_trades } = tradeStats;

    if (closed_trades === 0) {
      return {
        winRate: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        maxDrawdown: 0,
        sharpeRatio: 0
      };
    }

    // Calculate from recent trades
    const closedTrades = recentTrades.filter(t => t.status === 'Closed' && t.profit_loss !== null);
    const winningTrades = closedTrades.filter(t => parseFloat(t.profit_loss) > 0);
    const losingTrades = closedTrades.filter(t => parseFloat(t.profit_loss) < 0);

    const totalWinAmount = winningTrades.reduce((sum, t) => sum + parseFloat(t.profit_loss), 0);
    const totalLossAmount = Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.profit_loss), 0));

    const avgWin = winningTrades.length > 0 ? totalWinAmount / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLossAmount / losingTrades.length : 0;
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0;

    // Simple drawdown calculation
    let maxDrawdown = 0;
    let peak = 0;
    let runningPnL = 0;

    for (const trade of closedTrades.reverse()) {
      runningPnL += parseFloat(trade.profit_loss || 0);
      if (runningPnL > peak) {
        peak = runningPnL;
      }
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return {
      winRate: (winning_trades / closed_trades) * 100,
      profitFactor: profitFactor,
      avgWin: avgWin,
      avgLoss: avgLoss,
      maxDrawdown: maxDrawdown,
      sharpeRatio: 0 // Simplified - would need more data for accurate calculation
    };
  };

  const metrics = calculateMetrics();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="performance-loading">
        <div className="loading-spinner"></div>
        <p>Loading performance data...</p>
      </div>
    );
  }

  return (
    <div className="performance-panel">
      <div className="panel-header">
        <h3>📊 Performance Metrics</h3>
        <select 
          className="timeframe-selector"
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="1d">1 Day</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
          <option value="90d">90 Days</option>
        </select>
      </div>

      {/* Key Performance Metrics */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total P&L</div>
            <div className={`metric-value ${(tradeStats.total_pnl || 0) >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(tradeStats.total_pnl || 0)}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <div className="metric-label">Win Rate</div>
            <div className="metric-value">{metrics.winRate.toFixed(1)}%</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <div className="metric-label">Profit Factor</div>
            <div className="metric-value">{metrics.profitFactor.toFixed(2)}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔢</div>
          <div className="metric-content">
            <div className="metric-label">Total Trades</div>
            <div className="metric-value">{tradeStats.total_trades || 0}</div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="detailed-stats">
        <div className="stats-section glass">
          <h4>💹 Trade Statistics</h4>
          <div className="stats-grid">
            <div className="stat-row">
              <span className="stat-label">Winning Trades:</span>
              <span className="stat-value positive">{tradeStats.winning_trades || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Losing Trades:</span>
              <span className="stat-value negative">{tradeStats.losing_trades || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Average Win:</span>
              <span className="stat-value positive">{formatCurrency(metrics.avgWin)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Average Loss:</span>
              <span className="stat-value negative">{formatCurrency(-metrics.avgLoss)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Best Trade:</span>
              <span className="stat-value positive">{formatCurrency(tradeStats.best_trade || 0)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Worst Trade:</span>
              <span className="stat-value negative">{formatCurrency(tradeStats.worst_trade || 0)}</span>
            </div>
          </div>
        </div>

        <div className="stats-section glass">
          <h4>⚠️ Risk Metrics</h4>
          <div className="stats-grid">
            <div className="stat-row">
              <span className="stat-label">Max Drawdown:</span>
              <span className="stat-value negative">{formatCurrency(-metrics.maxDrawdown)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Recovery Factor:</span>
              <span className="stat-value">
                {metrics.maxDrawdown > 0 ? ((tradeStats.total_pnl || 0) / metrics.maxDrawdown).toFixed(2) : 'N/A'}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Risk/Reward Ratio:</span>
              <span className="stat-value">
                {metrics.avgLoss > 0 ? (metrics.avgWin / metrics.avgLoss).toFixed(2) : 'N/A'}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Expectancy:</span>
              <span className="stat-value">
                {formatCurrency((metrics.winRate / 100) * metrics.avgWin - ((100 - metrics.winRate) / 100) * metrics.avgLoss)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="recent-trades glass" style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>📝 Recent Trades</h4>
        
        {recentTrades.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h5>No recent trades</h5>
            <p className="empty-subtitle">Trade history will appear here</p>
          </div>
        ) : (
          <div className="trades-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {recentTrades.map((trade, index) => (
              <div key={index} className="trade-item glass" style={{ 
                padding: '0.75rem', 
                marginBottom: '0.5rem', 
                borderRadius: '8px',
                borderLeft: `3px solid ${parseFloat(trade.profit_loss || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {trade.symbol} - {trade.side}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {trade.timestamp ? new Date(trade.timestamp).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={`typography-mono ${parseFloat(trade.profit_loss || 0) >= 0 ? 'positive' : 'negative'}`}
                         style={{ fontWeight: '600', fontSize: '1rem' }}>
                      {formatCurrency(trade.profit_loss || 0)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Size: {Math.abs(trade.size || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strategy Performance Breakdown */}
      {Object.keys(strategies).length > 0 && (
        <div className="strategy-breakdown glass" style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>🔧 Active Strategies</h4>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {Object.entries(strategies).map(([symbol, strategy]) => (
              <div key={symbol} className="strategy-item glass" style={{ padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {symbol} - {strategy.strategy_name || 'EMA Strategy'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Status: {strategy.running ? 'Running' : 'Stopped'}
                      {strategy.start_time && ` • Started: ${new Date(strategy.start_time).toLocaleTimeString()}`}
                    </div>
                  </div>
                  <div className={`status-dot ${strategy.running ? 'online' : 'offline'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceMetrics;
