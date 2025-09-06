// src/components/SafeChart.js - Error-Free Chart Component
import React, { useState, useEffect, useRef } from 'react';

const SafeChart = ({ symbol, height = 400, data = [], type = 'line' }) => {
    const [chartData, setChartData] = useState([]);
    const [error, setError] = useState(null);
    const containerRef = useRef(null);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (data && Array.isArray(data) && isMounted.current) {
            setChartData(data);
        }
    }, [data]);

    // Simple SVG-based chart (no third-party library)
    const renderSimpleChart = () => {
        if (!chartData.length) return null;

        const width = 800;
        const chartHeight = height - 100;
        const padding = 60;

        // Find min/max values
        const values = chartData.map(d => typeof d === 'object' ? d.y || d.value || 0 : d);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const valueRange = maxValue - minValue || 1;

        // Generate path for line chart
        const pathData = chartData.map((point, index) => {
            const x = padding + (index * (width - 2 * padding)) / (chartData.length - 1);
            const value = typeof point === 'object' ? point.y || point.value || 0 : point;
            const y = chartHeight - padding - ((value - minValue) / valueRange) * (chartHeight - 2 * padding);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        return (
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => {
                    const y = padding + (i * (chartHeight - 2 * padding)) / 4;
                    return (
                        <line
                            key={`grid-${i}`}
                            x1={padding}
                            y1={y}
                            x2={width - padding}
                            y2={y}
                            stroke="#e1e5e9"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Chart line */}
                <path
                    d={pathData}
                    fill="none"
                    stroke="#3498db"
                    strokeWidth="2"
                />

                {/* Data points */}
                {chartData.map((point, index) => {
                    const x = padding + (index * (width - 2 * padding)) / (chartData.length - 1);
                    const value = typeof point === 'object' ? point.y || point.value || 0 : point;
                    const y = chartHeight - padding - ((value - minValue) / valueRange) * (chartHeight - 2 * padding);
                    
                    return (
                        <circle
                            key={`point-${index}`}
                            cx={x}
                            cy={y}
                            r="3"
                            fill="#3498db"
                        />
                    );
                })}

                {/* Y-axis labels */}
                {[0, 1, 2, 3, 4].map(i => {
                    const y = padding + (i * (chartHeight - 2 * padding)) / 4;
                    const value = maxValue - (i * valueRange) / 4;
                    return (
                        <text
                            key={`label-${i}`}
                            x={padding - 10}
                            y={y + 5}
                            textAnchor="end"
                            fontSize="12"
                            fill="#666"
                        >
                            {value.toFixed(2)}
                        </text>
                    );
                })}

                {/* Title */}
                <text
                    x={width / 2}
                    y={30}
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="bold"
                    fill="#2c3e50"
                >
                    {symbol} Price Chart
                </text>
            </svg>
        );
    };

    if (error) {
        return (
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                border: '2px dashed #dee2e6',
                borderRadius: '8px',
                height: `${height}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📈</div>
                    <h4>Chart Temporarily Disabled</h4>
                    <p>Chart component disabled to prevent errors</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            style={{
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                height: `${height + 40}px`
            }}
        >
            {chartData.length > 0 ? (
                renderSimpleChart()
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
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                        <div>Loading chart data...</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SafeChart;
