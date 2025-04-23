"use strict";
/**
 * @file dynamic-api.ts
 * @description A flexible framework for making HTTP requests to RESTful APIs with automatic
 * retry, rate limiting, and request queuing capabilities.
 * @author vast-node team
 * @license MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicApi = exports.RequestQueue = void 0;
const axios_1 = __importDefault(require("axios"));
const limiter_1 = require("limiter");
/**
 * Queue that limits the number of concurrent requests
 * @internal
 */
class RequestQueue {
    constructor(concurrency) {
        this.concurrency = concurrency;
        this.queue = [];
        this.running = 0;
    }
    enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push(() => task().then(resolve).catch(reject));
            this.runNext();
        });
    }
    runNext() {
        if (this.running >= this.concurrency || this.queue.length === 0)
            return;
        this.running++;
        const task = this.queue.shift();
        if (task) {
            task().finally(() => {
                this.running--;
                this.runNext();
            });
        }
    }
}
exports.RequestQueue = RequestQueue;
/**
 * Dynamic API client that provides a flexible way to define and interact with RESTful APIs
 *
 * Features:
 * - Automatic request retry with customizable conditions
 * - Rate limiting to prevent API throttling
 * - Request queuing to limit concurrent requests
 * - Path parameter interpolation
 * - Global and per-endpoint configurations
 */
class DynamicApi {
    /**
     * Creates a new DynamicApi instance
     *
     * @param config - API configuration
     */
    constructor(config) {
        this.rateLimiters = new Map();
        this.config = config;
        this.axiosInstance = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 10000,
            headers: config.globalHeaders || {},
        });
        if (config.responseInterceptor) {
            this.axiosInstance.interceptors.response.use(config.responseInterceptor);
        }
        if (config.errorInterceptor) {
            this.axiosInstance.interceptors.response.use(undefined, config.errorInterceptor);
        }
        this.requestQueue = new RequestQueue(config.queueConcurrency || 5);
    }
    /**
     * Creates API method functions from the endpoint configurations
     *
     * @template T - The type of endpoints configuration
     * @returns An object with methods corresponding to each endpoint
     */
    createApiMethods() {
        const api = {};
        for (const [name, endpoint] of Object.entries(this.config.endpoints)) {
            api[name] = this.createMethod(name, endpoint);
            if (endpoint.rateLimitPerSecond) {
                this.rateLimiters.set(name, new limiter_1.RateLimiter({ tokensPerInterval: endpoint.rateLimitPerSecond, interval: 'second' }));
            }
        }
        return api;
    }
    /**
     * Creates a method function for a specific endpoint
     *
     * @template T - Parameter types for this endpoint
     * @param name - The name of the endpoint
     * @param endpoint - The endpoint configuration
     * @returns A function that makes requests to this endpoint
     * @internal
     */
    createMethod(name, endpoint) {
        return async (data = {}, config = {}) => {
            const rateLimiter = this.rateLimiters.get(name);
            if (rateLimiter) {
                await rateLimiter.removeTokens(1);
            }
            return this.requestQueue.enqueue(() => this.makeRequest(endpoint, data, config));
        };
    }
    /**
     * Makes an HTTP request based on the endpoint configuration
     *
     * @template T - Parameter types for this endpoint
     * @param endpoint - The endpoint configuration
     * @param data - The request data
     * @param config - Additional axios configuration
     * @returns The response data
     * @internal
     */
    async makeRequest(endpoint, data, config) {
        var _a, _b, _c;
        const { method, path, params = [], headers = {}, responseType, retryConfig } = endpoint;
        let url = path;
        // Replace path parameters
        for (const param of params) {
            const paramKey = String(param);
            if (data[paramKey] !== undefined) {
                url = url.replace(`:${paramKey}`, encodeURIComponent(data[paramKey]));
                delete data[paramKey];
            }
        }
        const axiosConfig = {
            ...config,
            method,
            url,
            headers: { ...headers, ...config.headers },
            responseType,
        };
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            axiosConfig.data = data;
        }
        else {
            axiosConfig.params = data;
        }
        const finalRetryConfig = {
            maxRetries: (retryConfig === null || retryConfig === void 0 ? void 0 : retryConfig.maxRetries) || ((_a = this.config.globalRetryConfig) === null || _a === void 0 ? void 0 : _a.maxRetries) || 3,
            retryDelay: (retryConfig === null || retryConfig === void 0 ? void 0 : retryConfig.retryDelay) || ((_b = this.config.globalRetryConfig) === null || _b === void 0 ? void 0 : _b.retryDelay) || 1000,
            retryCondition: (retryConfig === null || retryConfig === void 0 ? void 0 : retryConfig.retryCondition) || ((_c = this.config.globalRetryConfig) === null || _c === void 0 ? void 0 : _c.retryCondition)
        };
        return this.retryRequest(axiosConfig, finalRetryConfig);
    }
    /**
     * Makes a request with automatic retry on failure
     *
     * @param config - The axios request configuration
     * @param retryConfig - The retry configuration
     * @returns The response data
     * @internal
     */
    async retryRequest(config, retryConfig) {
        const { maxRetries, retryDelay, retryCondition } = retryConfig;
        let retries = 0;
        while (true) {
            try {
                const response = await this.axiosInstance.request(config);
                return response.data;
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error) &&
                    retries < maxRetries &&
                    (!retryCondition || retryCondition(error))) {
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue;
                }
                throw error;
            }
        }
    }
    /**
     * Updates global headers for all subsequent requests
     *
     * @param headers - The headers to add or update
     */
    updateGlobalHeaders(headers) {
        this.axiosInstance.defaults.headers.common = {
            ...this.axiosInstance.defaults.headers.common,
            ...headers,
        };
    }
    /**
     * Sets the authorization token for all subsequent requests
     *
     * @param token - The authentication token
     */
    setAuthToken(token) {
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    /**
     * Updates the retry configuration
     *
     * @param config - The new retry configuration
     */
    updateRetryConfig(config) {
        this.config.globalRetryConfig = {
            ...this.config.globalRetryConfig,
            ...config
        };
    }
}
exports.DynamicApi = DynamicApi;
