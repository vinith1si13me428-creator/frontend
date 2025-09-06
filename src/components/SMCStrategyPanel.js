// src/components/SMCStrategyPanel.js - Smart Money Concepts Configuration Panel
import React, { useState, useEffect } from 'react';
import SMCChart from './SMCChart';

const SMC_PRESETS = {
  'Conservative': {
    lookbackPeriods: 30,
    orderBlockStrength: 'Strong',
    fvgMinSize: 0.15,
    structureConfirmation: 4,
    description: 'High-quality setups only',
    riskLevel: 'Low'
  },
  'Balanced': {
    lookbackPeriods: 50,
    orderBlockStrength: 'Medium',
    fvgMinSize: 0.1,
    structureConfirmation: 3,
    description: 'Balanced approach',
    riskLevel: 'Medium'
  },
  'Aggressive': {
    lookbackPeriods: 80,
    orderBlockStrength: 'Weak',
    fvgMinSize: 0.05,
    structureConfirmation: 2,
    description: 'More signals, higher risk',
    riskLevel: 'High'
  }
};

const TIMEFRAME_RECOMMENDATIONS = {
  '5m': { description: '🔥 Scalping - Quick SMC setups', risk: 'High' },
  '15m': { description: '📈 Intraday - Optimal for SMC', risk: 'Medium' },
  '30m': { description: '📊 Swing - Quality setups', risk: 'Medium' },
  '1H': { description: '🎯 Position - High-quality OBs', risk: 'Low' },
  '4H': { description: '🏛️ Long-term - Institutional levels', risk: 'Low' }
};

function SMCStrategyPanel({ symbol, strategy, marketData, accountBalance, onStartStrategy, onStopStrategy }) {
  const [tradingMode, setTradingMode] = useState('Auto');
  const [smcPreset, setSMCPreset] = useState('Balanced');
  const [timeframe, setTimeframe] = useState('15m');
  const [customSMC, setCustomSMC] = useState({
    lookbackPeriods: 50,
    orderBlockStrength: 'Medium',
    fvgMinSize: 0.1,
    structureConfirmation: 3
  });
  const [riskAppetite, setRiskAppetite] = useState('Moderate');
  const [manualRisk, setManualRisk] = useState({
    riskAmount: '1.5',
    riskType: 'Percentage',
    leverage: 3
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isRunning = strategy?.running || false;

  // Update custom SMC when preset changes
  useEffect(() => {
    if (smcPreset !== 'Custom' && SMC_PRESETS[smcPreset]) {
      setCustomSMC(SMC_PRESETS[smcPreset]);
    }
  }, [smcPreset]);

  const handleStart = async () => {
    setLoading(true);
    setMessage('');

    try {
      const smcConfig = smcPreset === 'Custom' ? customSMC : SMC_PRESETS[smcPreset];

      const config = {
        strategy_name: 'SMC_Strategy',
        tradingMode,
        timeframe,
        smcConfig: {
          preset: smcPreset,
          ...smcConfig
        },
        ...(tradingMode === 'Auto' ? {
          riskAppetite,
          autoCalculated: {
            maxLoss: accountBalance * (riskAppetite === 'Conservative' ? 0.01 : riskAppetite === 'Moderate' ? 0.015 : 0.02),
            leverage: riskAppetite === 'Conservative' ? 2 : riskAppetite === 'Moderate' ? 3 : 5,
            timeframe: timeframe
          }
        } : {
          riskManagement: {
            riskType: manualRisk.riskType,
            riskAmount: manualRisk.riskType === 'Percentage' ? `${manualRisk.riskAmount}%` : manualRisk.riskAmount,
            leverage: manualRisk.leverage
          }
        })
      };

      const result = await onStartStrategy(symbol, config);
      setMessage(result.success ? '✅ SMC Strategy started!' : `❌ ${result.message}`);
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
      setMessage(result.success ? '✅ SMC Strategy stopped!' : `❌ ${result.message}`);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getSMCDescription = () => {
    const preset = smcPreset === 'Custom' ? customSMC : SMC_PRESETS[smcPreset];
    return `${preset.lookbackPeriods} periods | ${preset.orderBlockStrength} OBs | ${preset.fvgMinSize}% FVG | ${preset.structureConfirmation} confirm`;
  };

  const currentPrice = parseFloat(marketData?.mark_price || 0);

  return (
    <div className="smc-strategy-panel">
      <div className="panel-header">
        <h3 className="typography-display">🧠 SMC Strategy - {symbol}</h3>
        <div className="status-indicator">
          <div className={`status-dot ${isRunning ? 'online' : 'offline'}`}></div>
          {isRunning ? 'Running' : 'Stopped'}
        </div>
      </div>

      {/* SMC Info Banner */}
      <div className="smc-info-banner glass">
        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--brand-primary)' }}>
          🎯 Smart Money Concepts Strategy
        </h4>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Institutional trading strategy using market structure, order blocks, fair value gaps, and liquidity concepts
        </p>
        <div className="smc-features">
          <span className="feature-tag">Order Blocks</span>
          <span className="feature-tag">Fair Value Gaps</span>
          <span className="feature-tag">Market Structure</span>
          <span className="feature-tag">Liquidity Sweeps</span>
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
          {Object.entries(TIMEFRAME_RECOMMENDATIONS).map(([tf, info]) => (
            <option key={tf} value={tf}>
              {tf} - {info.description}
            </option>
          ))}
        </select>
        <div className="smc-description">
          Risk Level: <span className={`risk-${TIMEFRAME_RECOMMENDATIONS[timeframe]?.risk?.toLowerCase()}`}>
            {TIMEFRAME_RECOMMENDATIONS[timeframe]?.risk}
          </span>
        </div>
      </div>

      {/* SMC Preset Configuration */}
      <div className="control-section">
        <label className="control-label">SMC Configuration</label>
        <select 
          value={smcPreset} 
          onChange={(e) => setSMCPreset(e.target.value)}
          style={{ width: '100%' }}
        >
          {Object.entries(SMC_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>
              {key} - {preset.description}
            </option>
          ))}
          <option value="Custom">Custom Configuration</option>
        </select>
        <div className="smc-description">
          {getSMCDescription()}
        </div>
      </div>

      {/* Custom SMC Configuration */}
      {smcPreset === 'Custom' && (
        <div className="custom-smc-config glass">
          <div className="smc-param">
            <label>Lookback Periods</label>
            <input
              type="number"
              value={customSMC.lookbackPeriods}
              onChange={(e) => setCustomSMC(prev => ({ ...prev, lookbackPeriods: parseInt(e.target.value) }))}
              min="10"
              max="200"
            />
            <div className="param-help">Number of candles to analyze for structures</div>
          </div>
          
          <div className="smc-param">
            <label>Order Block Strength</label>
            <select
              value={customSMC.orderBlockStrength}
              onChange={(e) => setCustomSMC(prev => ({ ...prev, orderBlockStrength: e.target.value }))}
            >
              <option value="Weak">Weak - More signals</option>
              <option value="Medium">Medium - Balanced</option>
              <option value="Strong">Strong - Quality only</option>
            </select>
          </div>

          <div className="smc-param">
            <label>FVG Minimum Size (%)</label>
            <input
              type="number"
              step="0.01"
              value={customSMC.fvgMinSize}
              onChange={(e) => setCustomSMC(prev => ({ ...prev, fvgMinSize: parseFloat(e.target.value) }))}
              min="0.01"
              max="1"
            />
            <div className="param-help">Minimum gap size to consider valid FVG</div>
          </div>

          <div className="smc-param">
            <label>Structure Confirmation</label>
            <input
              type="number"
              value={customSMC.structureConfirmation}
              onChange={(e) => setCustomSMC(prev => ({ ...prev, structureConfirmation: parseInt(e.target.value) }))}
              min="1"
              max="10"
            />
            <div className="param-help">Number of candles needed to confirm structure</div>
          </div>
        </div>
      )}

      {/* Risk Management */}
      {tradingMode === 'Auto' ? (
        <div className="control-section">
          <label className="control-label">Risk Appetite</label>
          <select 
            value={riskAppetite} 
            onChange={(e) => setRiskAppetite(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="Conservative">Conservative - 1% risk, 2x leverage</option>
            <option value="Moderate">Moderate - 1.5% risk, 3x leverage</option>
            <option value="Aggressive">Aggressive - 2% risk, 5x leverage</option>
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

      {/* Current Price Display */}
      {currentPrice > 0 && (
        <div className="current-price-section glass">
          <div className="price-label">Current {symbol} Price</div>
          <div className="current-price">${currentPrice.toLocaleString()}</div>
        </div>
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
        className={`btn-primary smc-start ${isRunning ? 'btn-danger' : ''} gpu-accelerated`}
        onClick={isRunning ? handleStop : handleStart}
        disabled={loading}
      >
        {loading ? '⏳ Processing...' : isRunning ? '🛑 Stop SMC Strategy' : '🧠 Start SMC Strategy'}
      </button>

      {/* Message Display */}
      {message && (
        <div className={`message-alert ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* SMC Education Section */}
      <div className="smc-education glass">
        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--brand-primary)' }}>
          📚 SMC Concepts
        </h4>
        <div className="concept-grid">
          <div className="concept-item">
            <strong>Order Blocks (OB):</strong>
            <p>Areas where institutions placed large orders, often become support/resistance</p>
          </div>
          <div className="concept-item">
            <strong>Fair Value Gaps (FVG):</strong>
            <p>Price imbalances that market tends to fill, creating trading opportunities</p>
          </div>
          <div className="concept-item">
            <strong>Market Structure:</strong>
            <p>Higher Highs/Lows (bullish) or Lower Highs/Lows (bearish) patterns</p>
          </div>
          <div className="concept-item">
            <strong>Break of Structure (BOS):</strong>
            <p>When price breaks previous significant highs/lows, indicating trend change</p>
          </div>
        </div>
      </div>

      {/* Strategy Status */}
      {isRunning && strategy && (
        <div className="control-section" style={{ marginTop: '1.5rem' }}>
          <div className="glass" style={{ padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--success)' }}>🧠 SMC Strategy Status</h4>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Preset:</span>
                <span className="typography-mono">{smcPreset}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Timeframe:</span>
                <span className="typography-mono">{timeframe}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Structure:</span>
                <span className={`typography-mono structure-${strategy.market_structure?.toLowerCase() || 'ranging'}`}>
                  {strategy.market_structure || 'RANGING'}
                </span>
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

export default SMCStrategyPanel;
