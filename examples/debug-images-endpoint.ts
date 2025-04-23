/**
 * Specialized debug script for the images endpoint
 * 
 * This script runs multiple tests against different possible endpoints 
 * to determine the correct endpoint for listing Docker images in the Vast.ai API
 */

import axios from 'axios';

// Get API key from environment variable
const apiKey = process.env.VAST_API_KEY;

if (!apiKey) {
  console.error('Please set the VAST_API_KEY environment variable');
  process.exit(1);
}

// Base URL for Vast.ai API
const baseUrl = 'https://console.vast.ai';

// Test multiple possible endpoints
const endpoints = [
  '/api/v0/images',              // Current implementation
  '/api/v0/docker-images',       // Alternate possibility
  '/api/v0/image',               // Singular version
  '/api/v0/offerings/images',    // Nested under offerings
  '/api/v0/users/current/images' // User's images
];

// Function to test an endpoint
async function testEndpoint(path: string) {
  console.log(`\nTesting endpoint: ${path}`);
  console.log('-'.repeat(50));
  
  try {
    const url = `${baseUrl}${path}`;
    console.log(`Making GET request to: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      // Add validation query parameter to see if endpoint exists
      params: {
        _validate: true
      },
      // Short timeout to make testing faster
      timeout: 5000
    });
    
    console.log(`✅ SUCCESS: Status: ${response.status}`);
    console.log(`Response type: ${typeof response.data} (${Array.isArray(response.data) ? 'array' : 'object'})`);
    console.log(`Data length: ${Array.isArray(response.data) ? response.data.length : '(not an array)'}`);
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log(`First item sample:`);
      const sample = response.data[0];
      console.log(JSON.stringify(sample, null, 2).substring(0, 500) + (JSON.stringify(sample, null, 2).length > 500 ? '...' : ''));
    } else if (typeof response.data === 'object') {
      console.log(`Response data:`);
      console.log(JSON.stringify(response.data, null, 2).substring(0, 500) + (JSON.stringify(response.data, null, 2).length > 500 ? '...' : ''));
    }
    
    return true;
  } catch (error: any) {
    console.log(`❌ ERROR: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error data: ${JSON.stringify(error.response.data || {})}`);
      
      if (error.response.status === 404) {
        console.log('Endpoint does not exist.');
      } else if (error.response.status === 401) {
        console.log('Authentication error. Check your API key.');
      } else if (error.response.status === 403) {
        console.log('Permission denied. Your API key may not have access to this resource.');
      }
    } else if (error.request) {
      console.log('No response received from server.');
    }
    
    return false;
  }
}

// Test with a query parameter as well
async function testWithQueryParams(path: string) {
  console.log(`\nTesting endpoint with query params: ${path}`);
  console.log('-'.repeat(50));
  
  try {
    const url = `${baseUrl}${path}`;
    console.log(`Making GET request to: ${url} with params: { is_public: true }`);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        is_public: true
      },
      timeout: 5000
    });
    
    console.log(`✅ SUCCESS: Status: ${response.status}`);
    console.log(`Response type: ${typeof response.data} (${Array.isArray(response.data) ? 'array' : 'object'})`);
    console.log(`Data length: ${Array.isArray(response.data) ? response.data.length : '(not an array)'}`);
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log(`First item sample:`);
      const sample = response.data[0];
      console.log(JSON.stringify(sample, null, 2).substring(0, 500));
    }
    
    return true;
  } catch (error: any) {
    console.log(`❌ ERROR: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error data: ${JSON.stringify(error.response.data || {})}`);
    }
    
    return false;
  }
}

// Function to test general API connectivity
async function testApiConnectivity() {
  console.log('\nTesting general API connectivity');
  console.log('-'.repeat(50));
  
  try {
    // Check if we can access the user endpoint as a baseline
    const url = `${baseUrl}/api/v0/users/current`;
    console.log(`Making GET request to user endpoint: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log(`✅ SUCCESS: Status: ${response.status}`);
    console.log(`User authenticated as: ${response.data.username || 'Unknown'}`);
    return true;
  } catch (error: any) {
    console.log(`❌ ERROR: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error data: ${JSON.stringify(error.response.data || {})}`);
      
      if (error.response.status === 401) {
        console.log('API key authentication failed. Please check your API key.');
      }
    }
    
    return false;
  }
}

// Check if the endpoint exists in API documentation
async function checkEndpointDocumentation() {
  console.log('\nChecking API documentation for image endpoints');
  console.log('-'.repeat(50));
  
  try {
    // Some APIs provide an endpoint that lists all available endpoints
    const url = `${baseUrl}/api`;
    console.log(`Attempting to access API documentation: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 5000
    });
    
    console.log(`✅ Documentation API responded with status: ${response.status}`);
    return true;
  } catch (error: any) {
    console.log(`❌ Documentation API error: ${error.message}`);
    return false;
  }
}

// Main function to run all tests
async function runAllTests() {
  console.log('🔍 Vast.ai API Image Endpoint Diagnostics');
  console.log('='.repeat(50));
  console.log(`Date/Time: ${new Date().toISOString()}`);
  
  // Safely display a masked version of the API key
  if (apiKey) {
    console.log(`API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  } else {
    console.log('API Key: Not provided');
  }
  
  console.log(`Base URL: ${baseUrl}`);
  console.log('='.repeat(50));
  
  // First check overall API connectivity
  const isConnected = await testApiConnectivity();
  
  if (!isConnected) {
    console.log('\n⚠️ Cannot connect to Vast.ai API. Please check your API key and internet connection.');
    return;
  }
  
  // Check documentation
  await checkEndpointDocumentation();
  
  // Test all endpoints
  console.log('\nTesting all possible image endpoints:');
  
  // Define proper type for results array
  type EndpointResult = { endpoint: string; success: boolean };
  const results: EndpointResult[] = [];
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    results.push({ endpoint, success });
    
    // If successful with basic test, try with query params
    if (success) {
      await testWithQueryParams(endpoint);
    }
  }
  
  // Summary
  console.log('\n📋 Results Summary:');
  console.log('='.repeat(50));
  
  const successfulEndpoints = results.filter(r => r.success);
  const failedEndpoints = results.filter(r => !r.success);
  
  if (successfulEndpoints.length > 0) {
    console.log(`Found ${successfulEndpoints.length} working endpoints:`);
    successfulEndpoints.forEach(r => console.log(`- ${r.endpoint}`));
  } else {
    console.log('⚠️ No working image endpoints found.');
    console.log('This may indicate:');
    console.log('1. The endpoint requires different authentication');
    console.log('2. The endpoint might be accessible through a different URL structure');
    console.log('3. Your account may not have access to this feature');
    console.log('4. Vast.ai might not expose a public images API endpoint');
  }
  
  console.log('\nRecommendation:');
  if (successfulEndpoints.length > 0) {
    console.log(`Use endpoint: ${successfulEndpoints[0].endpoint}`);
  } else {
    console.log('Check Vast.ai API documentation or contact support for the correct images endpoint.');
    console.log('Alternatively, the Python SDK source code may provide insights into the correct endpoint.');
  }
}

// Run the tests
runAllTests().catch(console.error);