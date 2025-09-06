// src/components/RealCandlestickChart.js - Real Candlestick Chart
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Chart from 'react-apexcharts';
import APIService from '../services/apiService';

// Error Boundary for ApexCharts
class CandlestickErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.warn('Candlestick Error Boundary caught error:', error.message);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    border: '2px dashed #dee2e6',
                    borderRadius: '8px',
                    height: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🕯️</div>
                        <h4>Candlestick Chart Error</h4>
                        <p>Chart temporarily disabled to prevent errors</p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

function RealCandlestickChart({ symbol, height = 600, timeframe = "1m" }) {
    const [candles, setCandles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    
    const isMounted = useRef(true);
    const intervalRef = useRef(null);

    // Fetch real candle data
    const fetchCandles = useCallback(async () => {
        if (!symbol || !isMounted.current) return;

        try {
            setError(null);
            console.log(`📊 Fetching real candles for ${symbol}...`);
            
            const response = await APIService.getCandles(symbol, timeframe, 50);
            
            if (response && response.success && Array.isArray(response.candles)) {
                const validCandles = response.candles.filter(candle => 
                    candle.timestamp && 
                    candle.open && candle.high && candle.low && candle.close
                );
                
                if (isMounted.current) {
                    setCandles(validCandles);
                    setLastUpdate(new Date());
                    console.log(`✅ Loaded ${validCandles.length} real candles for ${symbol}`);
                }
            } else {
                throw new Error('Invalid candle data received');
            }

        } catch (err) {
            console.error('❌ Real candles fetch error:', err);
            if (isMounted.current) {
                setError(err.message);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [symbol, timeframe]);

    // Setup data fetching
    useEffect(() => {
        fetchCandles();
        
        // Update every 30 seconds for real-time data
        intervalRef.current = setInterval(() => {
            if (isMounted.current) {
                fetchCandles();
            }
        }, 30000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchCandles]);

    // Cleanup
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Prepare chart series data
    const series = [{
        name: `${symbol} Price`,
        data: candles.map(candle => ({
            x: new Date(candle.timestamp),
            y: [
                parseFloat(candle.open),
                parseFloat(candle.high), 
                parseFloat(candle.low),
                parseFloat(candle.close)
            ]
        }))
    }];

    // Chart configuration
    const options = {
        chart: {
            type: 'candlestick',
            height: height,
            background: 'transparent',
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            },
            animations: {
                enabled: false // Disable to prevent DOM errors
            }
        },
        theme: { mode: 'light' },
        title: {
            text: `${symbol} Candlestick Chart (${timeframe})`,
            style: {
                fontSize: '16px',
                fontWeight: '600',
                color: '#2c3e50'
            }
        },
        xaxis: {
            type: 'datetime',
            labels: {
                style: { colors: '#666' },
                rotate: -45
            },
            axisBorder: { color: '#e1e1e1' },
            axisTicks: { color: '#e1e1e1' }
        },
        yaxis: {
            tooltip: { enabled: true },
            labels: {
                style: { colors: '#666' },
                formatter: (val) => `$${val.toFixed(2)}`
            }
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 3
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#10B981',   // Green for bullish candles
                    downward: '#EF4444'  // Red for bearish candles
                },
                wick: { 
                    useFillColor: true 
                }
            }
        },
        tooltip: {
            enabled: true,
            theme: 'light',
            custom: function({ seriesIndex, dataPointIndex, w }) {
                try {
                    const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                    const candle = candles[dataPointIndex];
                    
                    return `
                        <div style="padding: 12px; background: white; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <div style="font-weight: bold; margin-bottom: 8px; color: #2c3e50;">
                                ${new Date(data.x).toLocaleString()}
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
                                <div><strong>Open:</strong> $${data.y[0].toFixed(2)}</div>
                                <div><strong>High:</strong> $${data.y[1].toFixed(2)}</div>
                                <div><strong>Low:</strong> $${data.y[2].toFixed(2)}</div>
                                <div><strong>Close:</strong> $${data.y[3].toFixed(2)}</div>
                            </div>
                            ${candle?.volume ? `<div style="margin-top: 8px; font-size: 12px; color: #666;"><strong>Volume:</strong> ${parseFloat(candle.volume).toLocaleString()}</div>` : ''}
                        </div>
                    `;
                } catch (error) {
                    return '<div style="padding: 8px;">Tooltip data unavailable</div>';
                }
            }
        },
        responsive: [{
            breakpoint: 768,
            options: {
                chart: {
                    height: 300
                }
            }
        }]
    };

    if (loading) {
        return (
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                height: `${height}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <div>Loading Real {symbol} Candles...</div>
                    <style jsx>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: '#fdf2f2',
                border: '1px solid #e74c3c',
                borderRadius: '8px',
                height: `${height}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div>
                    <h4 style={{ color: '#e74c3c', marginBottom: '1rem' }}>
                        Real Candle Data Error
                    </h4>
                    <p style={{ marginBottom: '1rem' }}>{error}</p>
                    <button 
                        onClick={fetchCandles}
                        style={{
                            backgroundColor: '#3498db',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Retry Real Data
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            {/* Chart Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>
                    🕯️ {symbol} Real Candlestick Chart
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {candles.length > 0 && (
                        <div style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#e8f6f3',
                            border: '1px solid #1dd1a1',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            color: '#2c3e50'
                        }}>
                            ${candles[candles.length - 1]?.close?.toFixed(2)}
                        </div>
                    )}
                    <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                        {lastUpdate && `Updated: ${lastUpdate.toLocaleTimeString()}`}
                    </div>
                </div>
            </div>

            {/* Candlestick Chart */}
            <CandlestickErrorBoundary>
                {candles.length > 0 ? (
                    <Chart
                        options={options}
                        series={series}
                        type="candlestick"
                        height={height}
                    />
                ) : (
                    <div style={{
                        height: `${height}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px'
                    }}>
                        <div style={{ textAlign: 'center', color: '#6c757d' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕯️</div>
                            <div>No candle data available</div>
                        </div>
                    </div>
                )}
            </CandlestickErrorBoundary>

            {/* Chart Info */}
            <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#e8f6f3',
                border: '1px solid #1dd1a1',
                borderRadius: '4px',
                fontSize: '0.875rem',
                color: '#2c3e50',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <span><strong>✅ REAL OHLCV DATA:</strong> Live {symbol} candles from Delta Exchange</span>
                <span>Candles: {candles.length}</span>
                <span>Timeframe: {timeframe}</span>
                <span>Auto-refresh: 30s</span>
            </div>
        </div>
    );
}

export default RealCandlestickChart;
