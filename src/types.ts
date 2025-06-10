/**
 * @file types.ts
 * @description TypeScript interface definitions for Vast.ai API
 */

/**
 * API response for machine offers
 *
 * Note: The actual API uses snake_case, but we use camelCase in our TypeScript interface
 * for better developer experience. The transformation is handled internally.
 */
export interface MachineOffer {
  id: number;
  cudaMaxGood: number;
  numGpus: number;
  gpuName: string;
  gpuRam: number;
  diskSpace: number;
  cpuRam: number;
  cpuCores: number;
  reliability: number;
  dlperf: number;
  dlperfPerDphtotal: number;
  inetUp: number;
  inetDown: number;
  verification: string;
  dphTotal: number;
  minBid: number;
  datacenter: {
    id: number;
    geolocation: string;
  };
  external: boolean;
  hostingType: string;
  directPortCount: number;
  gpuFrac?: number;
  rentable?: boolean;
  rented?: boolean;
  hostname?: string;
  driverVersion?: string;
  cudaVersion?: string;
}

/**
 * API response for instance details
 *
 * Note: The actual API uses snake_case, but we use camelCase in our TypeScript interface
 * for better developer experience. The transformation is handled internally.
 */
export interface Instance {
  id: number;
  machineId: number;
  actualStatus: string;
  curState: string;
  nextState?: string;
  imageUuid: string;
  imageRuntype: string;
  imageArgs?: string;
  env?: Record<string, string>;
  extraEnv?: Record<string, string>;
  diskUsage?: number;
  diskSpace?: number;
  sshPort?: number;
  sshIdx?: number;
  sshHost?: string;
  sshKeyId?: number;
  sshProxyCommand?: string;
  intendedStatus: string;
  startDate?: string;
  endDate?: string;
  jupyterToken?: string;
  jupyterUrl?: string;
  statusMsg?: string;
  hostname?: string;
  gpuCt?: number;
  gpuName?: string;
  gpuMem?: number;
  cpuCores?: number;
  cpuMem?: number;
  inetUp: number;
  inetDown: number;
  pricePerHour?: number;
  costPerHour?: number;
  minBid?: number;
  numGpus?: number;
  machine?: {
    id: number;
    hostname: string;
    geolocation: string;
  };
  publicIpaddr?: string;
  ports?: Record<string, { HostIp: string; HostPort: string }[]>;
  rentable?: boolean;
}

/**
 * API response for docker images
 */
export interface DockerImage {
  id: number;
  image_uuid: string;
  image_id: string;
  docker_id: string;
  version: string;
  name: string;
  description: string;
  url: string;
  logo_url?: string;
  architecture?: string;
  is_cuda?: boolean;
  is_pytorch?: boolean;
  is_tensorflow?: boolean;
  starred?: boolean;
  verified?: boolean;
  total_downloads?: number;
  is_paid?: boolean;
  price_per_hour?: number;
}

/**
 * API response for user information
 */
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  fullname?: string;
  balance: number;
  credit?: number;
  verified_email: boolean;
  joined?: string;
  avatar_url?: string;
  subscribed?: boolean;
  plan_name?: string;
  status?: string;
  rentable?: boolean;
}

/**
 * Parameters for searching machine offers
 */
export interface SearchOffersParams {
  cudaMaxGood?: number;
  cudaVers?: number;
  diskSpace?: number;
  external?: boolean;
  inetDown?: number;
  inetUp?: number;
  minBid?: number;
  numGpus?: number;
  orderBy?: string;
  q?: string;
  verified?: boolean;
  type?: string;
  storageSize?: number;
  reliability?: number;
  directPortCount?: number;
}

/**
 * Parameters for creating a new instance
 */
export interface CreateInstanceParams {
  id: number; // Use 'id' to match the endpoint path parameter
  image: string;
  diskSpace?: number;
  jupyterLab?: boolean;
  sshKeyIds?: number[];
  runCommand?: string;
  env?: Record<string, string>;
  [key: string]: any;
}

/**
 * API response for createInstance
 */
export interface CreateInstanceResponse {
  success: boolean;
  newContract: number;
}

/**
 * Parameters for listing instances
 */
export interface ListInstancesParams {
  owner?: string;
  q?: string;
}

/**
 * Error response from Vast.ai API
 */
export interface ApiError {
  error: {
    type: string;
    message: string;
    code?: number;
    field?: string;
  };
}
