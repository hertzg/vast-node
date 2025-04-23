/**
 * @file VastClient.ts
 * @description Node.js client for the Vast.ai API, providing programmatic access to GPU cloud resources
 * @author sebastian schepis
 * @license MIT
 */
import { MachineOffer, Instance, DockerImage, UserInfo, SearchOffersParams, CreateInstanceParams, ListInstancesParams } from './types';
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
export declare class VastClient {
    private api;
    private dynamicApi;
    private apiKey;
    constructor(apiKey?: string, serverUrl?: string);
    /**
     * Set the API key for authentication
     *
     * @param apiKey - Your Vast.ai API key, obtained from the Vast.ai console
     * @example
     * ```typescript
     * client.setApiKey('your-new-api-key');
     * ```
     */
    setApiKey(apiKey: string): void;
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
    searchOffers(params?: SearchOffersParams): Promise<MachineOffer[]>;
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
    getOffer(id: number): Promise<MachineOffer>;
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
    listInstances(params?: ListInstancesParams): Promise<Instance[]>;
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
    getInstance(id: number): Promise<Instance>;
    /**
     * Create a new instance on a machine
     *
     * @param params - Instance creation parameters
     * @param params.image - Docker image to use (e.g., "pytorch/pytorch:latest")
     * @param params.machineId - ID of the machine to use
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
     *   machineId: 12345,
     *   diskSpace: 20,
     *   jupyterLab: true,
     *   env: {
     *     JUPYTER_PASSWORD: "vastai"
     *   }
     * });
     * ```
     */
    createInstance(params: CreateInstanceParams): Promise<Instance>;
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
    startInstance(id: number): Promise<any>;
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
    stopInstance(id: number): Promise<any>;
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
    deleteInstance(id: number): Promise<any>;
    /**
     * List available docker images
     *
     * @returns Promise resolving to an array of available images
     *
     * @example
     * ```typescript
     * const images = await client.listImages();
     * ```
     */
    listImages(): Promise<DockerImage[]>;
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
    getUserInfo(): Promise<UserInfo>;
}
