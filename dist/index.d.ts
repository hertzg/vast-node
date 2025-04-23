/**
 * Vast.ai Node.js SDK
 * A TypeScript/JavaScript client for the Vast.ai API
 */
export { VastClient } from './vast-client';
export { DynamicApi, ApiConfig, EndpointConfig, HttpMethod } from './dynamic-api';
export { MachineOffer, Instance, DockerImage, UserInfo, SearchOffersParams, CreateInstanceParams, ListInstancesParams, ApiError } from './types';
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
