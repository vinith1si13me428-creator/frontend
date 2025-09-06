// src/components/RealTimeMetrics.js - Real-time System Metrics Dashboard

import React, { useState, useEffect } from 'react';
import APIService from '../services/apiService';

const RealTimeMetrics = () => {
    const [metrics, setMetrics] = useState({});
    const [healthStatus, setHealthStatus] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [wsMetrics, setWsMetrics] = useState(null);

    // Fetch system metrics
    const fetchMetrics = async () => {
        try {
            const [healthData, performanceData] = await Promise.all([
                APIService.getSystemHealth(),
                APIService.getSystemMetrics()
            ]);

            setHealthStatus(healthData);
            setMetrics(performanceData);
        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    };

    // WebSocket connection for real-time updates
    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds

        // WebSocket for real-time metrics (if available)
        const connectWebSocket = () => {
            const ws = new WebSocket('ws://localhost:8000/ws/metrics');
            
            ws.onopen = () => {
                setIsConnected(true);
                console.log('Metrics WebSocket connected');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setWsMetrics(data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                // Retry connection after 5 seconds
                setTimeout(connectWebSocket, 5000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };
        };

        connectWebSocket();

        return () => {
            clearInterval(interval);
            setIsConnected(false);
        };
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'var(--success)';
            case 'warning': return 'var(--warning)';
            case 'critical': return 'var(--danger)';
            default: return 'var(--text-secondary)';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'healthy': return '✅';
            case 'warning': return '⚠️';
            case 'critical': return '🚨';
            default: return '❓';
        }
    };

    const formatValue = (value, unit) => {
        if (typeof value !== 'number') return 'N/A';
        
        switch (unit) {
            case 'ms':
                return `${value.toFixed(1)}ms`;
            case 'percent':
                return `${value.toFixed(1)}%`;
            case 'gb':
                return `${value.toFixed(2)} GB`;
            case 'count':
                return value.toString();
            default:
                return value.toFixed(2);
        }
    };

    return (
        <div className="realtime-metrics premium-card">
            <div className="panel-header">
                <h3>🔧 System Metrics</h3>
                <div className="connection-status">
                    <div className={`status-dot ${isConnected ? 'online' : 'offline'}`}></div>
                    {isConnected ? 'Real-time' : 'Polling'}
                </div>
            </div>

            {/* Overall System Health */}
            <div className="health-overview glass">
                <div className="health-status">
                    <span className="health-icon">
                        {getStatusIcon(healthStatus.status)}
                    </span>
                    <span className="health-text" style={{ color: getStatusColor(healthStatus.status) }}>
                        {healthStatus.message || 'System Status Unknown'}
                    </span>
                </div>
                <div className="last-check">
                    Last Check: {healthStatus.timestamp ? 
                        new Date(healthStatus.timestamp * 1000).toLocaleTimeString() : 'N/A'}
                </div>
            </div>

            {/* System Metrics Grid */}
            <div className="metrics-grid">
                {/* CPU Metrics */}
                <MetricCard 
                    title="CPU Usage"
                    icon="🖥️"
                    value={formatValue(healthStatus.components?.cpu?.value, 'percent')}
                    status={healthStatus.components?.cpu?.status || 'unknown'}
                    threshold={`Max: ${healthStatus.components?.cpu?.threshold || 0}%`}
                    trend={wsMetrics?.cpu_trend}
                />

                {/* Memory Metrics */}
                <MetricCard 
                    title="Memory Usage"
                    icon="🧠"
                    value={formatValue(healthStatus.components?.memory?.value, 'percent')}
                    status={healthStatus.components?.memory?.status || 'unknown'}
                    details={healthStatus.components?.memory?.details}
                    trend={wsMetrics?.memory_trend}
                />

                {/* API Latency */}
                <MetricCard 
                    title="API Latency"
                    icon="🌐"
                    value={formatValue(healthStatus.components?.api?.value, 'ms')}
                    status={healthStatus.components?.api?.status || 'unknown'}
                    threshold={`Max: ${healthStatus.components?.api?.threshold || 0}ms`}
                    trend={wsMetrics?.api_latency_trend}
                />

                {/* Database Performance */}
                <MetricCard 
                    title="Database"
                    icon="🗄️"
                    value={formatValue(healthStatus.components?.database?.value, 'ms')}
                    status={healthStatus.components?.database?.status || 'unknown'}
                    threshold={`Max: ${healthStatus.components?.database?.threshold || 0}ms`}
                    trend={wsMetrics?.db_trend}
                />

                {/* Active Strategies */}
                <MetricCard 
                    title="Strategies"
                    icon="🎯"
                    value={`${healthStatus.components?.strategies?.value || 0}/${healthStatus.components?.strategies?.threshold || 0}`}
                    status={healthStatus.components?.strategies?.status || 'unknown'}
                    details={healthStatus.components?.strategies?.details}
                />

                {/* WebSocket Status */}
                <MetricCard 
                    title="WebSockets"
                    icon="🔌"
                    value={formatValue(healthStatus.components?.websocket?.value, 'count')}
                    status={healthStatus.components?.websocket?.status || 'unknown'}
                    details="Real-time connections"
                />
            </div>

            {/* Performance Trends Chart */}
            {wsMetrics && (
                <div className="performance-trends glass">
                    <h4>📈 Performance Trends</h4>
                    <div className="trend-indicators">
                        <div className="trend-item">
                            <span>CPU:</span>
                            <TrendIndicator trend={wsMetrics.cpu_trend} />
                        </div>
                        <div className="trend-item">
                            <span>Memory:</span>
                            <TrendIndicator trend={wsMetrics.memory_trend} />
                        </div>
                        <div className="trend-item">
                            <span>API:</span>
                            <TrendIndicator trend={wsMetrics.api_latency_trend} />
                        </div>
                    </div>
                </div>
            )}

            {/* System Alerts */}
            <div className="system-alerts">
                <h4>🚨 Recent Alerts</h4>
                {healthStatus.components && Object.values(healthStatus.components).some(c => c.status !== 'healthy') ? (
                    <div className="alerts-list">
                        {Object.entries(healthStatus.components).map(([name, component]) => (
                            component.status !== 'healthy' && (
                                <div key={name} className={`alert-item ${component.status}`}>
                                    <span className="alert-icon">{getStatusIcon(component.status)}</span>
                                    <span className="alert-text">{component.message}</span>
                                </div>
                            )
                        ))}
                    </div>
                ) : (
                    <div className="no-alerts">✅ No active alerts</div>
                )}
            </div>
        </div>
    );
};

// Metric Card Component
const MetricCard = ({ title, icon, value, status, threshold, details, trend }) => (
    <div className={`metric-card glass ${status}`}>
        <div className="metric-header">
            <span className="metric-icon">{icon}</span>
            <span className="metric-title">{title}</span>
            {trend && <TrendIndicator trend={trend} />}
        </div>
        
        <div className="metric-value" style={{ color: getStatusColor(status) }}>
            {value}
        </div>
        
        {threshold && (
            <div className="metric-threshold">
                {threshold}
            </div>
        )}
        
        {details && (
            <div className="metric-details">
                {typeof details === 'object' ? (
                    Object.entries(details).map(([key, val]) => (
                        <div key={key} className="detail-item">
                            <span>{key}:</span>
                            <span>{val}</span>
                        </div>
                    ))
                ) : (
                    <span>{details}</span>
                )}
            </div>
        )}
    </div>
);

// Trend Indicator Component  
const TrendIndicator = ({ trend }) => {
    if (!trend) return null;
    
    const getTrendIcon = () => {
        if (trend > 0) return '📈';
        if (trend < 0) return '📉';
        return '➡️';
    };
    
    const getTrendColor = () => {
        if (trend > 0) return 'var(--danger)';
        if (trend < 0) return 'var(--success)';
        return 'var(--text-secondary)';
    };
    
    return (
        <span className="trend-indicator" style={{ color: getTrendColor() }}>
            {getTrendIcon()}
        </span>
    );
};

// Helper function (moved outside component)
const getStatusColor = (status) => {
    switch (status) {
        case 'healthy': return 'var(--success)';
        case 'warning': return 'var(--warning)';
        case 'critical': return 'var(--danger)';
        default: return 'var(--text-secondary)';
    }
};

export default RealTimeMetrics;
