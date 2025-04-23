# Vast.ai Node.js SDK API Reference

This document provides detailed API documentation for the Vast.ai Node.js SDK.

## Table of Contents

1. [VastClient](#vastclient)
   - [Constructor](#constructor)
   - [Methods](#methods)
2. [API Parameters](#api-parameters)
   - [SearchOffers Parameters](#searchoffers-parameters)
   - [CreateInstance Parameters](#createinstance-parameters)
3. [Response Types](#response-types)
   - [Machine Offer](#machine-offer)
   - [Instance](#instance)
   - [Image](#image)
   - [User Info](#user-info)
4. [Error Handling](#error-handling)
5. [Advanced Configuration](#advanced-configuration)

## VastClient

The main client for interacting with the Vast.ai API.

### Constructor

```typescript
new VastClient(apiKey?: string, serverUrl: string = 'https://console.vast.ai')
```

**Parameters**:
- `apiKey` (optional): Your Vast.ai API key. If not provided at initialization, it must be set using the `setApiKey` method before making API calls.
- `serverUrl` (optional): The Vast.ai API server URL. Defaults to the official API endpoint.

**Example**:
```typescript
import { VastClient } from 'vast-node';

// Initialize with API key
const client = new VastClient('your-api-key');

// Initialize with custom server URL
const customClient = new VastClient('your-api-key', 'https://custom-vast-server.com');
```

### Methods

#### Authentication

##### `setApiKey(apiKey: string): void`

Sets the API key for authentication.

**Parameters**:
- `apiKey`: Your Vast.ai API key

**Example**:
```typescript
client.setApiKey('your-new-api-key');
```

#### Offers

##### `searchOffers(params?: SearchOffersParams): Promise<MachineOffer[]>`

Searches for available machine offers (rentable GPUs) based on specified criteria.

**Parameters**:
- `params` (optional): Search parameters (see [SearchOffers Parameters](#searchoffers-parameters))

**Returns**: Promise resolving to an array of machine offers

**Example**:
```typescript
const offers = await client.searchOffers({
  num_gpus: 2,
  cuda_max_good: 11.7,
  order: "dph_total+"
});
```

##### `getOffer(id: number): Promise<MachineOffer>`

Retrieves a specific machine offer by ID.

**Parameters**:
- `id`: The ID of the offer to retrieve

**Returns**: Promise resolving to the machine offer details

**Example**:
```typescript
const offer = await client.getOffer(12345);
```

#### Instances

##### `listInstances(params?: ListInstancesParams): Promise<Instance[]>`

Lists instances for the current user.

**Parameters**:
- `params` (optional): Filter parameters
  - `owner` (string, optional): Filter by owner (default: current user)
  - `q` (string, optional): Search query string

**Returns**: Promise resolving to an array of instances

**Example**:
```typescript
// List all instances
const allInstances = await client.listInstances();

// List only running instances
const runningInstances = await client.listInstances({ q: "running" });
```

##### `getInstance(id: number): Promise<Instance>`

Retrieves a specific instance by ID.

**Parameters**:
- `id`: The ID of the instance to retrieve

**Returns**: Promise resolving to the instance details

**Example**:
```typescript
const instance = await client.getInstance(12345);
```

##### `createInstance(params: CreateInstanceParams): Promise<Instance>`

Creates a new instance on a machine.

**Parameters**:
- `params`: Instance creation parameters (see [CreateInstance Parameters](#createinstance-parameters))

**Returns**: Promise resolving to the created instance

**Example**:
```typescript
const newInstance = await client.createInstance({
  image: "pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime",
  machineId: 12345,
  diskSpace: 20,
  jupyterLab: true,
  env: {
    JUPYTER_PASSWORD: "vastai"
  }
});
```

##### `startInstance(id: number): Promise<any>`

Starts an instance.

**Parameters**:
- `id`: The ID of the instance to start

**Returns**: Promise resolving to the start operation result

**Example**:
```typescript
await client.startInstance(12345);
```

##### `stopInstance(id: number): Promise<any>`

Stops an instance.

**Parameters**:
- `id`: The ID of the instance to stop

**Returns**: Promise resolving to the stop operation result

**Example**:
```typescript
await client.stopInstance(12345);
```

##### `deleteInstance(id: number): Promise<any>`

Deletes an instance.

**Parameters**:
- `id`: The ID of the instance to delete

**Returns**: Promise resolving to the delete operation result

**Example**:
```typescript
await client.deleteInstance(12345);
```

#### Images

##### `listImages(): Promise<DockerImage[]>`

Lists available docker images.

**Returns**: Promise resolving to an array of available images

**Example**:
```typescript
const images = await client.listImages();
```

#### User

##### `getUserInfo(): Promise<UserInfo>`

Retrieves current user information.

**Returns**: Promise resolving to the user information

**Example**:
```typescript
const user = await client.getUserInfo();
console.log(`Balance: $${user.balance}`);
```

## API Parameters

### SearchOffers Parameters

```typescript
interface SearchOffersParams {
  cuda_max_good?: number;    // Maximum CUDA version
  cuda_vers?: number;        // Specific CUDA version
  disk_space?: number;       // Minimum disk space in GB
  external?: boolean;        // Whether instance has external connectivity
  inet_down?: number;        // Minimum download speed in Mbps
  inet_up?: number;          // Minimum upload speed in Mbps
  min_bid?: number;          // Minimum bid price
  num_gpus?: number;         // Minimum number of GPUs
  order?: string;            // Order results (e.g., "score-" for descending score, "dph_total+" for price)
  q?: string;                // Search query string
}
```

### CreateInstance Parameters

```typescript
interface CreateInstanceParams {
  image: string;                       // Docker image to use (e.g., "pytorch/pytorch:latest")
  machineId: number;                   // ID of the machine to use
  diskSpace?: number;                  // Disk space in GB
  jupyterLab?: boolean;                // Whether to enable JupyterLab
  sshKeyIds?: number[];                // Array of SSH key IDs to add
  runCommand?: string;                 // Command to run on startup
  env?: Record<string, string>;        // Environment variables
  [key: string]: any;                  // Additional parameters
}
```

## Response Types

### Machine Offer

```typescript
interface MachineOffer {
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
```

### Instance

```typescript
interface Instance {
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
```

### Image

```typescript
interface DockerImage {
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
```

### User Info

```typescript
interface UserInfo {
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
```

## Error Handling

The SDK uses axios for HTTP requests and provides detailed error information:

```typescript
try {
  await client.createInstance({
    image: "pytorch/pytorch:latest",
    machineId: 12345
  });
} catch (error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error("Status:", error.response.status);
    console.error("Data:", error.response.data);
    console.error("Headers:", error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    console.error("Request error:", error.request);
  } else {
    // Something happened in setting up the request
    console.error("Error message:", error.message);
  }
}
```

The SDK also exports a typed `ApiError` interface:

```typescript
interface ApiError {
  error: {
    type: string;
    message: string;
    code?: number;
    field?: string;
  };
}
```

## Advanced Configuration

For advanced use cases, you can use the DynamicApi class directly:

```typescript
import { DynamicApi, ApiConfig } from 'vast-node';

const apiConfig: ApiConfig = {
  baseUrl: 'https://console.vast.ai',
  endpoints: {
    // Define custom endpoints
    customEndpoint: { 
      method: 'GET', 
      path: '/api/v0/custom/:id',
      params: ['id'],
      retryConfig: { 
        maxRetries: 3, 
        retryDelay: 1000 
      }
    }
  },
  globalHeaders: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  timeout: 30000,
  responseInterceptor: (response) => {
    // Custom response handling
    console.log('Response:', response.data);
    return response;
  },
  errorInterceptor: (error) => {
    // Custom error handling
    console.error('Request failed:', error.message);
    return Promise.reject(error);
  },
  globalRetryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      // Retry on network errors or 5xx server errors
      return !error.response || error.response.status >= 500;
    }
  },
  rateLimiter: {
    tokensPerInterval: 10,
    interval: 1000
  },
  queueConcurrency: 5
};

const api = new DynamicApi(apiConfig);
const methods = api.createApiMethods();

// Use custom endpoint
const result = await methods.customEndpoint({ id: 123 });