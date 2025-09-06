// src/components/TestComponents.js - Component Debugging Tool

import React, { useState, useEffect } from 'react';

// Import your components ONE BY ONE (uncomment as needed)
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

const ComponentTester = () => {
    const [activeTest, setActiveTest] = useState(null);
    const [testResult, setTestResult] = useState('');
    const [errorCount, setErrorCount] = useState(0);

    // Mock props for testing components
    const mockProps = {
        symbol: 'BTCUSD',
        height: 400,
        strategies: { 'BTCUSD': { running: false, strategy_name: 'test' } },
        marketData: { mark_price: '45000', change_24h: '2.5' },
        accountBalance: 10000,
        onStartStrategy: () => console.log('Start strategy called'),
        onStopStrategy: () => console.log('Stop strategy called'),
        positions: []
    };

    // Monitor console errors during testing
    useEffect(() => {
        const originalError = console.error;
        console.error = (...args) => {
            setErrorCount(prev => prev + 1);
            originalError(...args);
        };

        return () => {
            console.error = originalError;
        };
    }, []);

    const testComponent = (componentName) => {
        console.log(`🧪 Testing component: ${componentName}`);
        setErrorCount(0);
        setTestResult('');
        setActiveTest(componentName);
        
        // Reset after 5 seconds
        setTimeout(() => {
            if (errorCount === 0) {
                setTestResult(`✅ ${componentName} - No errors detected`);
            } else {
                setTestResult(`❌ ${componentName} - ${errorCount} errors detected`);
            }
        }, 3000);

        // Auto-clear after 8 seconds
        setTimeout(() => {
            setActiveTest(null);
            setTestResult('');
        }, 8000);
    };

    const renderTestComponent = () => {
        try {
            switch (activeTest) {
                case 'SMCChart':
                    // Uncomment when ready to test:
                    return <SMCChart {...mockProps} />;
                    return <div style={{ padding: '2rem', backgroundColor: '#e8f6f3', border: '1px solid #1dd1a1' }}>
                        <h4>SMC Chart Test</h4>
                        <p>Uncomment SMCChart import to test this component</p>
                    </div>;

                case 'RealTimeChart':
                    // Uncomment when ready to test:
                    return <RealTimeChart {...mockProps} />;
                    return <div style={{ padding: '2rem', backgroundColor: '#e8f6f3', border: '1px solid #1dd1a1' }}>
                        <h4>RealTime Chart Test</h4>
                        <p>Uncomment RealTimeChart import to test this component</p>
                    </div>;

                case 'MarketData':
                    // Uncomment when ready to test:
                    return <MarketData symbol={mockProps.symbol} data={mockProps.marketData} />;
                    return <div style={{ padding: '2rem', backgroundColor: '#e8f6f3', border: '1px solid #1dd1a1' }}>
                        <h4>Market Data Test</h4>
                        <p>Uncomment MarketData import to test this component</p>
                    </div>;

                case 'StrategyControls':
                    return <StrategyControls {...mockProps} />;
                    return <div style={{ padding: '2rem', backgroundColor: '#e8f6f3', border: '1px solid #1dd1a1' }}>
                        <h4>Strategy Controls Test</h4>
                        <p>Uncomment StrategyControls import to test this component</p>
                    </div>;

                case 'PositionMonitor':
                    return <PositionMonitor symbol={mockProps.symbol} />;
                    return <div style={{ padding: '2rem', backgroundColor: '#e8f6f3', border: '1px solid #1dd1a1' }}>
                        <h4>Position Monitor Test</h4>
                        <p>Uncomment PositionMonitor import to test this component</p>
                    </div>;

                case 'OrderBook':
                    return <OrderBook symbol={mockProps.symbol} />;
                    return <div style={{ padding: '2rem', backgroundColor: '#e8f6f3', border: '1px solid #1dd1a1' }}>
                        <h4>Order Book Test</h4>
                        <p>Uncomment OrderBook import to test this component</p>
                    </div>;

                case 'RealTimeMetrics':
                    return <RealTimeMetrics />;
                    return <div style={{ padding: '2rem', backgroundColor: '#e8f6f3', border: '1px solid #1dd1a1' }}>
                        <h4>Real Time Metrics Test</h4>
                        <p>Uncomment RealTimeMetrics import to test this component</p>
                    </div>;

                default:
                    return null;
            }
        } catch (error) {
            return (
                <div style={{ padding: '2rem', backgroundColor: '#fdf2f2', border: '1px solid #e74c3c' }}>
                    <h4>❌ Component Error</h4>
                    <p>Error: {error.message}</p>
                </div>
            );
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2>🔍 Component Testing Tool</h2>
            <p style={{ marginBottom: '2rem', color: '#666' }}>
                Click each button to test components individually and identify which ones cause DOM errors.
            </p>
            
            {/* Test Buttons */}
            <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                flexWrap: 'wrap', 
                marginBottom: '2rem' 
            }}>
                {[
                    'StrategyControls',
                    'PositionMonitor', 
                    'MarketData',
                    'PerformanceMetrics',
                    'SMCChart',
                    'RealTimeChart',
                    'OrderBook',
                    'RealTimeMetrics',
                    'AlertsPanel',
                    'SMCStrategyPanel',
                    'GridBotPanel'
                ].map(name => (
                    <button 
                        key={name}
                        onClick={() => testComponent(name)}
                        style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: activeTest === name ? '#e74c3c' : '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}
                        disabled={activeTest && activeTest !== name}
                    >
                        {activeTest === name ? '🧪 Testing...' : `Test ${name}`}
                    </button>
                ))}
            </div>

            {/* Error Counter */}
            <div style={{ 
                padding: '1rem', 
                backgroundColor: errorCount > 0 ? '#fdf2f2' : '#e8f6f3',
                border: `1px solid ${errorCount > 0 ? '#e74c3c' : '#1dd1a1'}`,
                borderRadius: '4px',
                marginBottom: '2rem'
            }}>
                <strong>Console Errors During Test: {errorCount}</strong>
                {testResult && <div style={{ marginTop: '0.5rem' }}>{testResult}</div>}
            </div>

            {/* Test Area */}
            <div style={{ 
                minHeight: '400px', 
                border: '2px dashed #bdc3c7', 
                borderRadius: '8px',
                padding: '2rem',
                backgroundColor: '#f8f9fa'
            }}>
                {activeTest ? (
                    <div>
                        <h3 style={{ marginBottom: '1rem' }}>
                            Testing: {activeTest}
                        </h3>
                        {renderTestComponent()}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: '#666' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧪</div>
                        <h3>Select a component to test</h3>
                        <p>Click any button above to test that component individually</p>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div style={{ 
                marginTop: '2rem', 
                padding: '1rem', 
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px'
            }}>
                <h4>📋 How to Use This Tool:</h4>
                <ol style={{ marginBottom: 0 }}>
                    <li><strong>Step 1:</strong> Click a component button to test it</li>
                    <li><strong>Step 2:</strong> Watch the "Console Errors" counter</li>
                    <li><strong>Step 3:</strong> Check browser console for specific errors</li>
                    <li><strong>Step 4:</strong> If errors occur, that component needs fixing</li>
                    <li><strong>Step 5:</strong> Uncomment imports one by one to test real components</li>
                </ol>
            </div>
        </div>
    );
};

export default ComponentTester;
