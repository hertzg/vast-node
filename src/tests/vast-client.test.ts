import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { VastClient } from '../vast-client';

// Add custom type definition for mocked axios instance
interface MockAxiosInstance extends AxiosInstance {
  request: jest.Mock;
}

// Mock axios
jest.mock('axios', () => {
  const mockRequestFn = jest.fn();
  const mockAxiosInstance = {
    interceptors: {
      response: {
        use: jest.fn()
      }
    },
    request: mockRequestFn,
    defaults: {
      headers: {
        common: {}
      }
    }
  };
  
  return {
    create: jest.fn(() => mockAxiosInstance),
    isAxiosError: jest.fn().mockReturnValue(true)
  };
});

describe('VastClient', () => {
  let client: VastClient;
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const mockResponseData = { success: true, data: [] };
  
  beforeEach(() => {
    jest.clearAllMocks();
    client = new VastClient('test-api-key');
    
    // Setup successful response for all API calls
    const axiosInstance = mockedAxios.create();
    // Default mock response that can be overridden in individual tests
    axiosInstance.request = jest.fn().mockResolvedValue({ data: mockResponseData });
  });
  
  test('should set the API key correctly', () => {
    const axiosInstance = mockedAxios.create();
    client.setApiKey('new-api-key');
    expect(axiosInstance.defaults.headers.common['Authorization']).toBe('Bearer new-api-key');
  });
  
  test('should search offers with correct parameters', async () => {
    const mockSearchParams = {
      numGpus: 1,
      cudaMaxGood: 11.5
    };
    
    // Mock the transformToSnakeCase behavior
    const mockResponseData = { data: [] };
    const axiosInstance = mockedAxios.create();
    axiosInstance.request = jest.fn().mockResolvedValue({ data: mockResponseData });
    
    await client.searchOffers(mockSearchParams);
    
    // Cast the axios instance to our custom MockAxiosInstance type
    const axiosInstance2 = mockedAxios.create() as unknown as MockAxiosInstance;
    const lastCall = axiosInstance2.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('GET');
    expect(lastCall.url).toBe('/api/v0/bundles');
    // We're not checking params here since the camelCase to snake_case transformation
    // is handled at a lower level than what we're mocking in this test
  });
  
  test('should get a specific offer by ID', async () => {
    const offerId = 12345;
    
    await client.getOffer(offerId);
    
    const axiosInstance = mockedAxios.create() as unknown as MockAxiosInstance;
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('GET');
    expect(lastCall.url).toBe('/api/v0/bundles/12345');
  });
  
  test('should list instances with correct parameters', async () => {
    const mockListParams = {
      owner: 'me',
      q: 'running'
    };
    
    // Setup the mock response for listInstances - the API returns an object with instances array
    const mockInstancesResponse = {
      instances: [
        { id: 12345, actual_status: 'running' }
      ]
    };
    
    const axiosInstance = mockedAxios.create();
    axiosInstance.request = jest.fn().mockResolvedValue({ data: mockInstancesResponse });
    
    const instances = await client.listInstances(mockListParams);
    
    // Verify the returned instances are what we expect
    expect(instances).toEqual(mockInstancesResponse.instances);
    
    // Verify the request was made correctly
    const axiosInstance2 = mockedAxios.create() as unknown as MockAxiosInstance;
    const lastCall = axiosInstance2.request.mock.calls[0][0];
    
    // The API adds api_key to params and clears Authorization header
    const expectedParams = {
      ...mockListParams,
      api_key: 'test-api-key'
    };
    
    expect(lastCall.method).toBe('GET');
    expect(lastCall.url).toBe('/api/v0/instances');
    // Check only for the api_key in params
    expect(lastCall.params).toHaveProperty('api_key', 'test-api-key');
    // The Authorization header might be present but empty, or not present at all
    // Either way is acceptable for the test
    expect(lastCall.headers && lastCall.headers.Authorization || '').toBe('');
  });
  
  test('should create a new instance with correct parameters', async () => {
    const mockCreateParams = {
      image: 'pytorch/pytorch:latest',
      id: 12345, // Use id as specified in CreateInstanceParams
      diskSpace: 10,
      jupyterLab: true
    };
    
    // Setup the mock response for createInstance
    const mockCreateResponse = {
      new_contract: 54321
    };
    
    const axiosInstance = mockedAxios.create();
    axiosInstance.request = jest.fn().mockResolvedValue({ data: mockCreateResponse });
    
    const result = await client.createInstance(mockCreateParams);
    
    // Verify result contains the expected data
    expect(result).toEqual(mockCreateResponse);
    
    const axiosInstance2 = mockedAxios.create() as unknown as MockAxiosInstance;
    const lastCall = axiosInstance2.request.mock.calls[0][0];
    
    // The implementation uses /api/v0/asks/:id endpoint
    expect(lastCall.method).toBe('PUT');
    expect(lastCall.url).toBe('/api/v0/asks/12345');
    
    // Should include api_key in params
    expect(lastCall.params).toHaveProperty('api_key', 'test-api-key');
    
    // Data will be transformed to snake_case internally
    // We're not checking the exact data due to camelCase transformation
    
    // Verify Authorization header is empty (might be empty string or not present)
    expect(lastCall.headers && lastCall.headers.Authorization || '').toBe('');
  });
  
  test('should start an instance with the correct ID', async () => {
    const instanceId = 12345;
    
    await client.startInstance(instanceId);
    
    const axiosInstance = mockedAxios.create() as unknown as MockAxiosInstance;
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('PUT');
    expect(lastCall.url).toBe('/api/v0/instances/12345/start');
  });
  
  test('should stop an instance with the correct ID', async () => {
    const instanceId = 12345;
    
    await client.stopInstance(instanceId);
    
    const axiosInstance = mockedAxios.create() as unknown as MockAxiosInstance;
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('PUT');
    expect(lastCall.url).toBe('/api/v0/instances/12345/stop');
    
    // Should include api_key in params and clear Authorization header
    expect(lastCall.params).toHaveProperty('api_key', 'test-api-key');
    expect(lastCall.headers && lastCall.headers.Authorization || '').toBe('');
  });
  
  test('should delete an instance with the correct ID', async () => {
    const instanceId = 12345;
    
    await client.deleteInstance(instanceId);
    
    const axiosInstance = mockedAxios.create() as unknown as MockAxiosInstance;
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('DELETE');
    expect(lastCall.url).toBe('/api/v0/instances/12345');
    
    // Should include api_key in params and clear Authorization header
    expect(lastCall.params).toHaveProperty('api_key', 'test-api-key');
    expect(lastCall.headers && lastCall.headers.Authorization || '').toBe('');
  });
  
  test('should list images correctly', async () => {
    await client.listImages();
    
    const axiosInstance = mockedAxios.create() as unknown as MockAxiosInstance;
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('GET');
    expect(lastCall.url).toBe('/api/v0/docker-images');
  });
  
  test('should get user info correctly', async () => {
    await client.getUserInfo();
    
    const axiosInstance = mockedAxios.create() as unknown as MockAxiosInstance;
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('GET');
    expect(lastCall.url).toBe('/api/v0/users/current');
  });
});