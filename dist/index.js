"use strict";
/**
 * Vast.ai Node.js SDK
 * A TypeScript/JavaScript client for the Vast.ai API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicApi = exports.VastClient = void 0;
var vast_client_1 = require("./vast-client");
Object.defineProperty(exports, "VastClient", { enumerable: true, get: function () { return vast_client_1.VastClient; } });
var dynamic_api_1 = require("./dynamic-api");
Object.defineProperty(exports, "DynamicApi", { enumerable: true, get: function () { return dynamic_api_1.DynamicApi; } });
/**
 * Example usage:
 *
 * ```typescript
 * import { VastClient } from 'vast-node';
 *
 * const client = new VastClient('your-api-key');
 *
 * // Search for available GPU machines
 * const offers = await client.searchOffers({
 *   num_gpus: 1,
 *   cuda_max_good: 11.5
 * });
 *
 * // List current instances
 * const instances = await client.listInstances();
 *
 * // Create a new instance
 * const newInstance = await client.createInstance({
 *   image: "pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime",
 *   machineId: 12345,
 *   diskSpace: 10
 * });
 * ```
 */ 
