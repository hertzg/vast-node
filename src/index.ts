/**
 * @file index.ts
 * @description Entry point for the Vast.ai Node.js SDK
 */

// Export the main client class
export { VastClient } from './vast-client';

// Export types for TypeScript users
export {
  MachineOffer,
  Instance,
  DockerImage,
  UserInfo,
  SearchOffersParams,
  CreateInstanceParams,
  ListInstancesParams,
  ApiError
} from './types';

// Export the DynamicApi class for advanced usage scenarios
export { DynamicApi, ApiConfig, EndpointConfig } from './dynamic-api';