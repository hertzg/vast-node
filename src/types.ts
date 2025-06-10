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
  cudaMaxGood: number;         // API: cuda_max_good
  numGpus: number;             // API: num_gpus
  gpuName: string;             // API: gpu_name
  gpuRam: number;              // API: gpu_ram
  diskSpace: number;           // API: disk_space
  cpuRam: number;              // API: cpu_ram
  cpuCores: number;            // API: cpu_cores
  reliability: number;
  dlperf: number;
  dlperfPerDphtotal: number;   // API: dlperf_per_dphtotal
  inetUp: number;              // API: inet_up
  inetDown: number;            // API: inet_down
  verification: string;
  dphTotal: number;            // API: dph_total
  minBid: number;              // API: min_bid
  datacenter: {
    id: number;
    geolocation: string;
  };
  external: boolean;
  hostingType: string;         // API: hosting_type
  directPortCount: number;     // API: direct_port_count
  gpuFrac?: number;            // API: gpu_frac
  rentable?: boolean;          // API: rentable
  rented?: boolean;
  hostname?: string;
  driverVersion?: string;      // API: driver_version
  cudaVersion?: string;        // API: cuda_version
}

/**
 * API response for instance details
 *
 * Note: The actual API uses snake_case, but we use camelCase in our TypeScript interface
 * for better developer experience. The transformation is handled internally.
 */
export interface Instance {
  id: number;
  machineId: number;           // API: machine_id
  actualStatus: string;        // API: actual_status
  curState: string;            // API: cur_state
  nextState?: string;          // API: next_state
  imageUuid: string;           // API: image_uuid
  imageRuntype: string;        // API: image_runtype
  imageArgs?: string;          // API: image_args
  env?: Record<string, string>;
  extraEnv?: Record<string, string>; // API: extra_env
  diskUsage?: number;          // API: disk_usage
  diskSpace?: number;          // API: disk_space
  sshPort?: number;            // API: ssh_port
  sshIdx?: number;             // API: ssh_idx
  sshHost?: string;            // API: ssh_host
  sshKeyId?: number;           // API: ssh_key_id
  sshProxyCommand?: string;    // API: ssh_proxy_command
  intendedStatus: string;      // API: intended_status
  startDate?: string;          // API: start_date
  endDate?: string;            // API: end_date
  jupyterToken?: string;       // API: jupyter_token
  jupyterUrl?: string;         // API: jupyter_url
  statusMsg?: string;          // API: status_msg
  hostname?: string;
  gpuCt?: number;              // API: gpu_ct
  gpuName?: string;            // API: gpu_name
  gpuMem?: number;             // API: gpu_mem
  cpuCores?: number;           // API: cpu_cores
  cpuMem?: number;             // API: cpu_mem
  inetUp: number;              // API: inet_up
  inetDown: number;            // API: inet_down
  pricePerHour?: number;       // API: price_per_hour
  costPerHour?: number;        // API: cost_per_hour
  minBid?: number;             // API: min_bid
  numGpus?: number;            // API: num_gpus
  machine?: {
    id: number;
    hostname: string;
    geolocation: string;
  };
  publicIpaddr?: string;       // API: public_ipaddr
  ports?: Record<string, {     // API: ports
    HostIp: string,
    HostPort: string
  }[]
  >;
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
  cudaMaxGood?: number;      // API: cuda_max_good
  cudaVers?: number;         // API: cuda_vers
  diskSpace?: number;        // API: disk_space
  external?: boolean;
  inetDown?: number;         // API: inet_down
  inetUp?: number;           // API: inet_up
  minBid?: number;           // API: min_bid
  numGpus?: number;          // API: num_gpus
  orderBy?: string;          // API: order
  q?: string;
  verified?: boolean;
  type?: string;
  storageSize?: number;      // API: storage_size
  reliability?: number;
  directPortCount?: number;  // API: direct_port_count
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
  [key: string]: any; // Allow other properties
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