"use strict";
/**
 * @file index.ts
 * @description Entry point for the Vast.ai Node.js SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicApi = exports.VastClient = void 0;
// Export the main client class
var vast_client_1 = require("./vast-client");
Object.defineProperty(exports, "VastClient", { enumerable: true, get: function () { return vast_client_1.VastClient; } });
// Export the DynamicApi class for advanced usage scenarios
var dynamic_api_1 = require("./dynamic-api");
Object.defineProperty(exports, "DynamicApi", { enumerable: true, get: function () { return dynamic_api_1.DynamicApi; } });
