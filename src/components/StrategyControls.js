// src/components/StrategyControls.js - Strategy Management Interface
import React, { useState } from 'react';

const RISK_PROFILES = {
  Conservative: {
    riskPercentage: 0.5,
    leverageMax: 3,
    description: "Low risk, steady growth"
  },
  Moderate: {
    riskPercentage: 1.0,
    leverageMax: 5,
    description: "Balanced risk/reward"
  },
  Aggressive: {
    riskPercentage: 2.0,
    leverageMax: 10,
    description: "High risk, high reward"
  }
};

const EMA_PRESETS = {
  '9/21': { fast: 9, slow: 21, label: 'Fast Scalping (9/21)' },
  '21/51': { fast: 21, slow: 51, label: 'Day Trading (21/51)' },
  '50/100': { fast: 50, slow: 100, label: 'Swing Trading (50/100)' },
  '50/200': { fast: 50, slow: 200, label: 'Golden Cross (50/200)' }
};

function StrategyControls({ symbol, strategy, marketData, accountBalance, onStartStrategy, onStopStrategy }) {
  const [tradingMode, setTradingMode] = useState('Auto');
  const [riskAppetite, setRiskAppetite] = useState('Moderate');
  const [emaPreset, setEmaPreset] = useState('21/51');
  const [timeframe, setTimeframe] = useState('15m');
  const [customEMA, setCustomEMA] = useState({ fast: 21, slow: 51 });
  const [manualRisk, setManualRisk] = useState({
    riskAmount: '1',
    riskType: 'Percentage',
    leverage: 5
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isRunning = strategy?.running || false;

  const handleStart = async () => {
    setLoading(true);
    setMessage('');

    try {
      const config = {
        strategy_name: 'ema_strategy',
        tradingMode,
        timeframe,
        ...(tradingMode === 'Auto' ? {
          riskAppetite,
          emaConfig: {
            preset: emaPreset,
            ...EMA_PRESETS[emaPreset]
          }
        } : {
          emaConfig: {
            preset: emaPreset === 'custom' ? 'custom' : emaPreset,
            fastPeriod: emaPreset === 'custom' ? customEMA.fast : EMA_PRESETS[emaPreset].fast,
            slowPeriod: emaPreset === 'custom' ? customEMA.slow : EMA_PRESETS[emaPreset].slow
          },
          riskManagement: {
            riskType: manualRisk.riskType,
            riskAmount: manualRisk.riskType === 'Percentage' ? `${manualRisk.riskAmount}%` : manualRisk.riskAmount,
            leverage: manualRisk.leverage
          }
        })
      };

      const result = await onStartStrategy(symbol, config);
      setMessage(result.success ? '✅ Strategy started successfully!' : `❌ ${result.message}`);
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
      setMessage(result.success ? '✅ Strategy stopped successfully!' : `❌ ${result.message}`);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="strategy-panel">
      <div className="panel-header">
        <h3 className="typography-display">🎯 Strategy Controls - {symbol}</h3>
        <div className="status-indicator">
          <div className={`status-dot ${isRunning ? 'online' : 'offline'}`}></div>
          {isRunning ? 'Running' : 'Stopped'}
        </div>
      </div>

      {/* Trading Mode */}
      <div className="control-section">
        <label className="control-label">Trading Mode</label>
        <div className="mode-buttons">
          <button 
            className={`mode-btn ${tradingMode === 'Auto' ? 'active' : ''}`}
            onClick={() => setTradingMode('Auto')}
          >
            🤖 Auto Mode
          </button>
          <button 
            className={`mode-btn ${tradingMode === 'Manual' ? 'active' : ''}`}
            onClick={() => setTradingMode('Manual')}
          >
            ⚡ Manual Mode
          </button>
        </div>
      </div>

      {/* Timeframe Selection */}
      <div className="control-section">
        <label className="control-label">Timeframe</label>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          style={{ width: '100%' }}
        >
          <option value="5m">5 Minutes</option>
          <option value="15m">15 Minutes</option>
          <option value="30m">30 Minutes</option>
          <option value="1h">1 Hour</option>
          <option value="4h">4 Hours</option>
        </select>
      </div>

      {/* EMA Strategy Configuration */}
      <div className="control-section">
        <label className="control-label">EMA Strategy</label>
        <select 
          value={emaPreset} 
          onChange={(e) => setEmaPreset(e.target.value)}
          style={{ width: '100%' }}
        >
          {Object.entries(EMA_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>{preset.label}</option>
          ))}
        </select>
      </div>

      {/* Risk Management */}
      {tradingMode === 'Auto' ? (
        <div className="control-section">
          <label className="control-label">Risk Appetite</label>
          <select 
            value={riskAppetite} 
            onChange={(e) => setRiskAppetite(e.target.value)}
            style={{ width: '100%' }}
          >
            {Object.entries(RISK_PROFILES).map(([key, profile]) => (
              <option key={key} value={key}>
                {key} - {profile.description} ({profile.riskPercentage}%, {profile.leverageMax}x max)
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className="control-section">
            <label className="control-label">Risk Amount</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                value={manualRisk.riskAmount}
                onChange={(e) => setManualRisk(prev => ({ ...prev, riskAmount: e.target.value }))}
                style={{ flex: 1 }}
              />
              <select
                value={manualRisk.riskType}
                onChange={(e) => setManualRisk(prev => ({ ...prev, riskType: e.target.value }))}
                style={{ flex: 1 }}
              >
                <option value="Percentage">Percentage</option>
                <option value="Fixed">Fixed Amount</option>
              </select>
            </div>
          </div>

          <div className="control-section">
            <label className="control-label">Leverage</label>
            <input
              type="number"
              value={manualRisk.leverage}
              onChange={(e) => setManualRisk(prev => ({ ...prev, leverage: parseInt(e.target.value) }))}
              min="1"
              max="20"
              style={{ width: '100%' }}
            />
          </div>
        </>
      )}

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
        className={`btn-primary ${isRunning ? 'btn-danger' : ''} gpu-accelerated`}
        onClick={isRunning ? handleStop : handleStart}
        disabled={loading}
      >
        {loading ? '⏳ Processing...' : isRunning ? '🛑 Stop Strategy' : '🚀 Start Strategy'}
      </button>

      {/* Message Display */}
      {message && (
        <div className={`message-alert ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Strategy Info */}
      {isRunning && strategy && (
        <div className="control-section" style={{ marginTop: '1.5rem' }}>
          <div className="glass" style={{ padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--success)' }}>📊 Strategy Status</h4>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Strategy:</span>
                <span className="typography-mono">{strategy.strategy_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mode:</span>
                <span className="typography-mono">{strategy.mode || 'Auto'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Start Time:</span>
                <span className="typography-mono">
                  {strategy.start_time ? new Date(strategy.start_time).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StrategyControls;
