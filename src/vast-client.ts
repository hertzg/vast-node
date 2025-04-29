/**
 * @file VastClient.ts
 * @description Node.js client for the Vast.ai API, providing programmatic access to GPU cloud resources
 * @author sebastian schepis
 * @license MIT
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { DynamicApi, ApiConfig, EndpointConfig } from './dynamic-api';
import {
  MachineOffer,
  Instance,
  DockerImage,
  UserInfo,
  SearchOffersParams,
  CreateInstanceParams,
  ListInstancesParams,
  ApiError
} from './types';

/**
 * VastClient
 *
 * The main client class for interacting with the Vast.ai API.
 * Provides methods for working with GPU instances, offers, and images.
 *
 * @example
 * ```typescript
 * // Initialize with your API key
 * const client = new VastClient('your-api-key');
 *
 * // Search for available machines
 * const offers = await client.searchOffers({
 *   num_gpus: 1,
 *   cuda_max_good: 11.5
 * });
 * ```
 */
export class VastClient {
  private api: Record<string, Function>;
  private dynamicApi: DynamicApi;
  private apiKey: string | null = null;
  
  constructor(apiKey?: string, serverUrl: string = 'https://console.vast.ai') {
    this.apiKey = apiKey || null;
    
    // Define all the Vast.ai API endpoints
    const apiConfig: ApiConfig = {
      baseUrl: serverUrl,
      endpoints: {
        // Offers endpoints
        searchOffers: { 
          method: 'GET', 
          path: '/api/v0/bundles', 
          retryConfig: { maxRetries: 3, retryDelay: 1000 }
        },
        getOffer: { 
          method: 'GET', 
          path: '/api/v0/bundles/:id', 
          params: ['id'],
          retryConfig: { maxRetries: 2, retryDelay: 500 }
        },
        
        // Instances endpoints
        listInstances: { 
          method: 'GET', 
          path: '/api/v0/instances', 
          params: ['api_key'], // Include api_key for query param
          ignoreGlobalAuth: true, // Ignore the global Authorization header for this endpoint
          retryConfig: { maxRetries: 3, retryDelay: 1000 }
        },
        getInstance: { 
          method: 'GET', 
          path: '/api/v0/instances/:id', 
          params: ['id'],
          retryConfig: { maxRetries: 2, retryDelay: 500 }
        },
        createInstance: {
          method: 'PUT',
          path: '/api/v0/asks/:id', // Use the /asks endpoint with offer ID in path
          params: ['id', 'api_key'], // Include id for path interpolation and api_key for query param
          ignoreGlobalAuth: true, // Ignore the global Authorization header for this endpoint
          retryConfig: { maxRetries: 3, retryDelay: 1000 }
        },
        startInstance: { 
          method: 'PUT', 
          path: '/api/v0/instances/:id/start', 
          params: ['id'],
          retryConfig: { maxRetries: 3, retryDelay: 1000 }
        },
        stopInstance: { 
          method: 'PUT', 
          path: '/api/v0/instances/:id/stop', 
          params: ['id', 'api_key'], // Include api_key for query param
          ignoreGlobalAuth: true, // Ignore the global Authorization header for this endpoint
          retryConfig: { maxRetries: 3, retryDelay: 1000 }
        },
        deleteInstance: { 
          method: 'DELETE', // Use DELETE method for destroying
          path: '/api/v0/instances/:id', // Use the instance ID in the path
          params: ['id', 'api_key'], // Include api_key for query param
          ignoreGlobalAuth: true, // Ignore the global Authorization header for this endpoint
          retryConfig: { maxRetries: 3, retryDelay: 1000 }
        },
        
        // Images endpoints
        listImages: {
          method: 'GET',
          path: '/api/v0/docker-images',
          params: ['api_key'],
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          responseType: 'json',
          retryConfig: { maxRetries: 3, retryDelay: 1000 }
        },
        
        // User endpoints
        getUserInfo: { 
          method: 'GET', 
          path: '/api/v0/users/current', 
          retryConfig: { maxRetries: 3, retryDelay: 1000 }
        },
      },
      globalHeaders: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      responseInterceptor: (response) => {
        // Log responses in debug mode
        // console.log('Response:', response.data);
        return response;
      },
      errorInterceptor: (error: AxiosError) => {
       console.error('Request failed:', error.message);
       
       // Add more detailed logging for API errors
       if (error.response) {
         console.error(`API Error (${error.response.status}):`, error.response.data);
       } else if (error.request) {
         console.error('Network Error - No response received');
       } else {
         console.error('Request configuration error:', error.message);
       }
       
       return Promise.reject(error);
     },
      globalRetryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        retryCondition: (error: AxiosError) => {
          // Retry on network errors or 5xx server errors
          return !error.response || error.response.status >= 500;
        }
      },
      queueConcurrency: 3
    };
    
    // Create the dynamic API instance
    this.dynamicApi = new DynamicApi(apiConfig);
    
    // Set auth token if provided
    if (this.apiKey) {
      this.setApiKey(this.apiKey);
    }
    
    // Create API methods from the configuration
    this.api = this.dynamicApi.createApiMethods();
  }
  
  /**
   * Set the API key for authentication
   *
   * @param apiKey - Your Vast.ai API key, obtained from the Vast.ai console
   * @example
   * ```typescript
   * client.setApiKey('your-new-api-key');
   * ```
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.dynamicApi.updateGlobalHeaders({
      'Authorization': `Bearer ${apiKey}`
    });
  }
  
  /**
   * Search for machine offers (available GPU instances)
   *
   * @param params - Search parameters to filter offers
   * @param params.cuda_max_good - Maximum CUDA version
   * @param params.cuda_vers - Specific CUDA version
   * @param params.disk_space - Minimum disk space in GB
   * @param params.external - Whether instance has external connectivity
   * @param params.inet_down - Minimum download speed in Mbps
   * @param params.inet_up - Minimum upload speed in Mbps
   * @param params.min_bid - Minimum bid price
   * @param params.num_gpus - Minimum number of GPUs
   * @param params.order - Order results (e.g., "score-" for descending score)
   * @param params.q - Search query string
   *
   * @returns Promise resolving to an array of machine offers
   *
   * @example
   * ```typescript
   * // Find machines with at least 2 GPUs and CUDA 11.7
   * const offers = await client.searchOffers({
   *   num_gpus: 2,
   *   cuda_max_good: 11.7,
   *   order: "dph_total+"  // Sort by price (cheapest first)
   * });
   * ```
   */
  async searchOffers(params: SearchOffersParams = {}): Promise<MachineOffer[]> {
    console.log('Searching offers with params:', JSON.stringify(params, null, 2));
    try {
      const result = await this.api.searchOffers(params);
      console.log(`Found ${result.length} offers`);
      return result;
    } catch (error) {
      console.error('Error searching offers:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific offer by ID
   *
   * @param id - The ID of the offer to retrieve
   * @returns Promise resolving to the offer details
   *
   * @example
   * ```typescript
   * const offer = await client.getOffer(12345);
   * ```
   */
  async getOffer(id: number): Promise<MachineOffer> {
    console.log(`Getting offer with ID: ${id}`);
    try {
      const result = await this.api.getOffer({ id });
      return result;
    } catch (error) {
      console.error(`Error getting offer ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * List all instances for the current user
   *
   * @param params - Optional filtering parameters
   * @param params.owner - Filter by owner (default: current user)
   * @param params.q - Search query string
   *
   * @returns Promise resolving to an array of instances
   *
   * @example
   * ```typescript
   * // List all running instances
   * const instances = await client.listInstances({
   *   q: "running"
   * });
   * ```
   */
  async listInstances(params: ListInstancesParams = {}): Promise<Instance[]> {
    console.log('Listing instances with params:', JSON.stringify(params, null, 2));
    
    // Include api_key in params for this specific endpoint
    const paramsWithApiKey = {
      ...params,
      api_key: this.apiKey // Include API key as a parameter
    };

    try {
      // Pass an empty Authorization header to override the global one for this request
      const result = await this.api.listInstances(paramsWithApiKey, {
        headers: {
          Authorization: ''
        }
      });
      console.log('Raw listInstances result:', JSON.stringify(result, null, 2)); // Log raw result
      
      // The API returns an object with an 'instances' key containing the array
      const instances = result && result.instances ? result.instances : [];
      
      console.log(`Found ${instances.length} instances`);
      return instances; // Return the array of instances
    } catch (error) {
      console.error('Error listing instances:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific instance by ID
   *
   * @param id - The ID of the instance to retrieve
   * @returns Promise resolving to the instance details
   *
   * @example
   * ```typescript
   * const instance = await client.getInstance(12345);
   * ```
   */
  async getInstance(id: number): Promise<Instance> {
    console.log(`Getting instance with ID: ${id}`);
    try {
      const result = await this.api.getInstance({ id });
      return result;
    } catch (error) {
      console.error(`Error getting instance ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new instance on a machine
   *
   * @param params - Instance creation parameters
   * @param params.image - Docker image to use (e.g., "pytorch/pytorch:latest")
   * @param params.id - ID of the offer to use (obtained from searchOffers)
   * @param params.diskSpace - Disk space in GB
   * @param params.jupyterLab - Whether to enable JupyterLab
   * @param params.sshKeyIds - Array of SSH key IDs to add
   * @param params.runCommand - Command to run on startup
   * @param params.env - Environment variables
   *
   * @returns Promise resolving to the created instance
   *
   * @example
   * ```typescript
   * const instance = await client.createInstance({
   *   image: "pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime",
   *   id: 12345, // Offer ID
   *   diskSpace: 20,
   *   jupyterLab: true,
   *   env: {
   *     JUPYTER_PASSWORD: "vastai"
   *   }
   * });
   * ```
   */
  async createInstance(params: CreateInstanceParams): Promise<Instance> {
    console.log('Creating instance with input params:', JSON.stringify(params, null, 2));
    
    // Structure the data for the API call
    const apiData: any = {
      ...params,
      id: params.id, // Include id for path parameter replacement
      api_key: this.apiKey // Include API key in the data object
    };

    // Remove machineId from the data sent in the request body (if it somehow still exists)
    delete apiData.machineId;

    console.log('Data object prepared for DynamicApi:', JSON.stringify(apiData, null, 2));

    try {
      // Pass an empty Authorization header to override the global one for this request
      const result = await this.api.createInstance(apiData, {
        headers: {
          Authorization: ''
        }
      });
      
      // Extract the new_contract ID from the result
      const instanceId = result && result.new_contract ? result.new_contract : undefined;
      
      console.log(`Created instance with ID: ${instanceId}`);
      
      // Return the result, which should now include the instance ID
      return result; 
    } catch (error) {
      console.error('Error creating instance:', error);
      throw error;
    }
  }
  
  /**
   * Start an instance
   *
   * @param id - The ID of the instance to start
   * @returns Promise resolving to the start operation result
   *
   * @example
   * ```typescript
   * await client.startInstance(12345);
   * ```
   */
  async startInstance(id: number): Promise<any> {
    console.log(`Starting instance with ID: ${id}`);
    try {
      const result = await this.api.startInstance({ id });
      console.log(`Instance ${id} start request successful`);
      return result;
    } catch (error) {
      console.error(`Error starting instance ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Stop an instance
   *
   * @param id - The ID of the instance to stop
   * @returns Promise resolving to the stop operation result
   *
   * @example
   * ```typescript
   * await client.stopInstance(12345);
   * ```
   */
  async stopInstance(id: number): Promise<any> {
    console.log(`Stopping instance with ID: ${id}`);
    try {
      const result = await this.api.stopInstance({ id, api_key: this.apiKey }, {
        headers: {
          Authorization: ''
        }
      });
      console.log(`Instance ${id} stop request successful`);
      return result;
    } catch (error) {
      console.error(`Error stopping instance ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete an instance
   *
   * @param id - The ID of the instance to delete
   * @returns Promise resolving to the delete operation result
   *
   * @example
   * ```typescript
   * await client.deleteInstance(12345);
   * ```
   */
  async deleteInstance(id: number): Promise<any> {
    console.log(`Deleting instance with ID: ${id}`);
    try {
      const result = await this.api.deleteInstance({ id, api_key: this.apiKey }, {
        headers: {
          Authorization: ''
        }
      });
      console.log(`Instance ${id} delete request successful`);
      return result;
    } catch (error) {
      console.error(`Error deleting instance ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * List available docker images
   *
   * @param params - Optional parameters
   * @param params.api_key - API key to use for this request (overrides the global API key)
   * @returns Promise resolving to an array of available images
   *
   * @example
   * ```typescript
   * // Using the global API key
   * const images = await client.listImages();
   *
   * // Or with an explicit API key
   * const images = await client.listImages({ api_key: 'your-api-key' });
   * ```
   */
  async listImages(params: { api_key?: string } = {}): Promise<DockerImage[]> {
    console.log('Listing available Docker images with params:', JSON.stringify(params, null, 2));
    try {
      const result = await this.api.listImages(params);
      console.log(`Found ${result.length} Docker images`);
      return result;
    }
    catch (error) {
      console.error('Error listing Docker images:', error);
      throw error;
    }
  }
  
  /**
   * Get current user information
   *
   * @returns Promise resolving to the user information
   *
   * @example
   * ```typescript
   * const user = await client.getUserInfo();
   * console.log(`Balance: $${user.balance}`);
   * ```
   */
  async getUserInfo(): Promise<UserInfo> {
    console.log('Getting user information');
    try {
      const result = await this.api.getUserInfo();
      console.log(`Got user info for: ${result.username}`);
      return result;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }
}