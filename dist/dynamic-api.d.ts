/**
 * @file dynamic-api.ts
 * @description A flexible framework for making HTTP requests to RESTful APIs with automatic
 * retry, rate limiting, and request queuing capabilities.
 * @author vast-node team
 * @license MIT
 */
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
/**
 * Supported HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
/**
 * Configuration for an API endpoint
 *
 * @template T - Parameter types for this endpoint
 */
export interface EndpointConfig<T extends Record<string, any> = Record<string, any>> {
    method: HttpMethod;
    path: string;
    params?: (keyof T)[];
    headers?: Record<string, string>;
    responseType?: AxiosRequestConfig['responseType'];
    rateLimitPerSecond?: number;
    retryConfig?: RetryConfig;
}
/**
 * Configuration for request retry behavior
 */
export interface RetryConfig {
    maxRetries: number;
    retryDelay: number;
    retryCondition?: (error: AxiosError) => boolean;
}
/**
 * Partial retry configuration with optional fields
 */
export interface PartialRetryConfig {
    maxRetries?: number;
    retryDelay?: number;
    retryCondition?: (error: AxiosError) => boolean;
}
/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
    tokensPerInterval: number;
    interval: number | 'second' | 'minute' | 'hour' | 'day';
}
/**
 * Main API configuration
 */
export interface ApiConfig {
    baseUrl: string;
    endpoints: Record<string, EndpointConfig>;
    globalHeaders?: Record<string, string>;
    timeout?: number;
    responseInterceptor?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
    errorInterceptor?: (error: any) => any;
    globalRetryConfig?: PartialRetryConfig;
    queueConcurrency?: number;
    rateLimiter?: RateLimiterConfig;
}
export type ApiResponse<T> = Promise<T>;
/**
 * Queue that limits the number of concurrent requests
 * @internal
 */
export declare class RequestQueue {
    private concurrency;
    private queue;
    private running;
    constructor(concurrency: number);
    enqueue<T>(task: () => Promise<T>): Promise<T>;
    private runNext;
}
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
export declare class DynamicApi {
    private axiosInstance;
    private config;
    private rateLimiters;
    private requestQueue;
    /**
     * Creates a new DynamicApi instance
     *
     * @param config - API configuration
     */
    constructor(config: ApiConfig);
    /**
     * Creates API method functions from the endpoint configurations
     *
     * @template T - The type of endpoints configuration
     * @returns An object with methods corresponding to each endpoint
     */
    createApiMethods<T extends Record<string, EndpointConfig>>(): { [K in keyof T]: (data?: Record<string, any>, config?: AxiosRequestConfig) => ApiResponse<any>; };
    /**
     * Creates a method function for a specific endpoint
     *
     * @template T - Parameter types for this endpoint
     * @param name - The name of the endpoint
     * @param endpoint - The endpoint configuration
     * @returns A function that makes requests to this endpoint
     * @internal
     */
    private createMethod;
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
    private makeRequest;
    /**
     * Makes a request with automatic retry on failure
     *
     * @param config - The axios request configuration
     * @param retryConfig - The retry configuration
     * @returns The response data
     * @internal
     */
    private retryRequest;
    /**
     * Updates global headers for all subsequent requests
     *
     * @param headers - The headers to add or update
     */
    updateGlobalHeaders(headers: Record<string, string>): void;
    /**
     * Sets the authorization token for all subsequent requests
     *
     * @param token - The authentication token
     */
    setAuthToken(token: string): void;
    /**
     * Updates the retry configuration
     *
     * @param config - The new retry configuration
     */
    updateRetryConfig(config: PartialRetryConfig): void;
}
