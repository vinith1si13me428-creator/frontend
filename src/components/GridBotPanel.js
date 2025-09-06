// src/components/GridBotPanel.js - Grid Trading Bot Configuration & Monitoring
import React, { useState, useEffect } from 'react';

const GRID_PRESETS = {
  'Conservative': {
    gridLevels: 8,
    investmentAmount: 500,
    stopLoss: 15,
    description: 'Safe grid with fewer levels',
    riskLevel: 'Low'
  },
  'Balanced': {
    gridLevels: 12,
    investmentAmount: 1000,
    stopLoss: 10,
    description: 'Optimal risk/reward balance',
    riskLevel: 'Medium'
  },
  'Aggressive': {
    gridLevels: 20,
    investmentAmount: 2000,
    stopLoss: 8,
    description: 'Maximum profit potential',
    riskLevel: 'High'
  }
};

function GridBotPanel({ symbol, strategy, marketData, accountBalance, onStartStrategy, onStopStrategy }) {
  const [tradingMode, setTradingMode] = useState('Auto');
  const [gridPreset, setGridPreset] = useState('Balanced');
  const [gridConfig, setGridConfig] = useState({
    type: 'Arithmetic',
    gridLevels: 12,
    investmentAmount: 1000,
    upperPrice: 0,
    lowerPrice: 0,
    perGridAmount: 0,
    stopLoss: 10
  });
  const [autoCalculated, setAutoCalculated] = useState({
    gridSpacing: 0,
    profitPerGrid: 0,
    maxProfit: 0,
    riskAmount: 0
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isRunning = strategy?.running || false;
  const currentPrice = parseFloat(marketData?.mark_price || 0);

  // Auto-calculate grid parameters
  useEffect(() => {
    if (currentPrice > 0) {
      const preset = GRID_PRESETS[gridPreset];
      const range = currentPrice * 0.3; // ±15% range
      const upperPrice = currentPrice * 1.15;
      const lowerPrice = currentPrice * 0.85;
      const perGridAmount = preset.investmentAmount / preset.gridLevels;

      setGridConfig(prev => ({
        ...prev,
        gridLevels: preset.gridLevels,
        investmentAmount: preset.investmentAmount,
        upperPrice: parseFloat(upperPrice.toFixed(2)),
        lowerPrice: parseFloat(lowerPrice.toFixed(2)),
        perGridAmount: parseFloat(perGridAmount.toFixed(2)),
        stopLoss: preset.stopLoss
      }));

      // Calculate metrics
      const gridSpacing = (upperPrice - lowerPrice) / preset.gridLevels;
      const profitPerGrid = gridSpacing * 0.5; // ~0.5% profit per grid
      const maxProfit = profitPerGrid * preset.gridLevels;
      const riskAmount = preset.investmentAmount * (preset.stopLoss / 100);

      setAutoCalculated({
        gridSpacing: parseFloat(gridSpacing.toFixed(2)),
        profitPerGrid: parseFloat(profitPerGrid.toFixed(2)),
        maxProfit: parseFloat(maxProfit.toFixed(2)),
        riskAmount: parseFloat(riskAmount.toFixed(2))
      });
    }
  }, [gridPreset, currentPrice]);

  const handleStart = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Validation
      if (gridConfig.investmentAmount > accountBalance * 0.8) {
        setMessage('❌ Investment amount too high (max 80% of balance)');
        setLoading(false);
        return;
      }

      if (gridConfig.upperPrice <= gridConfig.lowerPrice) {
        setMessage('❌ Upper price must be higher than lower price');
        setLoading(false);
        return;
      }

      const config = {
        strategy_name: 'GridBot_Strategy',
        tradingMode,
        gridConfig: {
          ...gridConfig,
          preset: gridPreset
        }
      };

      const result = await onStartStrategy(symbol, config);
      setMessage(result.success ? '✅ Grid Bot started!' : `❌ ${result.message}`);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setMessage('');

    try {
      const result = await onStopStrategy(symbol);
      setMessage(result.success ? '✅ Grid Bot stopped!' : `❌ ${result.message}`);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate grid visualization data
  const getGridVisualizationData = () => {
    const levels = [];
    const step = (gridConfig.upperPrice - gridConfig.lowerPrice) / gridConfig.gridLevels;
    
    for (let i = 0; i <= gridConfig.gridLevels; i++) {
      const price = gridConfig.lowerPrice + (i * step);
      levels.push({
        price: price,
        type: price < currentPrice ? 'buy' : price > currentPrice ? 'sell' : 'current'
      });
    }
    return levels;
  };

  const gridLevels = getGridVisualizationData();
  const performanceData = strategy?.details || {};

  return (
    <div className="grid-bot-panel">
      <div className="panel-header">
        <h3 className="typography-display">🔄 Grid Bot - {symbol}</h3>
        <div className="status-indicator">
          <div className={`status-dot ${isRunning ? 'online' : 'offline'}`}></div>
          {isRunning ? 'Running' : 'Stopped'}
        </div>
      </div>

      {/* Grid Bot Info Banner */}
      <div className="grid-info-banner">
        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--success)' }}>
          ⚡ Grid Trading Bot
        </h4>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Automatically profits from price volatility by buying low and selling high in a predefined range
        </p>
        <div className="grid-features">
          <span className="feature-tag">Automated Trading</span>
          <span className="feature-tag">Range Bound</span>
          <span className="feature-tag">Risk Managed</span>
          <span className="feature-tag">Profit Capture</span>
        </div>
      </div>

      {/* Performance Metrics (if running) */}
      {isRunning && (
        <div className="performance-metrics">
          <div className="metric-card primary">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <div className="metric-label">Total Profit</div>
              <div className="metric-value positive">
                ${(performanceData.total_profits || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🔄</div>
            <div className="metric-content">
              <div className="metric-label">Grid Trades</div>
              <div className="metric-value">{performanceData.total_trades || 0}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <div className="metric-label">Active Orders</div>
              <div className="metric-value">{performanceData.active_orders || 0}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">💼</div>
            <div className="metric-content">
              <div className="metric-label">Position Value</div>
              <div className="metric-value">${(performanceData.position_value || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Preset Selection */}
      <div className="control-section">
        <label className="control-label">Grid Configuration</label>
        <div className="preset-selector">
          {Object.entries(GRID_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              className={`preset-btn ${gridPreset === key ? 'active' : ''} risk-${preset.riskLevel.toLowerCase()}`}
              onClick={() => setGridPreset(key)}
            >
              <div className="preset-header">
                <strong>{key}</strong>
                <span className={`risk-badge risk-${preset.riskLevel.toLowerCase()}`}>
                  {preset.riskLevel} Risk
                </span>
              </div>
              <div className="preset-details">
                <span>{preset.gridLevels} Levels</span>
                <span>${preset.investmentAmount}</span>
                <span>{preset.stopLoss}% Stop</span>
              </div>
              <div className="preset-description">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Price Display */}
      {currentPrice > 0 && (
        <div className="current-price-section">
          <div className="price-label">Current {symbol} Price</div>
          <div className="current-price">${currentPrice.toLocaleString()}</div>
        </div>
      )}

      {/* Grid Configuration Details */}
      <div className="config-grid">
        <div className="control-section">
          <label className="control-label">Grid Type</label>
          <select 
            value={gridConfig.type} 
            onChange={(e) => setGridConfig(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="Arithmetic">Arithmetic - Equal spacing</option>
            <option value="Geometric">Geometric - Percentage spacing</option>
          </select>
        </div>

        <div className="control-section">
          <label className="control-label">Grid Levels</label>
          <input
            type="number"
            value={gridConfig.gridLevels}
            onChange={(e) => setGridConfig(prev => ({ ...prev, gridLevels: parseInt(e.target.value) }))}
            min="5"
            max="50"
          />
        </div>

        <div className="control-section">
          <label className="control-label">Investment Amount ($)</label>
          <input
            type="number"
            value={gridConfig.investmentAmount}
            onChange={(e) => setGridConfig(prev => ({ ...prev, investmentAmount: parseFloat(e.target.value) }))}
            min="100"
            step="100"
          />
        </div>

        <div className="control-section">
          <label className="control-label">Upper Price ($)</label>
          <input
            type="number"
            value={gridConfig.upperPrice}
            onChange={(e) => setGridConfig(prev => ({ ...prev, upperPrice: parseFloat(e.target.value) }))}
            step="0.01"
          />
        </div>

        <div className="control-section">
          <label className="control-label">Lower Price ($)</label>
          <input
            type="number"
            value={gridConfig.lowerPrice}
            onChange={(e) => setGridConfig(prev => ({ ...prev, lowerPrice: parseFloat(e.target.value) }))}
            step="0.01"
          />
        </div>

        <div className="control-section">
          <label className="control-label">Stop Loss (%)</label>
          <input
            type="number"
            value={gridConfig.stopLoss}
            onChange={(e) => setGridConfig(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) }))}
            min="1"
            max="50"
            step="0.5"
          />
        </div>
      </div>

      {/* Grid Preview */}
      <div className="grid-preview">
        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>🎯 Grid Preview</h4>
        <div className="grid-visualization">
          {gridLevels.slice().reverse().map((level, index) => (
            <div 
              key={index} 
              className={`grid-level ${level.type} glass`}
              style={{ 
                padding: '0.5rem', 
                margin: '0.25rem 0', 
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span className="level-price typography-mono">
                ${level.price.toFixed(2)}
              </span>
              <span className={`level-type ${level.type}`}>
                {level.type === 'current' ? 'CURRENT PRICE' : 
                 level.type === 'buy' ? 'BUY ORDER' : 'SELL ORDER'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Profit Calculations */}
      <div className="profit-calculations">
        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>💡 Profit Analysis</h4>
        <div className="calc-grid">
          <div className="calc-item">
            <label>Grid Spacing:</label>
            <span className="typography-mono">${autoCalculated.gridSpacing}</span>
          </div>
          <div className="calc-item">
            <label>Profit per Grid:</label>
            <span className="typography-mono positive">${autoCalculated.profitPerGrid}</span>
          </div>
          <div className="calc-item">
            <label>Max Potential Profit:</label>
            <span className="typography-mono positive">${autoCalculated.maxProfit}</span>
          </div>
          <div className="calc-item">
            <label>Max Risk Amount:</label>
            <span className="typography-mono negative">${autoCalculated.riskAmount}</span>
          </div>
          <div className="calc-item">
            <label>Per Grid Investment:</label>
            <span className="typography-mono">${gridConfig.perGridAmount}</span>
          </div>
          <div className="calc-item">
            <label>Price Range:</label>
            <span className="typography-mono">
              {(((gridConfig.upperPrice - gridConfig.lowerPrice) / currentPrice) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Account Balance Display */}
      {accountBalance && (
        <div className="control-section">
          <div className="glass" style={{ padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="control-label">Account Balance:</span>
              <span className="typography-mono" style={{ color: 'var(--success)', fontWeight: '600' }}>
                ${parseFloat(accountBalance).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        className={`btn-primary grid-start ${isRunning ? 'btn-danger' : ''} gpu-accelerated`}
        onClick={isRunning ? handleStop : handleStart}
        disabled={loading}
      >
        {loading ? '⏳ Processing...' : isRunning ? '🛑 Stop Grid Bot' : '🔄 Start Grid Bot'}
      </button>

      {/* Message Display */}
      {message && (
        <div className={`message-alert ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Grid Bot Education */}
      <div className="grid-education">
        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--success)' }}>
          📚 How Grid Trading Works
        </h4>
        <div className="education-content">
          <div className="education-item">
            <strong>Grid Strategy:</strong>
            <p>Places buy orders below current price and sell orders above, creating a "grid" of orders</p>
          </div>
          <div className="education-item">
            <strong>Profit Mechanism:</strong>
            <p>Each time price moves up and down through grid levels, the bot captures small profits</p>
          </div>
          <div className="education-item">
            <strong>Best Markets:</strong>
            <p>Works best in sideways/ranging markets with regular price fluctuations</p>
          </div>
          <div className="education-item">
            <strong>Risk Management:</strong>
            <p>Stop loss protects against strong trending moves that break the grid range</p>
          </div>
        </div>
      </div>

      {/* Grid Status (if running) */}
      {isRunning && (
        <div className="grid-status glass">
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--success)' }}>🔄 Grid Status</h4>
          <div className="status-item">
            <label>Grid Preset:</label>
            <span>{gridPreset}</span>
          </div>
          <div className="status-item">
            <label>Active Since:</label>
            <span className="typography-mono">
              {strategy?.start_time ? new Date(strategy.start_time).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="status-item">
            <label>Price Range:</label>
            <span className="typography-mono">
              ${gridConfig.lowerPrice} - ${gridConfig.upperPrice}
            </span>
          </div>
          <div className="status-item">
            <label>Current Position:</label>
            <span className="typography-mono">
              {currentPrice > gridConfig.upperPrice ? 'Above Grid' : 
               currentPrice < gridConfig.lowerPrice ? 'Below Grid' : 'In Range'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default GridBotPanel;
