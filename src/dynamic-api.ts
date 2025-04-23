/**
 * @file dynamic-api.ts
 * @description A flexible framework for making HTTP requests to RESTful APIs with automatic
 * retry, rate limiting, and request queuing capabilities.
 * @author vast-node team
 * @license MIT
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { RateLimiter } from 'limiter';

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
  tokensPerInterval: number;  // Number of requests allowed
  interval: number | 'second' | 'minute' | 'hour' | 'day';  // Time period
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
export class RequestQueue {
 private queue: (() => Promise<any>)[] = [];
 private running = 0;

 constructor(private concurrency: number) {}

 enqueue<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
   this.queue.push(() => task().then(resolve).catch(reject));
   this.runNext();
  });
 }

 private runNext() {
  if (this.running >= this.concurrency || this.queue.length === 0) return;
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
export class DynamicApi {
 private axiosInstance: AxiosInstance;
 private config: ApiConfig;
 private rateLimiters: Map<string, RateLimiter> = new Map();
 private requestQueue: RequestQueue;

 /**
  * Creates a new DynamicApi instance
  *
  * @param config - API configuration
  */
 constructor(config: ApiConfig) {
  this.config = config;
  this.axiosInstance = axios.create({
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
 createApiMethods<T extends Record<string, EndpointConfig>>() {
  const api: Record<string, Function> = {};

  for (const [name, endpoint] of Object.entries(this.config.endpoints)) {
   api[name] = this.createMethod(name, endpoint);
   if (endpoint.rateLimitPerSecond) {
    this.rateLimiters.set(name, new RateLimiter({ tokensPerInterval: endpoint.rateLimitPerSecond, interval: 'second' }));
   }
  }

  return api as {
   [K in keyof T]: (
    data?: Record<string, any>,
    config?: AxiosRequestConfig
   ) => ApiResponse<any>
  };
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
 private createMethod<T extends Record<string, any>>(name: string, endpoint: EndpointConfig<T>) {
  return async (data: T = {} as T, config: AxiosRequestConfig = {}): ApiResponse<any> => {
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
 private async makeRequest<T extends Record<string, any>>(
  endpoint: EndpointConfig<T>,
  data: T,
  config: AxiosRequestConfig
 ): Promise<any> {
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

  const axiosConfig: AxiosRequestConfig = {
   ...config,
   method,
   url,
   headers: { ...headers, ...config.headers },
   responseType,
  };

  if (['POST', 'PUT', 'PATCH'].includes(method)) {
   axiosConfig.data = data;
  } else {
   axiosConfig.params = data;
  }

  const finalRetryConfig: RetryConfig = {
   maxRetries: retryConfig?.maxRetries || this.config.globalRetryConfig?.maxRetries || 3,
   retryDelay: retryConfig?.retryDelay || this.config.globalRetryConfig?.retryDelay || 1000,
   retryCondition: retryConfig?.retryCondition || this.config.globalRetryConfig?.retryCondition
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
 private async retryRequest(
  config: AxiosRequestConfig,
  retryConfig: RetryConfig
 ): Promise<any> {
  const { maxRetries, retryDelay, retryCondition } = retryConfig;
  let retries = 0;

  while (true) {
   try {
    const response = await this.axiosInstance.request(config);
    return response.data;
   } catch (error) {
    if (
     axios.isAxiosError(error) &&
     retries < maxRetries &&
     (!retryCondition || retryCondition(error))
    ) {
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
 updateGlobalHeaders(headers: Record<string, string>) {
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
 setAuthToken(token: string) {
  this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
 }

 /**
  * Updates the retry configuration
  *
  * @param config - The new retry configuration
  */
 updateRetryConfig(config: PartialRetryConfig) {
  this.config.globalRetryConfig = {
   ...this.config.globalRetryConfig,
   ...config
  };
 }
}
