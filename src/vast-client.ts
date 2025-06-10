import type { AxiosError, AxiosResponse } from "axios";
import { DynamicApi, transformToCamelCase } from "./dynamic-api.ts";
import type {
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
class VastClient {
  private apiKey: string | null = null;
  private dynamicApi: DynamicApi;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private api: any; // Adjust 'any' to a more specific type if possible, e.g. Record<string, Function>

  constructor(apiKey?: string, serverUrl = "https://console.vast.ai") {
    this.apiKey = apiKey || null;
    // Define all the Vast.ai API endpoints
    const apiConfig = {
      baseUrl: serverUrl,
      endpoints: {
        // Offers endpoints
        searchOffers: {
          method: "GET",
          path: "/api/v0/bundles",
          params: [
            "cudaMaxGood",
            "cudaVers",
            "diskSpace",
            "external",
            "inetDown",
            "inetUp",
            "minBid",
            "numGpus",
            "orderBy",
            "q",
            "verified",
            "type",
            "storageSize",
            "reliability",
            "directPortCount",
          ],
          responseType: "json", // Add responseType
          retryConfig: { maxRetries: 3, retryDelay: 1000 },
        },
        getOffer: {
          method: "GET",
          path: "/api/v0/bundles/:id",
          params: ["id"],
          retryConfig: { maxRetries: 2, retryDelay: 500 },
        },
        // Instances endpoints
        listInstances: {
          method: "GET",
          path: "/api/v0/instances",
          params: ["api_key"], // Include api_key for query param
          ignoreGlobalAuth: true, // Ignore the global Authorization header for this endpoint
          retryConfig: { maxRetries: 3, retryDelay: 1000 },
        },
        getInstance: {
          method: "GET",
          path: "/api/v0/instances/:id",
          params: ["id"],
          retryConfig: { maxRetries: 2, retryDelay: 500 },
        },
        createInstance: {
          method: "PUT",
          path: "/api/v0/asks/:id", // Use the /asks endpoint with offer ID in path
          params: ["id", "api_key"], // Include id for path interpolation and api_key for query param
          ignoreGlobalAuth: true, // Ignore the global Authorization header for this endpoint
          retryConfig: { maxRetries: 3, retryDelay: 1000 },
        },
        startInstance: {
          method: "PUT",
          path: "/api/v0/instances/:id/start",
          params: ["id"],
          retryConfig: { maxRetries: 3, retryDelay: 1000 },
        },
        stopInstance: {
          method: "PUT",
          path: "/api/v0/instances/:id/stop",
          params: ["id", "api_key"], // Include api_key for query param
          ignoreGlobalAuth: true, // Ignore the global Authorization header for this endpoint
          retryConfig: { maxRetries: 3, retryDelay: 1000 },
        },
        deleteInstance: {
          method: "DELETE", // Use DELETE method for destroying
          path: "/api/v0/instances/:id", // Use the instance ID in the path
          params: ["id", "api_key"],
          ignoreGlobalAuth: false, // Use global Bearer token by default
          retryConfig: { maxRetries: 3, retryDelay: 1000 },
        },
        // Images endpoints
        listImages: {
          method: "GET",
          path: "/api/v0/docker-images",
          params: ["api_key"],
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          responseType: "json",
          retryConfig: { maxRetries: 3, retryDelay: 1000 },
        },
        // User endpoints
        getUserInfo: {
          method: "GET",
          path: "/api/v0/users/current",
          retryConfig: { maxRetries: 3, retryDelay: 1000 },
        },
      },
      globalHeaders: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
      responseInterceptor: (response: AxiosResponse) => {
        // Log responses in debug mode
        // console.log('[VastClient Response Interceptor] Status:', response.status);
        // console.log('[VastClient Response Interceptor] Raw Data (snake_case):', response.data);
        const camelCaseData = transformToCamelCase(response.data);
        // console.log('[VastClient Response Interceptor] Transformed Data (camelCase):', camelCaseData);
        return camelCaseData;
      },
      errorInterceptor: (error: AxiosError) => {
        console.error("Request failed:", error.message);
        // Add more detailed logging for API errors
        if (error.response) {
          console.error(
            `API Error (${error.response.status}):`,
            error.response.data,
          );
        } else if (error.request) {
          console.error("Network Error - No response received");
        } else {
          console.error("Request configuration error:", error.message);
        }
        return Promise.reject(error);
      },
      globalRetryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        retryCondition: (error: AxiosError) => {
          // Retry on network errors or 5xx server errors
          return !error.response || error.response.status >= 500;
        },
      },
      queueConcurrency: 3,
    };
    // Create the dynamic API instance
    this.dynamicApi = new DynamicApi(apiConfig as any); // Use imported DynamicApi
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
      Authorization: `Bearer ${apiKey}`,
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
    //console.log('Searching offers with params:', JSON.stringify(params, null, 2));
    try {
      const responseObject = await this.api.searchOffers(params);
      // console.log('[VastClient searchOffers] Raw result from this.api.searchOffers (expected object with offers):', responseObject);

      // Extract the 'offers' array from the response object
      const offersArray = responseObject && responseObject.offers
        ? responseObject.offers
        : [];

      if (!Array.isArray(offersArray)) {
        console.error(
          "Error: Expected an array of offers, but received:",
          offersArray,
        );
        return []; // Return empty array on unexpected structure
      }

      //console.log(`Found ${offersArray.length} offers`);
      return offersArray;
    } catch (error) {
      console.error("Error searching offers:", error);
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
    //console.log(`Getting offer with ID: ${id}`);
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
    //console.log('Listing instances with params:', JSON.stringify(params, null, 2));
    // Include api_key in params for this specific endpoint
    const paramsWithApiKey = {
      ...params,
      api_key: this.apiKey, // Include API key as a parameter
    };
    try {
      // Pass an empty Authorization header to override the global one for this request
      const result = await this.api.listInstances(paramsWithApiKey, {
        headers: {
          Authorization: "",
        },
      });
      //console.log('Raw listInstances result:', JSON.stringify(result, null, 2)); // Log raw result
      // The API returns an object with an 'instances' key containing the array
      const instances = result && result.instances ? result.instances : [];
      //console.log(`Found ${instances.length} instances`);
      return instances; // Return the array of instances
    } catch (error) {
      console.error("Error listing instances:", error);
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
    //console.log(`Getting instance with ID: ${id}`);
    try {
      const responseObject = await this.api.getInstance({ id });
      // Assuming the actual instance is nested as per the test mock: result.data.instances[0]
      if (
        responseObject &&
        responseObject.instances &&
        responseObject.instances
      ) {
        return responseObject.instances as Instance;
      }
      // Handle cases where the structure is not as expected or instance is not found
      console.error(
        `Instance with ID ${id} not found or unexpected response structure:`,
        responseObject,
      );
      throw new Error(
        `Instance with ID ${id} not found or unexpected response structure.`,
      );
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
  async createInstance(
    params: CreateInstanceParams,
  ): Promise<CreateInstanceResponse> {
    //console.log('Creating instance with input params:', JSON.stringify(params, null, 2));

    // The 'params' object is of type CreateInstanceParams.
    // It includes 'machineId' which is the offer ID.
    // The API likely expects this as 'machine_id'.
    const { machineId, ...otherParams } = params;

    const apiPayload = {
      ...otherParams, // Spread other parameters like image, diskSpace, etc.
      machine_id: machineId, // Map machineId to machine_id for the API
      api_key: this.apiKey,
    };

    //console.log('Data object prepared for DynamicApi:', JSON.stringify(apiPayload, null, 2));
    try {
      const responseObject = await this.api.createInstance(apiPayload, {
        headers: {
          Authorization: "", // Override global auth for this specific call if needed
        },
      });

      if (responseObject.success && responseObject.newContract != null) {
        return responseObject;
      }

      console.error(
        "Failed to create instance or unexpected API response structure:",
        responseObject,
      );
      throw new Error(
        "Failed to create instance or unexpected API response structure.",
      );
    } catch (error) {
      console.error("Error creating instance:", error);
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
    //console.log(`Starting instance with ID: ${id}`);
    try {
      const result = await this.api.startInstance({ id });
      //console.log(`Instance ${id} start request successful`);
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
    //console.log(`Stopping instance with ID: ${id}`);
    try {
      const result = await this.api.stopInstance(
        { id, api_key: this.apiKey },
        {
          headers: {
            Authorization: "",
          },
        },
      );
      //console.log(`Instance ${id} stop request successful`);
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
    //console.log(`[VastClient deleteInstance] Attempting to delete instance ID: ${id}. API Key: ${this.apiKey}`);
    const deletePayload = { id, api_key: this.apiKey };
    // console.log('[VastClient deleteInstance] Payload for this.api.deleteInstance:', JSON.stringify(deletePayload));
    try {
      // Use global auth (Bearer token), api_key will be query param
      const result = await this.api.deleteInstance(deletePayload);
      //console.log(`Instance ${id} delete request successful`);
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
    //console.log('Listing available Docker images with params:', JSON.stringify(params, null, 2));
    try {
      const result = await this.api.listImages(params);
      //console.log(`Found ${result.length} Docker images`);
      return result;
    } catch (error) {
      console.error("Error listing Docker images:", error);
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
    //console.log('Getting user information');
    try {
      const result = await this.api.getUserInfo();
      //console.log(`Got user info for: ${result.username}`);
      return result;
    } catch (error) {
      console.error("Error getting user info:", error);
      throw error;
    }
  }
}

export { VastClient };
export type {
  ApiError,
  CreateInstanceParams,
  DockerImage,
  Instance,
  ListInstancesParams,
  MachineOffer,
  SearchOffersParams,
  UserInfo,
};
