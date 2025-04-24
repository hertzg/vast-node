/**
 * @file diagnostics.ts
 * @description Diagnostic utilities for troubleshooting Vast.ai SDK issues
 */
/// <reference types="node" />
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
export declare enum LogLevel {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
    TRACE = 5
}
export interface DiagnosticConfig {
    logLevel: LogLevel;
    logRequests: boolean;
    logResponses: boolean;
    logErrors: boolean;
    redactSensitiveData: boolean;
}
/**
 * Configure the diagnostic settings
 * @param config Partial diagnostic configuration to apply
 */
export declare function configureDiagnostics(config: Partial<DiagnosticConfig>): void;
/**
 * Get the current diagnostic configuration
 */
export declare function getDiagnosticConfig(): DiagnosticConfig;
/**
 * Reset diagnostic configuration to defaults
 */
export declare function resetDiagnostics(): void;
/**
 * Check if logging is enabled for a specific level
 * @param level The log level to check
 */
export declare function isLoggingEnabled(level: LogLevel): boolean;
/**
 * Safely redact sensitive data from objects
 * @param data The data to redact
 * @param sensitiveKeys Keys to redact
 */
export declare function redactSensitiveData<T>(data: T, sensitiveKeys?: string[]): T;
/**
 * Create axios request interceptor for diagnostics
 */
export declare function createRequestInterceptor(): (config: AxiosRequestConfig) => AxiosRequestConfig<any>;
/**
 * Create axios response interceptor for diagnostics
 */
export declare function createResponseInterceptor(): (response: AxiosResponse) => AxiosResponse<any, any>;
/**
 * Create axios error interceptor for diagnostics
 */
export declare function createErrorInterceptor(): (error: AxiosError) => Promise<never>;
/**
 * Create a diagnostic info object for the SDK
 */
export declare function createDiagnosticInfo(): {
    sdkVersion: string;
    platform: NodeJS.Platform;
    nodeVersion: string;
    timestamp: string;
    config: DiagnosticConfig;
};
/**
 * Log a schema mismatch warning
 * @param expectedType The expected type name
 * @param actualData The actual data received
 * @param path The path where the mismatch occurred
 */
export declare function logSchemaMismatch(expectedType: string, actualData: any, path?: string): void;
/**
 * Validate actual data against expected keys
 * @param data The data to validate
 * @param expectedKeys The expected keys
 * @param typeName The name of the type for logging
 */
export declare function validateSchema(data: any, expectedKeys: string[], typeName: string): void;
