// src/components/ErrorBoundary.js - NEW FILE
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-container">
                    <h3>⚠️ Component Error</h3>
                    <p>Something went wrong with the dashboard components.</p>
                    <button 
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="btn-primary"
                    >
                        🔄 Retry
                    </button>
                    <details style={{ marginTop: '1rem' }}>
                        <summary>Error Details</summary>
                        <pre>{this.state.error?.toString()}</pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
