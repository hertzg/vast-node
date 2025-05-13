import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { VastClient } from '../vast-client';
import { Instance, MachineOffer, DockerImage, UserInfo, CreateInstanceParams } from '../types'; // Import necessary types

// Add custom type definition for mocked axios instance (might not be needed if mocking client.api)
// interface MockAxiosInstance extends AxiosInstance {
//   request: jest.Mock;
// }

// Mock axios - Keep the mock for axios.create and isAxiosError if needed by the SDK's internal workings
jest.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      response: {
        use: jest.fn()
      }
    },
    request: jest.fn(), // Keep request mock in case SDK uses it directly somewhere
    defaults: {
      headers: {
        common: {}
      }
    }
  };

  return {
    create: jest.fn(() => mockAxiosInstance),
    isAxiosError: jest.fn().mockReturnValue(true),
    // Add other axios exports if the SDK uses them directly
    // default: axios, // Might be needed depending on how axios is imported in the SDK
  };
});

describe('VastClient', () => {
  let client: VastClient;
  const mockApiKey = 'test-api-key'; // Define mockApiKey here

  beforeEach(() => {
    jest.clearAllMocks();
    client = new VastClient(mockApiKey);

    // Mock the underlying API methods accessed by VastClient
    // This is the correct layer to mock for unit testing VastClient logic
    (client as any).api = {
        searchOffers: jest.fn(),
        getOffer: jest.fn(),
        listInstances: jest.fn(),
        getInstance: jest.fn(),
        createInstance: jest.fn(),
        startInstance: jest.fn(),
        stopInstance: jest.fn(),
        deleteInstance: jest.fn(),
        listImages: jest.fn(),
        getUserInfo: jest.fn(),
        // Add other API methods as needed for tests
    };
  });

  test('should set the API key correctly', () => {
    // This test mocks axios.create, which might still be relevant if the SDK
    // uses axios.defaults directly for the API key.
    const axiosInstance = (axios.create as jest.Mock).mock.results[0].value; // Get the mocked instance
    client.setApiKey('new-api-key');
    expect(axiosInstance.defaults.headers.common['Authorization']).toBe('Bearer new-api-key');
  });

  test('should search offers with correct parameters', async () => {
    const mockSearchParams = {
      numGpus: 1,
      cudaMaxGood: 11.5
    };

    // Setup the mock API response for searchOffers - an array of MachineOffer
    const mockOffersResponse: MachineOffer[] = [
      {
        id: 1234,
        cudaMaxGood: 11.7,
        numGpus: 1,
        gpuName: 'RTX 3080',
        gpuRam: 10,
        diskSpace: 100,
        cpuRam: 32,
        cpuCores: 16, // Added missing properties based on types.d.ts
        reliability: 0.9,
        dlperf: 100,
        dlperfPerDphtotal: 1000,
        inetUp: 500,
        inetDown: 500,
        verification: 'verified',
        dphTotal: 0.1,
        minBid: 0.05,
        datacenter: { id: 1, geolocation: 'USA' },
        external: false,
        hostingType: 'on-demand',
        directPortCount: 1,
        rentable: true,
        rented: false,
        hostname: 'test-host', // Added optional properties
        driverVersion: '510.0',
        cudaVersion: '11.7',
      }
    ];

    // Mock the API method to resolve with the mock response structure expected by VastClient
    (client as any).api.searchOffers.mockResolvedValue({ offers: mockOffersResponse });

    // Call the method
    const result = await client.searchOffers(mockSearchParams);

    // Verify the result is the array of offers
    expect(result).toEqual(mockOffersResponse);

    // Verify the API method was called with the correct parameters (camelCase)
    expect((client as any).api.searchOffers).toHaveBeenCalledWith(mockSearchParams);
  });

  test('should get a specific offer by ID', async () => {
    const offerId = 12345;
    const mockOfferResponse: MachineOffer = {
        id: 12345,
        cudaMaxGood: 11.7,
        numGpus: 1,
        gpuName: 'RTX 3080',
        gpuRam: 10,
        diskSpace: 100,
        cpuRam: 32,
        cpuCores: 16, // Added missing cpuCores property
        reliability: 0.9,
        dlperf: 100,
        dlperfPerDphtotal: 1000,
        inetUp: 500,
        inetDown: 500,
        verification: 'verified',
        dphTotal: 0.1,
        minBid: 0.05,
        datacenter: { id: 1, geolocation: 'USA' },
        external: false,
        hostingType: 'on-demand',
        directPortCount: 1,
        rentable: true,
        rented: false,
         hostname: 'test-host',
        driverVersion: '510.0',
        cudaVersion: '11.7',
    };

    // Mock the API method to resolve with the mock response structure
    (client as any).api.getOffer.mockResolvedValue({ data: mockOfferResponse });

    const result = await client.getOffer(offerId);

    // Verify the result is the offer object wrapped in 'data' as returned by the API method mock
    expect(result).toEqual({ data: mockOfferResponse });

    // Verify the API method was called with the correct ID
    expect((client as any).api.getOffer).toHaveBeenCalledWith({ id: offerId });
  });

  test('should list instances with correct parameters', async () => {
    const mockListParams = {
      owner: 'me',
      q: 'running'
    };

    // Setup the mock API response for listInstances - the API returns an object with instances array
    const mockInstancesResponse = {
      instances: [
        {
          id: 12345,
          machineId: 6789,
          actualStatus: 'running',
          curState: 'running',
          intendedStatus: 'running',
          imageUuid: 'abc',
          imageRuntype: 'docker',
          sshPort: 2222,
          sshHost: '1.2.3.4',
          inetUp: 100,
          inetDown: 100,
          pricePerHour: 0.5,
          costPerHour: 0.6,
          numGpus: 1,
          // Add other relevant Instance properties
        } as Instance // Cast to Instance type
      ]
    };

    // Mock the API method to resolve with the mock response structure
    (client as any).api.listInstances.mockResolvedValue(mockInstancesResponse);

    // Call the method
    const instances = await client.listInstances(mockListParams);

    // Verify the returned instances are what we expect (the instances array)
    expect(instances).toEqual(mockInstancesResponse.instances);

    // Verify the API method was called with the correct parameters (camelCase)
    expect((client as any).api.listInstances).toHaveBeenCalledWith(
      { ...mockListParams, api_key: mockApiKey },
      { headers: { Authorization: '' } }
    );
  });

  test('should get a specific instance by ID', async () => {
    const instanceId = 12345;
    const mockInstanceResponse: Instance = {
        id: 12345,
        machineId: 6789,
        actualStatus: 'running',
        curState: 'running',
        intendedStatus: 'running',
        imageUuid: 'abc',
        imageRuntype: 'docker',
        sshPort: 2222,
        sshHost: '1.2.3.4',
        inetUp: 100,
        inetDown: 100,
        pricePerHour: 0.5,
        costPerHour: 0.6,
        numGpus: 1,
        // Add other relevant Instance properties
    };

    // Mock the API method to resolve with the mock response structure
    (client as any).api.getInstance.mockResolvedValue({ data: { instances: [mockInstanceResponse] } }); // getInstance API returns { instances: [...] }

    const result = await client.getInstance(instanceId);

    // Verify the result is the instance object (SDK extracts the single instance)
    expect(result).toEqual(mockInstanceResponse);

    // Verify the API method was called with the correct ID
    expect((client as any).api.getInstance).toHaveBeenCalledWith({ id: instanceId });
  });


  test('should create a new instance with correct parameters', async () => {
    const mockCreateParams: CreateInstanceParams = { // Add type for clarity
      id: 12345, // Assuming this 'id' is required by the type, possibly for path param
      image: 'pytorch/pytorch:latest',
      machineId: 12345, // This is for the 'machine_id' field in the body
      diskSpace: 10,
      jupyterLab: true
    };

    // Setup the mock API response for createInstance - an Instance object
    const mockCreatedInstance: Instance = {
      id: 54321, // The new instance ID
      machineId: 12345, // The offer ID
      actualStatus: 'creating',
      curState: 'creating',
      intendedStatus: 'running',
      imageUuid: 'abc',
      imageRuntype: 'docker',
      sshPort: undefined, // Changed null to undefined
      sshHost: undefined, // Changed null to undefined
      inetUp: 0,
      inetDown: 0,
      // Add other relevant Instance properties with initial values
    };

    // Mock the API method to resolve with the mock Instance object structure
    (client as any).api.createInstance.mockResolvedValue({ data: mockCreatedInstance });

    // Call the method
    const result = await client.createInstance(mockCreateParams);

    // Verify the result is the created Instance object
    expect(result).toEqual(mockCreatedInstance);

    // Verify the API method was called with the correct parameters
    // The createInstance method transforms params to apiPayload
    const expectedApiPayload = {
      id: mockCreateParams.id, // Add the 'id' field
      image: mockCreateParams.image,
      diskSpace: mockCreateParams.diskSpace,
      jupyterLab: mockCreateParams.jupyterLab,
      machine_id: mockCreateParams.machineId, // API expects machine_id
      api_key: mockApiKey
    };
    expect((client as any).api.createInstance).toHaveBeenCalledWith(
      expectedApiPayload,
      { headers: { Authorization: '' } }
    );
  });

  test('should start an instance with the correct ID', async () => {
    const instanceId = 12345;

    // Mock the API method to resolve successfully
    (client as any).api.startInstance.mockResolvedValue({ data: { success: true } }); // Mock a typical success response

    await client.startInstance(instanceId);

    // Verify the API method was called with the correct ID
    expect((client as any).api.startInstance).toHaveBeenCalledWith({ id: instanceId });
  });

  test('should stop an instance with the correct ID', async () => {
    const instanceId = 12345;

    // Mock the API method to resolve successfully
    (client as any).api.stopInstance.mockResolvedValue({ data: { success: true } }); // Mock a typical success response

    await client.stopInstance(instanceId);

    // Verify the API method was called with the correct ID and API key
    expect((client as any).api.stopInstance).toHaveBeenCalledWith(
      { id: instanceId, api_key: mockApiKey },
      { headers: { Authorization: '' } }
    );
  });

  test('should delete an instance with the correct ID', async () => {
    const instanceId = 12345;

    // Mock the API method to resolve successfully
    (client as any).api.deleteInstance.mockResolvedValue({ data: { success: true } }); // Mock a typical success response

    await client.deleteInstance(instanceId);

    // Verify the API method was called with the correct ID and API key
    expect((client as any).api.deleteInstance).toHaveBeenCalledWith({ id: instanceId, api_key: mockApiKey });
  });

  test('should list images correctly', async () => {
    // Setup the mock API response for listImages - an array of DockerImage
    const mockImagesResponse: DockerImage[] = [
      {
        id: 1,
        image_uuid: 'uuid1',
        image_id: 'id1',
        docker_id: 'docker1',
        version: 'latest',
        name: 'image1',
        description: 'desc1',
        url: 'url1',
        // Add other relevant DockerImage properties
      }
    ];

    // Mock the API method to resolve with the mock response structure
    (client as any).api.listImages.mockResolvedValue({ data: { images: mockImagesResponse } });

    const result = await client.listImages();

    // Verify the result is the array of images wrapped in the API response structure
    expect(result).toEqual({ data: { images: mockImagesResponse } });

    // Verify the API method was called
    expect((client as any).api.listImages).toHaveBeenCalled();
  });

  test('should get user info correctly', async () => {
    // Setup the mock API response for getUserInfo - a UserInfo object
    const mockUserInfoResponse: UserInfo = {
      id: 123,
      username: 'testuser',
      email: 'test@example.com',
      balance: 10.5,
      verified_email: true, // Added missing verified_email property
      // Add other relevant UserInfo properties
    };

    // Mock the API method to resolve with the mock response structure
    (client as any).api.getUserInfo.mockResolvedValue({ data: mockUserInfoResponse });

    const result = await client.getUserInfo();

    // Verify the result is the UserInfo object wrapped in 'data' as returned by the API method mock
    expect(result).toEqual({ data: mockUserInfoResponse });

    // Verify the API method was called
    expect((client as any).api.getUserInfo).toHaveBeenCalled();
  });
});