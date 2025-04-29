/**
 * @file vast-client.test.ts
 * @description Unit tests for the VastClient class
 */

import axios from 'axios';
import { VastClient } from '../src/vast-client';

// Mock axios to avoid actual API calls during tests
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      request: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn()
        }
      },
      defaults: {
        headers: {
          common: {}
        }
      }
    })),
    isAxiosError: jest.fn()
  };
});

describe('VastClient', () => {
  let client: VastClient;
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    jest.clearAllMocks();
    client = new VastClient(mockApiKey);
  });
  
  describe('constructor', () => {
    it('should initialize with the provided API key', () => {
      expect(client).toBeDefined();
    });
    
    it('should initialize without an API key', () => {
      const clientWithoutKey = new VastClient();
      expect(clientWithoutKey).toBeDefined();
    });
  });
  
  describe('setApiKey', () => {
    it('should update the API key', () => {
      const newApiKey = 'new-api-key';
      client.setApiKey(newApiKey);
      // Implementation would need to expose the apiKey or have a getter to test this properly
    });
  });
  
  describe('searchOffers', () => {
    it('should call the searchOffers API with the provided parameters', async () => {
      // Setup the mock API response
      const mockResponse = [
        {
          id: 1234,
          cuda_max_good: 11.7,
          num_gpus: 1,
          gpu_name: 'RTX 3080',
          gpu_ram: 10,
          disk_space: 100,
          cpu_ram: 32,
          dph_total: 0.1
        }
      ];
      
      // Mock the API implementation
      (client as any).api.searchOffers = jest.fn().mockResolvedValue(mockResponse);
      
      // Call the method
      const result = await client.searchOffers({ numGpus: 1, cudaMaxGood: 11.7 });
      
      // Verify the result
      expect(result).toEqual(mockResponse);
      expect((client as any).api.searchOffers).toHaveBeenCalledWith({
        numGpus: 1,
        cudaMaxGood: 11.7
      });
    });
    
    it('should handle API errors', async () => {
      // Setup mock error
      const mockError = new Error('API Error');
      (client as any).api.searchOffers = jest.fn().mockRejectedValue(mockError);
      
      // Verify error handling
      await expect(client.searchOffers()).rejects.toThrow('API Error');
    });
  });
  
  describe('listInstances', () => {
    it('should call the listInstances API with the provided parameters', async () => {
      // Setup the mock API response
      const mockResponse = [
        {
          id: 5678,
          machine_id: 1234,
          actual_status: 'running',
          cur_state: 'running',
          intended_status: 'running'
        }
      ];
      
      // Mock the API implementation
      (client as any).api.listInstances = jest.fn().mockResolvedValue(mockResponse);
      
      // Call the method
      const result = await client.listInstances({ q: 'running' });
      
      // Verify the result
      expect(result).toEqual(mockResponse);
      expect((client as any).api.listInstances).toHaveBeenCalledWith({
        q: 'running'
      });
    });
  });
  
  describe('createInstance', () => {
    it('should call the createInstance API with the provided parameters', async () => {
      // Setup the mock API response
      const mockResponse = {
        id: 5678,
        machine_id: 1234,
        actual_status: 'created',
        cur_state: 'created',
        intended_status: 'running'
      };
      
      // Mock the API implementation
      (client as any).api.createInstance = jest.fn().mockResolvedValue(mockResponse);
      
      // Call the method
      const createParams = {
        image: 'pytorch/pytorch:latest',
        id: 1234, // Changed from machineId to id to match CreateInstanceParams
        diskSpace: 20
      };
      
      const result = await client.createInstance(createParams);
      
      // Verify the result
      expect(result).toEqual(mockResponse);
      expect((client as any).api.createInstance).toHaveBeenCalledWith(createParams);
    });
  });
  
  // Add more tests for other methods...
});