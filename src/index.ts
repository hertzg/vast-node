/**
 * @file index.ts
 * @description Entry point for the Vast.ai Node.js SDK
 */

// Export the main client class
export { VastClient } from "./vast-client.ts";

// Export types for TypeScript users
export type {
  ApiError,
  CreateInstanceParams,
  CreateInstanceResponse,
  DockerImage,
  Instance,
  ListInstancesParams,
  MachineOffer,
  SearchOffersParams,
  UserInfo,
} from "./types.ts";

// Export the DynamicApi class for advanced usage scenarios
export { DynamicApi } from "./dynamic-api.ts";
export type { ApiConfig, EndpointConfig } from "./dynamic-api.ts";
