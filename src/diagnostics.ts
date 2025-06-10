/**
 * @file diagnostics.ts
 * @description Diagnostic utilities for troubleshooting Vast.ai SDK issues
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'npm:axios';

// Log levels
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5
}

// Diagnostic configuration
export interface DiagnosticConfig {
  logLevel: LogLevel;
  logRequests: boolean;
  logResponses: boolean;
  logErrors: boolean;
  redactSensitiveData: boolean;
}

// Default configuration
const DEFAULT_CONFIG: DiagnosticConfig = {
  logLevel: LogLevel.ERROR,
  logRequests: false,
  logResponses: false,
  logErrors: true,
  redactSensitiveData: true
};

// Global diagnostic state
let currentConfig: DiagnosticConfig = { ...DEFAULT_CONFIG };

/**
 * Configure the diagnostic settings
 * @param config Partial diagnostic configuration to apply
 */
export function configureDiagnostics(config: Partial<DiagnosticConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  
  // Log configuration change
  if (currentConfig.logLevel >= LogLevel.INFO) {
    console.log('[Vast SDK] Diagnostics configured:', 
      JSON.stringify({
        ...currentConfig,
        // Don't log actual log level number, show the name instead
        logLevel: LogLevel[currentConfig.logLevel]
      }, null, 2)
    );
  }
}

/**
 * Get the current diagnostic configuration
 */
export function getDiagnosticConfig(): DiagnosticConfig {
  return { ...currentConfig };
}

/**
 * Reset diagnostic configuration to defaults
 */
export function resetDiagnostics(): void {
  currentConfig = { ...DEFAULT_CONFIG };
  if (currentConfig.logLevel >= LogLevel.INFO) {
    console.log('[Vast SDK] Diagnostics reset to defaults');
  }
}

/**
 * Check if logging is enabled for a specific level
 * @param level The log level to check
 */
export function isLoggingEnabled(level: LogLevel): boolean {
  return currentConfig.logLevel >= level;
}

/**
 * Safely redact sensitive data from objects
 * @param data The data to redact
 * @param sensitiveKeys Keys to redact
 */
export function redactSensitiveData<T>(data: T, sensitiveKeys: string[] = ['api_key', 'Authorization', 'token', 'password']): T {
  if (!currentConfig.redactSensitiveData) return data;
  if (!data || typeof data !== 'object') return data;
  
  const result = { ...data as any };
  
  // Recursively process object
  for (const key in result) {
    if (sensitiveKeys.includes(key)) {
      const value = result[key];
      if (typeof value === 'string') {
        // Redact string values but keep a hint of the original
        const firstChars = value.substring(0, 3);
        const lastChars = value.substring(value.length - 3);
        result[key] = `${firstChars}...${lastChars}`;
      } else {
        result[key] = '[REDACTED]';
      }
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      // Recursively redact nested objects
      result[key] = redactSensitiveData(result[key], sensitiveKeys);
    }
  }
  
  return result as T;
}

/**
 * Create axios request interceptor for diagnostics
 */
export function createRequestInterceptor() {
  return (config: AxiosRequestConfig) => {
    if (currentConfig.logRequests && isLoggingEnabled(LogLevel.DEBUG)) {
      console.log(`[Vast SDK] Request: ${config.method?.toUpperCase()} ${config.url}`);
      
      // Log headers with sensitive data redacted
      if (config.headers && isLoggingEnabled(LogLevel.TRACE)) {
        console.log('[Vast SDK] Headers:', redactSensitiveData(config.headers));
      }
      
      // Log request data
      if ((config.data || config.params) && isLoggingEnabled(LogLevel.TRACE)) {
        if (config.data) {
          console.log('[Vast SDK] Request Data:', redactSensitiveData(config.data));
        }
        if (config.params) {
          console.log('[Vast SDK] Request Params:', redactSensitiveData(config.params));
        }
      }
    }
    
    return config;
  };
}

/**
 * Create axios response interceptor for diagnostics
 */
export function createResponseInterceptor() {
  return (response: AxiosResponse) => {
    if (currentConfig.logResponses && isLoggingEnabled(LogLevel.DEBUG)) {
      console.log(`[Vast SDK] Response: ${response.status} ${response.statusText} from ${response.config.method?.toUpperCase()} ${response.config.url}`);
      
      // Log response data
      if (response.data && isLoggingEnabled(LogLevel.TRACE)) {
        console.log('[Vast SDK] Response Data:', redactSensitiveData(response.data));
      }
    }
    
    return response;
  };
}

/**
 * Create axios error interceptor for diagnostics
 */
export function createErrorInterceptor() {
  return (error: AxiosError) => {
    if (currentConfig.logErrors && isLoggingEnabled(LogLevel.ERROR)) {
      if (error.response) {
        console.error(`[Vast SDK] Error: ${error.response.status} ${error.response.statusText} from ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
        
        // Check for authentication errors
        if (error.response.status === 401) {
          console.error('[Vast SDK] Authentication Error: Please check your API key');
        }
        
        // Log error response data
        if (error.response.data && isLoggingEnabled(LogLevel.DEBUG)) {
          console.error('[Vast SDK] Error Data:', redactSensitiveData(error.response.data));
        }
      } else if (error.request) {
        console.error(`[Vast SDK] Network Error: No response received for ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
        console.error('[Vast SDK] Request Details:', error.request);
      } else {
        console.error(`[Vast SDK] Error: ${error.message}`);
      }
      
      // Log request that caused the error
      if (error.config && isLoggingEnabled(LogLevel.DEBUG)) {
        console.error('[Vast SDK] Failed Request Config:', redactSensitiveData({
          method: error.config.method?.toUpperCase(),
          url: error.config.url,
          headers: error.config.headers,
          data: error.config.data,
          params: error.config.params
        }));
      }
    }
    
    return Promise.reject(error);
  };
}

/**
 * Create a diagnostic info object for the SDK
 */
export function createDiagnosticInfo() {
  return {
    sdkVersion: '0.1.0',
    platform: process.platform,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    config: redactSensitiveData(currentConfig)
  };
}

/**
 * Log a schema mismatch warning
 * @param expectedType The expected type name
 * @param actualData The actual data received
 * @param path The path where the mismatch occurred
 */
export function logSchemaMismatch(expectedType: string, actualData: any, path: string = 'root'): void {
  if (isLoggingEnabled(LogLevel.WARN)) {
    console.warn(`[Vast SDK] Schema mismatch at ${path}: Expected type ${expectedType} but received:`, 
      redactSensitiveData(actualData));
  }
}

/**
 * Validate actual data against expected keys
 * @param data The data to validate
 * @param expectedKeys The expected keys
 * @param typeName The name of the type for logging
 */
export function validateSchema(data: any, expectedKeys: string[], typeName: string): void {
  if (!isLoggingEnabled(LogLevel.WARN) || !data || typeof data !== 'object') return;
  
  // Check for missing expected keys
  const missingKeys = expectedKeys.filter(key => data[key] === undefined);
  if (missingKeys.length > 0) {
    console.warn(`[Vast SDK] Schema validation: ${typeName} missing expected keys:`, missingKeys);
  }
  
  // Check for unexpected keys
  const extraKeys = Object.keys(data).filter(key => !expectedKeys.includes(key));
  if (extraKeys.length > 0 && isLoggingEnabled(LogLevel.DEBUG)) {
    console.debug(`[Vast SDK] Schema validation: ${typeName} has additional keys:`, extraKeys);
  }
}