"use strict";
/**
 * @file diagnostics.ts
 * @description Diagnostic utilities for troubleshooting Vast.ai SDK issues
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = exports.logSchemaMismatch = exports.createDiagnosticInfo = exports.createErrorInterceptor = exports.createResponseInterceptor = exports.createRequestInterceptor = exports.redactSensitiveData = exports.isLoggingEnabled = exports.resetDiagnostics = exports.getDiagnosticConfig = exports.configureDiagnostics = exports.LogLevel = void 0;
// Log levels
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["NONE"] = 0] = "NONE";
    LogLevel[LogLevel["ERROR"] = 1] = "ERROR";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["INFO"] = 3] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 4] = "DEBUG";
    LogLevel[LogLevel["TRACE"] = 5] = "TRACE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// Default configuration
const DEFAULT_CONFIG = {
    logLevel: LogLevel.ERROR,
    logRequests: false,
    logResponses: false,
    logErrors: true,
    redactSensitiveData: true
};
// Global diagnostic state
let currentConfig = { ...DEFAULT_CONFIG };
/**
 * Configure the diagnostic settings
 * @param config Partial diagnostic configuration to apply
 */
function configureDiagnostics(config) {
    currentConfig = { ...currentConfig, ...config };
    // Log configuration change
    if (currentConfig.logLevel >= LogLevel.INFO) {
        console.log('[Vast SDK] Diagnostics configured:', JSON.stringify({
            ...currentConfig,
            // Don't log actual log level number, show the name instead
            logLevel: LogLevel[currentConfig.logLevel]
        }, null, 2));
    }
}
exports.configureDiagnostics = configureDiagnostics;
/**
 * Get the current diagnostic configuration
 */
function getDiagnosticConfig() {
    return { ...currentConfig };
}
exports.getDiagnosticConfig = getDiagnosticConfig;
/**
 * Reset diagnostic configuration to defaults
 */
function resetDiagnostics() {
    currentConfig = { ...DEFAULT_CONFIG };
    if (currentConfig.logLevel >= LogLevel.INFO) {
        console.log('[Vast SDK] Diagnostics reset to defaults');
    }
}
exports.resetDiagnostics = resetDiagnostics;
/**
 * Check if logging is enabled for a specific level
 * @param level The log level to check
 */
function isLoggingEnabled(level) {
    return currentConfig.logLevel >= level;
}
exports.isLoggingEnabled = isLoggingEnabled;
/**
 * Safely redact sensitive data from objects
 * @param data The data to redact
 * @param sensitiveKeys Keys to redact
 */
function redactSensitiveData(data, sensitiveKeys = ['api_key', 'Authorization', 'token', 'password']) {
    if (!currentConfig.redactSensitiveData)
        return data;
    if (!data || typeof data !== 'object')
        return data;
    const result = { ...data };
    // Recursively process object
    for (const key in result) {
        if (sensitiveKeys.includes(key)) {
            const value = result[key];
            if (typeof value === 'string') {
                // Redact string values but keep a hint of the original
                const firstChars = value.substring(0, 3);
                const lastChars = value.substring(value.length - 3);
                result[key] = `${firstChars}...${lastChars}`;
            }
            else {
                result[key] = '[REDACTED]';
            }
        }
        else if (typeof result[key] === 'object' && result[key] !== null) {
            // Recursively redact nested objects
            result[key] = redactSensitiveData(result[key], sensitiveKeys);
        }
    }
    return result;
}
exports.redactSensitiveData = redactSensitiveData;
/**
 * Create axios request interceptor for diagnostics
 */
function createRequestInterceptor() {
    return (config) => {
        var _a;
        if (currentConfig.logRequests && isLoggingEnabled(LogLevel.DEBUG)) {
            console.log(`[Vast SDK] Request: ${(_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()} ${config.url}`);
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
exports.createRequestInterceptor = createRequestInterceptor;
/**
 * Create axios response interceptor for diagnostics
 */
function createResponseInterceptor() {
    return (response) => {
        var _a;
        if (currentConfig.logResponses && isLoggingEnabled(LogLevel.DEBUG)) {
            console.log(`[Vast SDK] Response: ${response.status} ${response.statusText} from ${(_a = response.config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()} ${response.config.url}`);
            // Log response data
            if (response.data && isLoggingEnabled(LogLevel.TRACE)) {
                console.log('[Vast SDK] Response Data:', redactSensitiveData(response.data));
            }
        }
        return response;
    };
}
exports.createResponseInterceptor = createResponseInterceptor;
/**
 * Create axios error interceptor for diagnostics
 */
function createErrorInterceptor() {
    return (error) => {
        var _a, _b, _c, _d, _e, _f, _g;
        if (currentConfig.logErrors && isLoggingEnabled(LogLevel.ERROR)) {
            if (error.response) {
                console.error(`[Vast SDK] Error: ${error.response.status} ${error.response.statusText} from ${(_b = (_a = error.config) === null || _a === void 0 ? void 0 : _a.method) === null || _b === void 0 ? void 0 : _b.toUpperCase()} ${(_c = error.config) === null || _c === void 0 ? void 0 : _c.url}`);
                // Check for authentication errors
                if (error.response.status === 401) {
                    console.error('[Vast SDK] Authentication Error: Please check your API key');
                }
                // Log error response data
                if (error.response.data && isLoggingEnabled(LogLevel.DEBUG)) {
                    console.error('[Vast SDK] Error Data:', redactSensitiveData(error.response.data));
                }
            }
            else if (error.request) {
                console.error(`[Vast SDK] Network Error: No response received for ${(_e = (_d = error.config) === null || _d === void 0 ? void 0 : _d.method) === null || _e === void 0 ? void 0 : _e.toUpperCase()} ${(_f = error.config) === null || _f === void 0 ? void 0 : _f.url}`);
                console.error('[Vast SDK] Request Details:', error.request);
            }
            else {
                console.error(`[Vast SDK] Error: ${error.message}`);
            }
            // Log request that caused the error
            if (error.config && isLoggingEnabled(LogLevel.DEBUG)) {
                console.error('[Vast SDK] Failed Request Config:', redactSensitiveData({
                    method: (_g = error.config.method) === null || _g === void 0 ? void 0 : _g.toUpperCase(),
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
exports.createErrorInterceptor = createErrorInterceptor;
/**
 * Create a diagnostic info object for the SDK
 */
function createDiagnosticInfo() {
    return {
        sdkVersion: '0.1.0',
        platform: process.platform,
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
        config: redactSensitiveData(currentConfig)
    };
}
exports.createDiagnosticInfo = createDiagnosticInfo;
/**
 * Log a schema mismatch warning
 * @param expectedType The expected type name
 * @param actualData The actual data received
 * @param path The path where the mismatch occurred
 */
function logSchemaMismatch(expectedType, actualData, path = 'root') {
    if (isLoggingEnabled(LogLevel.WARN)) {
        console.warn(`[Vast SDK] Schema mismatch at ${path}: Expected type ${expectedType} but received:`, redactSensitiveData(actualData));
    }
}
exports.logSchemaMismatch = logSchemaMismatch;
/**
 * Validate actual data against expected keys
 * @param data The data to validate
 * @param expectedKeys The expected keys
 * @param typeName The name of the type for logging
 */
function validateSchema(data, expectedKeys, typeName) {
    if (!isLoggingEnabled(LogLevel.WARN) || !data || typeof data !== 'object')
        return;
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
exports.validateSchema = validateSchema;
