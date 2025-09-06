// src/services/apiService.js - Static Class Version.
const API_BASE = process.env.REACT_APP_API_URL || "https://vy-delta-2.onrender.com/api";

class APIService {
    static baseURL = API_BASE;
    static requestTimeout = 15000;

    static async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        console.log(`🔍 API Request: ${url}`);

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            mode: 'cors',
            ...options
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`✅ API Success for ${endpoint}:`, data);
            return data;

        } catch (error) {
            console.error(`❌ API request failed for ${endpoint}:`, error);
            if (error.name === 'AbortError') {
                throw new Error(`Request timed out after ${this.requestTimeout/1000}s`);
            }
            throw error;
        }
    }

    // THE METHOD YOU NEED
    static async getAvailableStrategies() {
        console.log('📋 Getting available strategies...');
        try {
            const result = await this.request('/strategies/available');
            console.log('✅ Available strategies retrieved:', result);
            return result;
        } catch (error) {
            console.error('❌ Get available strategies failed:', error);
            throw error;
        }
    }

    static async getHealth() {
        return await this.request('/health');
    }

    static async getAllStrategiesStatus() {
        try {
            return await this.request('/strategies/status');
        } catch (error) {
            console.error('❌ Get strategies failed:', error);
            return {};
        }
    }

    static async getWallet() {
        try {
            return await this.request('/wallet');
        } catch (error) {
            console.error('❌ Get wallet failed:', error);
            return {};
        }
    }

    static async getMarketData(symbol) {
        try {
            return await this.request(`/market/${symbol}`);
        } catch (error) {
            console.error(`Get market data failed for ${symbol}:`, error);
            return {};
        }
    }

    static async getPositions(symbol) {
        try {
            return await this.request(`/positions/${symbol}`);
        } catch (error) {
            return {};
        }
    }

    static async getTrades() {
        try {
            return await this.request('/trades');
        } catch (error) {
            return [];
        }
    }

    static async getTradeStats() {
        try {
            return await this.request('/trade_stats');
        } catch (error) {
            return {};
        }
    }

    static async startStrategy(symbol, config) {
        return await this.request('/strategies/start', {
            method: 'POST',
            body: JSON.stringify({ symbol, ...config })
        });
    }

    static async stopStrategy(symbol) {
        return await this.request('/strategies/stop', {
            method: 'POST',
            body: JSON.stringify({ symbol })
        });
    }

    static async getSystemHealth() {
        try {
            return await this.request('/system/health');
        } catch (error) {
            return { success: false, result: { summary: { status: 'unavailable' } } };
        }
    }

    static async getSMCAnalysis(symbol) {
        try {
            return await this.request(`/smc_analysis/${symbol}`);
        } catch (error) {
            return null;
        }
    }

    static async getCandles(symbol, timeframe = "1m", limit = 50) {
        try {
            return await this.request(`/candles/${symbol}?timeframe=${timeframe}&limit=${limit}`);
        } catch (error) {
            throw error;
        }
    }
}

// Export the class itself, not an instance
export default APIService;
