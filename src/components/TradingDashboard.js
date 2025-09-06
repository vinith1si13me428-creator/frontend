// src/components/TradingDashboard.js - Complete Main Trading Interface
import React, { useState, useEffect, useCallback, useRef } from 'react';
import APIService from '../services/apiService';
import StrategyControls from './StrategyControls';
import PositionMonitor from './PositionMonitor';
import MarketData from './MarketData';
import PerformanceMetrics from './PerformanceMetrics';
import SMCStrategyPanel from './SMCStrategyPanel';
import SMCChart from './SMCChart';
import GridBotPanel from './GridBotPanel';
import AlertsPanel from './AlertsPanel';
import OrderBook from './OrderBook';
import RealTimeChart from './RealTimeChart';
import RealTimeMetrics from './RealTimeMetrics';
import RealCandlestickChart from './RealCandlestickChart';

// Error Boundary Component (inline)
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="premium-card glass" style={{
                    padding: '2rem',
                    border: '1px solid #e74c3c',
                    borderRadius: '8px',
                    backgroundColor: '#fdf2f2',
                    margin: '1rem'
                }}>
                    <h3 style={{ color: '#e74c3c', marginBottom: '1rem' }}>
                        ⚠️ Component Error Detected
                    </h3>
                    <p>Something went wrong with this component.</p>
                    <button 
                        onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                        className="btn-primary"
                        style={{
                            backgroundColor: '#3498db',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '1rem'
                        }}
                    >
                        🔄 Try Again
                    </button>
                    <details style={{ marginTop: '1rem' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                            Show Error Details
                        </summary>
                        <pre style={{ 
                            backgroundColor: '#f8f9fa', 
                            padding: '1rem', 
                            borderRadius: '4px',
                            overflow: 'auto',
                            fontSize: '12px'
                        }}>
                            {this.state.error && this.state.error.toString()}
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

// Safe Component Wrapper
const SafeComponent = ({ Component, fallback, ...props }) => {
    if (!Component) {
        return fallback || (
            <div className="premium-card">
                <p>⚠️ Component not available</p>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <Component {...props} />
        </ErrorBoundary>
    );
};

// Constants
const TRACKED_SYMBOLS = ["BTCUSD", "ETHUSD", "XRPUSD", "SOLUSD"];
const UPDATE_INTERVALS = {
    market: 5000,
    strategies: 10000,
    positions: 15000,
    health: 30000
};

function TradingDashboard() {
    // Core State Management
    const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');
    const [selectedStrategyType, setSelectedStrategyType] = useState('ema_strategy');
    const [availableStrategies, setAvailableStrategies] = useState([]);
    const [strategies, setStrategies] = useState({});
    const [marketData, setMarketData] = useState({});
    const [accountData, setAccountData] = useState({
        balance: 0,
        wallet: []
    });
    const [positionData, setPositionData] = useState({});
    const [tradeData, setTradeData] = useState([]);
    const [tradeStats, setTradeStats] = useState({});
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [retryCount, setRetryCount] = useState(0);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showMetrics, setShowMetrics] = useState(false);
    const [alertsCount, setAlertsCount] = useState(0);
    const [systemHealth, setSystemHealth] = useState({});

    // Additional Enhanced State
    const [data, setData] = useState({
        health: null,
        strategies: {},
        marketData: {},
        trades: []
    });

    // Refs for cleanup and mounting state
    const isMounted = useRef(true);
    const timeoutRef = useRef(null);
    const intervalRef = useRef(null);
    const fetchInProgress = useRef(false);
    const wsRef = useRef(null);

    // Apply dark theme to body on mount
    useEffect(() => {
        document.body.style.backgroundColor = '#0B0E16';
        document.body.style.color = '#F8FAFC';
        document.body.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
        
        const root = document.getElementById('root');
        if (root) {
            root.style.backgroundColor = '#0B0E16';
            root.style.color = '#F8FAFC';
            root.style.minHeight = '100vh';
        }

        return () => {
            document.body.style.backgroundColor = '';
            document.body.style.color = '';
            document.body.style.fontFamily = '';
            if (root) {
                root.style.backgroundColor = '';
                root.style.color = '';
                root.style.minHeight = '';
            }
        };
    }, []);

    // Safe state setter that checks if component is still mounted
    const safeSetState = useCallback((setter, value) => {
        if (isMounted.current) {
            setter(value);
        }
    }, []);

    // Strategy display name mapping
    const getStrategyDisplayName = useCallback((strategyName) => {
        const mapping = {
            'ema_strategy': '📈 EMA Strategy',
            'smc_strategy': '🎯 SMC Strategy',
            'gridbot_strategy': '🤖 Grid Bot',
            'GridBot_Strategy': '🤖 Grid Bot',
            'SMC_Strategy': '🎯 SMC Strategy'
        };
        return mapping[strategyName] || strategyName;
    }, []);

    // Fetch Available Strategies
    const fetchAvailableStrategies = useCallback(async () => {
        try {
            console.log('📋 Fetching available strategies...');
            const response = await APIService.getAvailableStrategies();
            
            if (response && response.success) {
                const allStrategies = [
                    ...response.result.built_in,
                    ...response.result.discovered,
                    ...response.result.current_directory
                ];
                safeSetState(setAvailableStrategies, allStrategies);
                console.log('✅ Available strategies loaded:', allStrategies);
                return true;
            } else {
                console.error('❌ Invalid strategies response:', response);
                throw new Error('Invalid response from strategies endpoint');
            }
        } catch (error) {
            console.error('❌ Failed to fetch available strategies:', error);
            safeSetState(setError, `Failed to load available strategies: ${error.message}`);
            return false;
        }
    }, [safeSetState]);

    // Fetch strategies status
    const fetchStrategiesStatus = useCallback(async () => {
        try {
            const statusResponse = await APIService.getAllStrategiesStatus();
            safeSetState(setStrategies, statusResponse || {});
        } catch (error) {
            console.error('Failed to fetch strategy statuses:', error);
        }
    }, [safeSetState]);

    // Fetch market data for all symbols
    const fetchMarketData = useCallback(async () => {
        try {
            const marketResponse = {};
            for (const symbol of TRACKED_SYMBOLS) {
                try {
                    const data = await APIService.getMarketData(symbol);
                    marketResponse[symbol] = data;
                } catch (err) {
                    console.error(`Failed to fetch market data for ${symbol}:`, err);
                    marketResponse[symbol] = {};
                }
            }
            safeSetState(setMarketData, marketResponse);
        } catch (error) {
            console.error('Failed to fetch market data:', error);
        }
    }, [safeSetState]);

    // Fetch wallet data
    const fetchWalletData = useCallback(async () => {
        try {
            const walletResponse = await APIService.getWallet();
            safeSetState(setAccountData, prev => ({
                ...prev,
                wallet: walletResponse || []
            }));
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
        }
    }, [safeSetState]);

    // Fetch position data
    const fetchPositionData = useCallback(async () => {
        try {
            const positionResponse = {};
            for (const symbol of TRACKED_SYMBOLS) {
                try {
                    const data = await APIService.getPositions(symbol);
                    positionResponse[symbol] = data;
                } catch (err) {
                    console.error(`Failed to fetch position for ${symbol}:`, err);
                    positionResponse[symbol] = {};
                }
            }
            safeSetState(setPositionData, positionResponse);
        } catch (error) {
            console.error('Failed to fetch position data:', error);
        }
    }, [safeSetState]);

    // Fetch trade data
    const fetchTradeData = useCallback(async () => {
        try {
            const [tradesResponse, statsResponse] = await Promise.all([
                APIService.getTrades(),
                APIService.getTradeStats()
            ]);
            safeSetState(setTradeData, tradesResponse || []);
            safeSetState(setTradeStats, statsResponse || {});
        } catch (error) {
            console.error('Failed to fetch trade data:', error);
        }
    }, [safeSetState]);

    // Fetch system health
    const fetchSystemHealth = useCallback(async () => {
        try {
            const healthResponse = await APIService.getSystemHealth();
            safeSetState(setSystemHealth, healthResponse || {});
        } catch (error) {
            console.error('Failed to fetch system health:', error);
        }
    }, [safeSetState]);

    // Enhanced data fetching with comprehensive error handling
    const fetchData = useCallback(async () => {
        if (!isMounted.current || fetchInProgress.current) {
            return;
        }

        fetchInProgress.current = true;

        try {
            console.log('📊 Starting dashboard data fetch...');
            
            safeSetState(setError, null);
            safeSetState(setConnectionStatus, 'connecting');

            // First fetch available strategies
            console.log('📡 Testing API connectivity and loading strategies...');
            const strategiesLoaded = await fetchAvailableStrategies();
            if (!strategiesLoaded) {
                throw new Error('Failed to load available strategies');
            }

            // Test basic connectivity
            const basicResults = await Promise.allSettled([
                APIService.getHealth(),
                APIService.getAllStrategiesStatus(),
                APIService.getWallet()
            ]);

            if (!isMounted.current) return;

            // Process health result
            const healthResult = basicResults[0];
            if (healthResult.status === 'fulfilled') {
                console.log('✅ Health check successful:', healthResult.value);
                safeSetState(setConnectionStatus, 'connected');
                
                const healthData = healthResult.value;
                safeSetState(setAccountData, prev => ({
                    ...prev,
                    balance: healthData.account_balance || 0
                }));
            } else {
                console.error('❌ Health check failed:', healthResult.reason);
                throw new Error(`Health check failed: ${healthResult.reason?.message}`);
            }

            // Process strategies result
            const strategiesResult = basicResults[1];
            if (strategiesResult.status === 'fulfilled') {
                console.log('✅ Strategies data retrieved:', strategiesResult.value);
                safeSetState(setStrategies, strategiesResult.value || {});
            } else {
                console.warn('⚠️ Strategies fetch failed:', strategiesResult.reason);
                safeSetState(setStrategies, {});
            }

            // Process wallet result
            const walletResult = basicResults[2];
            if (walletResult.status === 'fulfilled') {
                console.log('✅ Wallet data retrieved:', walletResult.value);
                safeSetState(setAccountData, prev => ({
                    ...prev,
                    wallet: walletResult.value || []
                }));
            } else {
                console.warn('⚠️ Wallet fetch failed:', walletResult.reason);
            }

            // Fetch market data for all symbols
            console.log('📈 Fetching market data for symbols:', TRACKED_SYMBOLS);
            const marketPromises = TRACKED_SYMBOLS.map(async (symbol) => {
                try {
                    if (!isMounted.current) return { symbol, data: {} };
                    
                    console.log(`📊 Fetching market data for ${symbol}...`);
                    const data = await APIService.getMarketData(symbol);
                    console.log(`✅ Market data for ${symbol}:`, data);
                    return { symbol, data: data || {} };
                } catch (err) {
                    console.warn(`⚠️ Market data failed for ${symbol}:`, err);
                    return { symbol, data: {} };
                }
            });

            const marketResults = await Promise.all(marketPromises);
            
            if (!isMounted.current) return;

            const newMarketData = {};
            marketResults.forEach(({ symbol, data }) => {
                newMarketData[symbol] = data;
            });
            safeSetState(setMarketData, newMarketData);

            // Fetch additional data
            await Promise.allSettled([
                fetchPositionData(),
                fetchTradeData(),
                fetchSystemHealth()
            ]);

            // Update last update timestamp
            safeSetState(setLastUpdate, new Date());
            safeSetState(setRetryCount, 0);

            console.log('🎉 All dashboard data loaded successfully');

        } catch (err) {
            console.error('❌ Dashboard data fetch error:', err);
            safeSetState(setError, err.message || 'Unknown error occurred');
            safeSetState(setConnectionStatus, 'error');
            safeSetState(setRetryCount, prev => prev + 1);
        } finally {
            if (isMounted.current) {
                safeSetState(setLoading, false);
            }
            fetchInProgress.current = false;
        }
    }, [safeSetState, fetchAvailableStrategies, fetchPositionData, fetchTradeData, fetchSystemHealth]);

    // Strategy management functions with error handling
    const handleStartStrategy = useCallback(async (symbol, config) => {
        try {
            console.log(`🎯 Starting strategy for ${symbol}:`, config);
            
            // Ensure strategy_name is set correctly
            const finalConfig = {
                ...config,
                strategy_name: config.strategy_name || selectedStrategyType
            };
            
            const result = await APIService.startStrategy(symbol, finalConfig);
            console.log(`Strategy start result:`, result);
            
            if (result && result.success && isMounted.current) {
                // Refresh data after successful strategy start
                setTimeout(() => {
                    if (isMounted.current) {
                        fetchData();
                    }
                }, 1000);
                
                // Update alerts count
                safeSetState(setAlertsCount, prev => prev + 1);
            }
            return result || { success: false, message: 'No response from server' };
        } catch (error) {
            console.error(`❌ Start strategy error:`, error);
            return { success: false, message: error.message };
        }
    }, [selectedStrategyType, fetchData, safeSetState]);

    const handleStopStrategy = useCallback(async (symbol) => {
        try {
            console.log(`🛑 Stopping strategy for ${symbol}`);
            const result = await APIService.stopStrategy(symbol);
            console.log(`Strategy stop result:`, result);
            
            if (result && result.success && isMounted.current) {
                // Refresh data after successful strategy stop
                setTimeout(() => {
                    if (isMounted.current) {
                        fetchData();
                    }
                }, 1000);
                
                // Update alerts count
                safeSetState(setAlertsCount, prev => prev + 1);
            }
            return result || { success: false, message: 'No response from server' };
        } catch (error) {
            console.error(`❌ Stop strategy error:`, error);
            return { success: false, message: error.message };
        }
    }, [fetchData, safeSetState]);

    // Handle manual refresh
    const handleRefresh = useCallback(() => {
        safeSetState(setLoading, true);
        fetchData();
    }, [fetchData, safeSetState]);

    // Handle retry with exponential backoff
    const handleRetry = useCallback(() => {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
            if (isMounted.current) {
                fetchData();
            }
        }, delay);
    }, [retryCount, fetchData]);

    // Render strategy selection tabs
    const renderStrategyTabs = () => (
        <div className="premium-card strategy-tabs">
            <div className="panel-header">
                <h3 className="typography-display">Trading Strategies</h3>
                <div className="status-indicator">
                    <span className={`status-dot ${connectionStatus === 'connected' ? 'online' : 'offline'}`}></span>
                    <span>
                        {connectionStatus === 'connected' ? 'Connected' : 
                         connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                    </span>
                    {alertsCount > 0 && (
                        <span className="alert-badge">
                            {alertsCount}
                        </span>
                    )}
                </div>
            </div>
            <div className="mode-buttons">
                {availableStrategies.length > 0 ? (
                    availableStrategies.map(strategy => (
                        <button
                            key={strategy}
                            className={`mode-btn ${selectedStrategyType === strategy ? 'active' : ''}`}
                            onClick={() => setSelectedStrategyType(strategy)}
                            disabled={loading}
                        >
                            {getStrategyDisplayName(strategy)}
                            {Object.values(strategies).some(s => 
                                s.running && 
                                (s.strategy_name === strategy || s.info?.toLowerCase().includes(strategy.toLowerCase()))
                            ) && <span className="status-dot online">●</span>}
                        </button>
                    ))
                ) : (
                    <div className="empty-state">
                        <span>⚠️ No strategies available</span>
                        <button 
                            onClick={fetchAvailableStrategies}
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    // Render symbol selector
    const renderSymbolSelector = () => (
        <div className="premium-card symbol-selector">
            <h4 className="control-label">Select Trading Pair</h4>
            <div className="symbol-buttons">
                {TRACKED_SYMBOLS.map(symbol => {
                    const price = parseFloat(marketData[symbol]?.mark_price || 0);
                    const change = parseFloat(marketData[symbol]?.change_24h || 0);
                    const isRunning = Object.values(strategies).some(s => s.running && s.symbol === symbol);
                    
                    return (
                        <button
                            key={symbol}
                            className={`symbol-btn ${selectedSymbol === symbol ? 'active' : ''} ${isRunning ? 'running' : ''}`}
                            onClick={() => setSelectedSymbol(symbol)}
                        >
                            <div className="symbol typography-mono">{symbol}</div>
                            <div className="price-showcase">
                                <div className="price-value typography-mono">
                                    ${price.toLocaleString()}
                                </div>
                                <div className={`price-change ${change >= 0 ? 'positive' : 'negative'}`}>
                                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                </div>
                            </div>
                            {isRunning && (
                                <div className="status-dot online"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // Render navigation tabs
    const renderNavigationTabs = () => (
        <div className="premium-card">
            <div className="mode-buttons">
                <button
                    className={`mode-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    📊 Dashboard
                </button>
                <button
                    className={`mode-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    📈 Analytics
                </button>
                <button
                    className={`mode-btn ${activeTab === 'positions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('positions')}
                >
                    💼 Positions
                </button>
                <button
                    className={`mode-btn ${activeTab === 'alerts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alerts')}
                >
                    🔔 Alerts {alertsCount > 0 && <span className="alert-badge">{alertsCount}</span>}
                </button>
                <button
                    className={`mode-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Settings
                </button>
            </div>
        </div>
    );

    // Get appropriate strategy panel based on strategy type
    const getStrategyPanel = useCallback(() => {
        const currentStrategy = strategies[selectedSymbol];

        console.log(`Rendering strategy panel for ${selectedSymbol}:`, currentStrategy);
        console.log(`Selected strategy type: ${selectedStrategyType}`);

        if (availableStrategies.length === 0) {
            return (
                <div className="premium-card empty-state">
                    <h3>⚠️ No Strategies Available</h3>
                    <p>No trading strategies found. Please check your backend configuration.</p>
                    <button 
                        onClick={fetchAvailableStrategies} 
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Refreshing...' : 'Refresh Strategies'}
                    </button>
                </div>
            );
        }

        // Show panel based on selected strategy type
        const strategyToShow = selectedStrategyType;

        const commonProps = {
            symbol: selectedSymbol,
            strategy: currentStrategy,
            marketData: marketData[selectedSymbol] || {},
            walletData: accountData,
            accountBalance: accountData.balance || 0,
            positionData: positionData[selectedSymbol] || {},
            onStartStrategy: handleStartStrategy,
            onStopStrategy: handleStopStrategy,
            loading: loading
        };

        try {
            switch (strategyToShow) {
                case 'smc_strategy':
                case 'SMC_Strategy':
                    return (
                        <ErrorBoundary>
                            <div className="premium-card strategy-panel">
                                <div className="panel-header">
                                    <h3>🎯 Smart Money Concepts Strategy</h3>
                                    {currentStrategy?.running && (
                                        <span className="status-dot online">RUNNING</span>
                                    )}
                                </div>
                                <SMCStrategyPanel {...commonProps} />
                                {currentStrategy?.running && (
                                    <div className="market-stats-grid">
                                        <div className="stat-card">
                                            <div className="stat-label">Market Structure:</div>
                                            <div className="stat-value">
                                                {currentStrategy.details?.market_structure || 'RANGING'}
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-label">Order Blocks:</div>
                                            <div className="stat-value">
                                                {currentStrategy.details?.order_blocks || 0}
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-label">FVGs:</div>
                                            <div className="stat-value">
                                                {currentStrategy.details?.fvgs || 0}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ErrorBoundary>
                    );

                case 'gridbot_strategy':
                case 'GridBot_Strategy':
                    return (
                        <ErrorBoundary>
                            <div className="premium-card strategy-panel">
                                <div className="panel-header">
                                    <h3>🤖 Grid Trading Bot</h3>
                                    {currentStrategy?.running && (
                                        <span className="status-dot online">RUNNING</span>
                                    )}
                                </div>
                                <GridBotPanel {...commonProps} />
                                {currentStrategy?.running && (
                                    <div className="market-stats-grid">
                                        <div className="stat-card">
                                            <div className="stat-label">Active Orders:</div>
                                            <div className="stat-value">
                                                {currentStrategy.details?.active_orders || 0}
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-label">Total Profits:</div>
                                            <div className="stat-value positive">
                                                ${(currentStrategy.details?.total_profits || 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-label">Grid Levels:</div>
                                            <div className="stat-value">
                                                {currentStrategy.details?.grid_levels || 0}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ErrorBoundary>
                    );

                case 'ema_strategy':
                default:
                    return (
                        <ErrorBoundary>
                            <div className="premium-card strategy-panel">
                                <div className="panel-header">
                                    <h3>📈 EMA Crossover Strategy</h3>
                                    {currentStrategy?.running && (
                                        <span className="status-dot online">RUNNING</span>
                                    )}
                                </div>
                                <StrategyControls {...commonProps} />
                                {currentStrategy?.running && (
                                    <div className="market-stats-grid">
                                        <div className="stat-card">
                                            <div className="stat-label">Fast EMA:</div>
                                            <div className="stat-value typography-mono">
                                                {currentStrategy.details?.fast_ema?.toFixed(2) || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-label">Slow EMA:</div>
                                            <div className="stat-value typography-mono">
                                                {currentStrategy.details?.slow_ema?.toFixed(2) || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-label">Last Signal:</div>
                                            <div className={`stat-value ${
                                                currentStrategy.details?.last_signal === 'buy' ? 'positive' : 
                                                currentStrategy.details?.last_signal === 'sell' ? 'negative' : ''
                                            }`}>
                                                {currentStrategy.details?.last_signal?.toUpperCase() || 'None'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ErrorBoundary>
                    );
            }
        } catch (error) {
            console.error('Strategy panel render error:', error);
            return (
                <div className="premium-card message-alert error">
                    <p>⚠️ Strategy panel error. Please refresh the page.</p>
                    <button 
                        onClick={handleRefresh} 
                        className="btn-primary"
                    >
                        🔄 Refresh
                    </button>
                </div>
            );
        }
    }, [selectedSymbol, selectedStrategyType, strategies, marketData, accountData, positionData, handleStartStrategy, handleStopStrategy, loading, availableStrategies, fetchAvailableStrategies, handleRefresh]);

    // Render dashboard content based on active tab
    const renderDashboardContent = () => {
        switch (activeTab) {
            case 'analytics':
                return (
                    <div className="dashboard-grid">
                        <ErrorBoundary>
                            <div className="premium-card">
                                <PerformanceMetrics 
                                    trades={tradeData}
                                    stats={tradeStats}
                                    strategy={Object.values(strategies).find(s => s.running && s.symbol === selectedSymbol)}
                                />
                            </div>
                        </ErrorBoundary>
                        <ErrorBoundary>
                            <div className="premium-card chart-section">
                                <RealTimeChart 
                                    symbol={selectedSymbol}
                                    timeframe="15m"
                                    strategy={Object.values(strategies).find(s => s.running && s.symbol === selectedSymbol)}
                                />
                            </div>
                        </ErrorBoundary>
                    </div>
                );

            case 'positions':
                return (
                    <div className="dashboard-grid">
                        {TRACKED_SYMBOLS.map(symbol => (
                            <ErrorBoundary key={symbol}>
                                <div className="premium-card">
                                    <PositionMonitor 
                                        symbol={symbol}
                                        position={positionData[symbol]}
                                        strategy={Object.values(strategies).find(s => s.running && s.symbol === symbol)}
                                        marketData={marketData[symbol]}
                                    />
                                </div>
                            </ErrorBoundary>
                        ))}
                    </div>
                );

            case 'alerts':
                return (
                    <div className="premium-card alerts-panel">
                        <ErrorBoundary>
                            <AlertsPanel 
                                symbol={selectedSymbol}
                                strategy={Object.values(strategies).find(s => s.running && s.symbol === selectedSymbol)}
                                onClearAlerts={() => setAlertsCount(0)}
                            />
                        </ErrorBoundary>
                    </div>
                );

            case 'settings':
                return (
                    <div className="premium-card">
                        <div className="panel-header">
                            <h3>System Settings</h3>
                        </div>
                        <div className="control-section">
                            <label className="control-label">
                                <input
                                    type="checkbox"
                                    checked={showMetrics}
                                    onChange={(e) => setShowMetrics(e.target.checked)}
                                />
                                Show Real-time Metrics
                            </label>
                        </div>
                        <div className="control-section">
                            <label className="control-label">Update Interval (ms):</label>
                            <select 
                                className="form-control"
                                value={UPDATE_INTERVALS.market} 
                                onChange={(e) => {
                                    const newInterval = parseInt(e.target.value);
                                    // Update interval logic would go here
                                }}
                            >
                                <option value={1000}>1 second</option>
                                <option value={2000}>2 seconds</option>
                                <option value={5000}>5 seconds</option>
                                <option value={10000}>10 seconds</option>
                            </select>
                        </div>
                        <div className="control-section">
                            <h4 className="control-label">System Health</h4>
                            <pre className="typography-mono" style={{
                                backgroundColor: '#2c3e50',
                                color: '#ecf0f1',
                                padding: '1rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                overflow: 'auto',
                                maxHeight: '300px'
                            }}>
                                {JSON.stringify(systemHealth, null, 2)}
                            </pre>
                        </div>
                    </div>
                );

            case 'dashboard':
            default:
                return (
                    <div className="dashboard-grid">
                        {/* Strategy Panel */}
                        <div className="dashboard-section strategy-section">
                            <div className="control-section">
                                <div className="control-label">
                                    Strategy Control Panel
                                    <span style={{ fontSize: '0.75rem', color: '#7f8c8d', marginLeft: '1rem' }}>
                                        {lastUpdate ? `Updated: ${lastUpdate.toLocaleTimeString()}` : 'Not updated'}
                                    </span>
                                </div>
                                {getStrategyPanel()}
                            </div>
                        </div>

                        {/* Market Data Panel */}
                        <div className="premium-card">
                            <ErrorBoundary>
                                <MarketData 
                                    symbol={selectedSymbol}
                                    data={marketData[selectedSymbol]}
                                    connectionStatus={connectionStatus}
                                />
                            </ErrorBoundary>
                        </div>

                        {/* Position Monitor */}
                        <div className="premium-card">
                            <ErrorBoundary>
                                <PositionMonitor 
                                    symbol={selectedSymbol}
                                    position={positionData[selectedSymbol]}
                                    strategy={Object.values(strategies).find(s => s.running && s.symbol === selectedSymbol)}
                                    marketData={marketData[selectedSymbol]}
                                />
                            </ErrorBoundary>
                        </div>

                        {/* Performance Metrics */}
                        <div className="premium-card">
                            <ErrorBoundary>
                                <PerformanceMetrics 
                                    trades={tradeData}
                                    stats={tradeStats}
                                    strategy={Object.values(strategies).find(s => s.running && s.symbol === selectedSymbol)}
                                />
                            </ErrorBoundary>
                        </div>

                        {/* Order Book */}
                        <div className="premium-card">
                            <ErrorBoundary>
                                <OrderBook 
                                    symbol={selectedSymbol}
                                />
                            </ErrorBoundary>
                        </div>

                        {/* Real-time Metrics */}
                        {showMetrics && (
                            <div className="premium-card">
                                <ErrorBoundary>
                                    <RealTimeMetrics 
                                        symbol={selectedSymbol}
                                        marketData={marketData[selectedSymbol]}
                                        strategy={Object.values(strategies).find(s => s.running && s.symbol === selectedSymbol)}
                                    />
                                </ErrorBoundary>
                            </div>
                        )}
                    </div>
                );
        }
    };

    // Auto-refresh data with cleanup
    useEffect(() => {
        // Initial load
        fetchData();

        // Set up auto-refresh interval
        intervalRef.current = setInterval(() => {
            if (isMounted.current && !fetchInProgress.current && connectionStatus === 'connected') {
                fetchStrategiesStatus();
                fetchMarketData();
            }
        }, UPDATE_INTERVALS.market);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [fetchData, fetchStrategiesStatus, fetchMarketData, connectionStatus]);

    // WebSocket connection for real-time updates
    useEffect(() => {
        const connectWebSocket = () => {
            try {
                wsRef.current = new WebSocket(`ws://localhost:8000/ws/live/${selectedSymbol}`);
                
                wsRef.current.onopen = () => {
                    console.log('WebSocket connected for', selectedSymbol);
                };
                
                wsRef.current.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        setMarketData(prev => ({
                            ...prev,
                            [selectedSymbol]: { ...prev[selectedSymbol], ...data }
                        }));
                    } catch (error) {
                        console.error('WebSocket message error:', error);
                    }
                };
                
                wsRef.current.onclose = () => {
                    console.log('WebSocket disconnected');
                    // Reconnect after delay
                    setTimeout(connectWebSocket, 5000);
                };
                
                wsRef.current.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };
            } catch (error) {
                console.error('WebSocket connection error:', error);
            }
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [selectedSymbol]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMounted.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
            fetchInProgress.current = false;
        };
    }, []);

    useEffect(() => {
    if (connectionStatus === 'connected') {
        const statusInterval = setInterval(() => {
            if (isMounted.current && !fetchInProgress.current) {
                console.log('🔄 Polling strategy status...');
                fetchStrategiesStatus();
            }
        }, 10000); // Poll every 10 seconds

        return () => {
            if (statusInterval) {
                clearInterval(statusInterval);
            }
        };
    }
}, [connectionStatus, fetchStrategiesStatus]);




    // Loading state with enhanced UI
    if (loading && availableStrategies.length === 0 && !accountData.balance) {
        return (
            <div className="dashboard-container">
                <div className="premium-card glass" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '50vh',
                    textAlign: 'center'
                }}>
                    <div className="loading-content">
                        <div className="loading-spinner"></div>
                        <h3 className="typography-display">Initializing Trading Dashboard...</h3>
                        <p>Connecting to trading systems and loading strategies...</p>
                        
                        {retryCount > 0 && (
                            <div className="message-alert error">
                                <p>Retry attempt: {retryCount}</p>
                                <small>If this persists, check your backend connection</small>
                            </div>
                        )}
                        
                        <div className="market-stats-grid" style={{ marginTop: '2rem' }}>
                            <div className="stat-card">
                                <div className="stat-label">
                                    {connectionStatus !== 'disconnected' ? '✓' : '⏳'} Connecting to backend
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">
                                    {connectionStatus === 'connected' ? '✓' : '⏳'} Loading market data
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">
                                    {availableStrategies.length > 0 ? '✓' : '⏳'} Loading strategies
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">
                                    {!loading ? '✓' : '⏳'} Initializing dashboard
                                </div>
                            </div>
                        </div>

                        <div className="empty-state" style={{ marginTop: '2rem' }}>
                            <p>Taking too long? Check the browser console for errors.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state with enhanced UI and troubleshooting
    if (error && availableStrategies.length === 0 && !accountData.balance) {
        return (
            <div className="dashboard-container">
                <div className="premium-card glass">
                    <div className="message-alert error" style={{ padding: '2rem', textAlign: 'center' }}>
                        <h3 className="typography-display">❌ Dashboard Connection Failed</h3>
                        <p>{error}</p>
                        
                        <div style={{ margin: '2rem 0' }}>
                            <button 
                                className="btn-primary" 
                                onClick={handleRetry} 
                                style={{ marginRight: '1rem' }}
                            >
                                🔄 Retry Connection
                            </button>
                            
                            <button 
                                onClick={() => window.location.reload()} 
                                className="btn-danger"
                            >
                                🔃 Refresh Page
                            </button>
                        </div>
                        
                        <div className="empty-state">
                            <h4>🔧 Troubleshooting Steps:</h4>
                            <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                                <li>Ensure backend server is running on port 8000</li>
                                <li>Check your API credentials in the .env file</li>
                                <li>Verify database connection is working</li>
                                <li>Check browser console for detailed errors</li>
                                <li>Try accessing http://127.0.0.1:8000/api/health directly</li>
                                <li>Verify CORS configuration in backend</li>
                            </ul>
                            
                            <details style={{ marginTop: '1rem' }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                                    Show Debug Information
                                </summary>
                                <pre className="typography-mono" style={{ 
                                    backgroundColor: '#2c3e50', 
                                    color: '#ecf0f1', 
                                    padding: '1rem', 
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    overflow: 'auto',
                                    textAlign: 'left'
                                }}>
                                    {JSON.stringify({
                                        error: error,
                                        retryCount: retryCount,
                                        connectionStatus: connectionStatus,
                                        timestamp: new Date().toISOString(),
                                        selectedSymbol: selectedSymbol,
                                        strategiesCount: Object.keys(strategies).length,
                                        availableStrategiesCount: availableStrategies.length,
                                        lastUpdate: lastUpdate?.toISOString() || null
                                    }, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main dashboard render
    return (
        <ErrorBoundary>
            <div className="dashboard-container">
                {/* Dashboard Header */}
                <div className="dashboard-header">
                    <div className="brand-section">
                        <h1 className="typography-display">🚀 VY Trading Bot</h1>
                        <div className="version-badge">v2.0.0 Professional</div>
                    </div>
                    
                    <div className="status-indicator">
                        <div className={`status-dot ${connectionStatus === 'connected' ? 'online' : 'offline'}`}></div>
                        <span>
                            {connectionStatus === 'connected' ? 'Connected' : 
                             connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                        </span>
                        
                        <button 
                            onClick={handleRefresh} 
                            disabled={loading}
                            className="btn-primary"
                            style={{ marginLeft: '1rem', padding: '0.5rem 1rem', width: 'auto' }}
                        >
                            {loading ? '⏳' : '🔄'} Refresh
                        </button>
                        
                        {lastUpdate && (
                            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginLeft: '1rem' }}>
                                Updated: {lastUpdate.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Strategy Selection */}
                {renderStrategyTabs()}
                
                {/* Symbol Selection */}
                {renderSymbolSelector()}

                {/* Navigation Tabs */}
                {renderNavigationTabs()}

                {/* Main Dashboard Content */}
                {renderDashboardContent()}

                {/* Strategy-specific Charts */}
                {Object.values(strategies).some(s => s.running && s.symbol === selectedSymbol) ? (
                    <div className="premium-card chart-section" style={{ minHeight: '600px' }}>
                        {(selectedStrategyType === 'smc_strategy' || selectedStrategyType === 'SMC_Strategy') ? (
                            <ErrorBoundary>
                                <SMCChart 
                                    symbol={selectedSymbol}
                                    strategy={Object.values(strategies).find(s => s.running && s.symbol === selectedSymbol)}
                                    height={600}
                                />
                            </ErrorBoundary>
                        ) : (
                            <ErrorBoundary>
                                <RealCandlestickChart 
                                    symbol={selectedSymbol}
                                    timeframe="15m"
                                    strategy={Object.values(strategies).find(s => s.running && s.symbol === selectedSymbol)}
                                    height={600}
                                />
                            </ErrorBoundary>
                        )}
                    </div>
                ) : (
                    <div className="premium-card chart-section empty-state">
                        <div className="empty-icon">📈</div>
                        <h3>Chart Available When Strategy Running</h3>
                        <p className="empty-subtitle">Start a trading strategy to see real-time charts and analysis</p>
                    </div>
                )}

                {/* Loading overlay for refreshes */}
                {loading && (availableStrategies.length > 0 || accountData.balance > 0) && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999
                    }}>
                        <div className="premium-card glass">
                            <div className="loading-spinner"></div>
                            <span>Updating...</span>
                        </div>
                    </div>
                )}

                {/* Error Notification */}
                {error && (availableStrategies.length > 0 || accountData.balance > 0) && (
                    <div style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 10000,
                        maxWidth: '400px'
                    }}>
                        <div className="message-alert error">
                            <span>⚠️</span>
                            <span style={{ flex: 1, marginLeft: '0.5rem' }}>{error}</span>
                            <button 
                                onClick={() => setError(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.25rem',
                                    cursor: 'pointer',
                                    marginLeft: '1rem'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="dashboard-footer premium-card">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        <span>Connected to: localhost:8000</span>
                        <span>Strategies Active: {Object.values(strategies).filter(s => s.running).length}</span>
                        <span>Available Strategies: {availableStrategies.length}</span>
                        <span>Total Trades: {tradeStats.total_trades || 0}</span>
                        <span>Win Rate: {tradeStats.win_rate || 0}%</span>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default TradingDashboard;
