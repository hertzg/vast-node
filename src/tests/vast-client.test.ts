import axios from 'axios';
import { VastClient } from '../vast-client';

// Mock axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      interceptors: {
        response: {
          use: jest.fn()
        }
      },
      request: jest.fn(),
      defaults: {
        headers: {
          common: {}
        }
      }
    })),
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
    axiosInstance.request = jest.fn().mockResolvedValue({ data: mockResponseData });
  });
  
  test('should set the API key correctly', () => {
    const axiosInstance = mockedAxios.create();
    client.setApiKey('new-api-key');
    expect(axiosInstance.defaults.headers.common['Authorization']).toBe('Bearer new-api-key');
  });
  
  test('should search offers with correct parameters', async () => {
    const mockSearchParams = {
      num_gpus: 1,
      cuda_max_good: 11.5
    };
    
    await client.searchOffers(mockSearchParams);
    
    const axiosInstance = mockedAxios.create();
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('GET');
    expect(lastCall.url).toBe('/api/v0/bundles');
    expect(lastCall.params).toEqual(mockSearchParams);
  });
  
  test('should get a specific offer by ID', async () => {
    const offerId = 12345;
    
    await client.getOffer(offerId);
    
    const axiosInstance = mockedAxios.create();
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('GET');
    expect(lastCall.url).toBe('/api/v0/bundles/12345');
  });
  
  test('should list instances with correct parameters', async () => {
    const mockListParams = {
      owner: 'me',
      q: 'running'
    };
    
    await client.listInstances(mockListParams);
    
    const axiosInstance = mockedAxios.create();
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('GET');
    expect(lastCall.url).toBe('/api/v0/instances');
    expect(lastCall.params).toEqual(mockListParams);
  });
  
  test('should create a new instance with correct parameters', async () => {
    const mockCreateParams = {
      image: 'pytorch/pytorch:latest',
      machineId: 12345,
      diskSpace: 10,
      jupyterLab: true
    };
    
    await client.createInstance(mockCreateParams);
    
    const axiosInstance = mockedAxios.create();
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('PUT');
    expect(lastCall.url).toBe('/api/v0/instances');
    expect(lastCall.data).toEqual(mockCreateParams);
  });
  
  test('should start an instance with the correct ID', async () => {
    const instanceId = 12345;
    
    await client.startInstance(instanceId);
    
    const axiosInstance = mockedAxios.create();
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('PUT');
    expect(lastCall.url).toBe('/api/v0/instances/12345/start');
  });
  
  test('should stop an instance with the correct ID', async () => {
    const instanceId = 12345;
    
    await client.stopInstance(instanceId);
    
    const axiosInstance = mockedAxios.create();
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('PUT');
    expect(lastCall.url).toBe('/api/v0/instances/12345/stop');
  });
  
  test('should delete an instance with the correct ID', async () => {
    const instanceId = 12345;
    
    await client.deleteInstance(instanceId);
    
    const axiosInstance = mockedAxios.create();
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('DELETE');
    expect(lastCall.url).toBe('/api/v0/instances/12345');
  });
  
  test('should list images correctly', async () => {
    await client.listImages();
    
    const axiosInstance = mockedAxios.create();
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('GET');
    expect(lastCall.url).toBe('/api/v0/images');
  });
  
  test('should get user info correctly', async () => {
    await client.getUserInfo();
    
    const axiosInstance = mockedAxios.create();
    const lastCall = axiosInstance.request.mock.calls[0][0];
    
    expect(lastCall.method).toBe('GET');
    expect(lastCall.url).toBe('/api/v0/users/current');
  });
});