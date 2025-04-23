/**
 * @file types.ts
 * @description TypeScript interface definitions for Vast.ai API
 */

/**
 * API response for machine offers
 */
export interface MachineOffer {
  id: number;
  cuda_max_good: number;
  num_gpus: number;
  gpu_name: string;
  gpu_ram: number;
  disk_space: number;
  cpu_ram: number;
  cpu_cores: number;
  reliability: number;
  dlperf: number;
  dlperf_per_dphtotal: number;
  inet_up: number;
  inet_down: number;
  verification: string;
  dph_total: number;
  min_bid: number;
  datacenter: {
    id: number;
    geolocation: string;
  };
  external: boolean;
  hosting_type: string;
  direct_port_count: number;
  gpu_frac?: number;
  rented?: boolean;
  hostname?: string;
  driver_version?: string;
  cuda_version?: string;
}

/**
 * API response for instance details
 */
export interface Instance {
  id: number;
  machine_id: number;
  actual_status: string;
  cur_state: string;
  next_state?: string;
  image_uuid: string;
  image_runtype: string;
  image_args?: string;
  env?: Record<string, string>;
  extra_env?: Record<string, string>;
  disk_usage?: number;
  disk_space?: number;
  ssh_port?: number;
  ssh_idx?: number;
  ssh_host?: string;
  ssh_key_id?: number;
  ssh_proxy_command?: string;
  intended_status: string;
  start_date?: string;
  end_date?: string;
  jupyter_token?: string;
  jupyter_url?: string;
  status_msg?: string;
  hostname?: string;
  gpu_ct?: number;
  gpu_name?: string;
  gpu_mem?: number;
  cpu_cores?: number;
  cpu_mem?: number;
  inet_up: number;
  inet_down: number;
  price_per_hour?: number;
  cost_per_hour?: number;
  min_bid?: number;
  num_gpus?: number;
  machine?: {
    id: number;
    hostname: string;
    geolocation: string;
  };
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
  cuda_max_good?: number;
  cuda_vers?: number;
  disk_space?: number;
  external?: boolean;
  inet_down?: number;
  inet_up?: number;
  min_bid?: number;
  num_gpus?: number;
  order?: string;
  q?: string;
  verified?: boolean;
  type?: string;
  storage_size?: number;
  reliability?: number;
  direct_port_count?: number;
}

/**
 * Parameters for creating a new instance
 */
export interface CreateInstanceParams {
  image: string;
  machineId: number;
  diskSpace?: number;
  jupyterLab?: boolean;
  sshKeyIds?: number[];
  runCommand?: string;
  env?: Record<string, string>;
  [key: string]: any;
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