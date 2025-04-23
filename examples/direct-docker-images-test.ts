/**
 * Direct test of the Docker Images endpoint
 * 
 * This script bypasses the VastClient SDK and directly tests the docker-images 
 * endpoint with various authentication methods to determine why we're receiving HTML
 * instead of JSON.
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

// Test multiple authentication methods
async function testEndpoint() {
  console.log(`🔍 Testing Docker Images Endpoint with different auth methods`);
  console.log('='.repeat(50));

  // Log API key (masked)
  if (apiKey) {
    console.log(`API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  }
  
  // Test 1: Using Authorization header with Bearer token
  try {
    console.log('\n🧪 Test 1: Using Authorization Bearer header');
    console.log('-'.repeat(50));
    
    const response = await axios.get(`${baseUrl}/api/v0/docker-images`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      validateStatus: (status) => true // Don't throw on any status code
    });
    
    console.log(`Status Code: ${response.status}`);
    console.log(`Content Type: ${response.headers['content-type']}`);
    
    // If we got redirected
    if (response.request.res.responseUrl !== `${baseUrl}/api/v0/docker-images`) {
      console.log(`⚠️ Redirected to: ${response.request.res.responseUrl}`);
    }
    
    // Check response type
    if (response.headers['content-type']?.includes('application/json')) {
      console.log(`✅ Received JSON response (length: ${JSON.stringify(response.data).length} chars)`);
      console.log('First 500 chars of response:');
      console.log(JSON.stringify(response.data).substring(0, 500) + '...');
    } else {
      console.log(`❌ Received non-JSON response (${typeof response.data})`);
      
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.log('Response appears to be HTML (possibly a login page)');
      }
    }
  } catch (error: any) {
    console.error(`Error in Test 1: ${error.message || 'Unknown error'}`);
  }
  
  // Test 2: Using api_key as a query parameter
  try {
    console.log('\n🧪 Test 2: Using api_key query parameter');
    console.log('-'.repeat(50));
    
    const response = await axios.get(`${baseUrl}/api/v0/docker-images`, {
      params: {
        api_key: apiKey
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      validateStatus: (status) => true // Don't throw on any status code
    });
    
    console.log(`Status Code: ${response.status}`);
    console.log(`Content Type: ${response.headers['content-type']}`);
    
    // If we got redirected
    if (response.request.res.responseUrl !== `${baseUrl}/api/v0/docker-images`) {
      console.log(`⚠️ Redirected to: ${response.request.res.responseUrl}`);
    }
    
    // Check response type
    if (response.headers['content-type']?.includes('application/json')) {
      console.log(`✅ Received JSON response (length: ${JSON.stringify(response.data).length} chars)`);
      console.log('First 500 chars of response:');
      console.log(JSON.stringify(response.data).substring(0, 500) + '...');
    } else {
      console.log(`❌ Received non-JSON response (${typeof response.data})`);
      
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.log('Response appears to be HTML (possibly a login page)');
      }
    }
  } catch (error: any) {
    console.error(`Error in Test 2: ${error.message || 'Unknown error'}`);
  }
  
  // Test 3: Using key as a query parameter (alternative name)
  try {
    console.log('\n🧪 Test 3: Using key query parameter');
    console.log('-'.repeat(50));
    
    const response = await axios.get(`${baseUrl}/api/v0/docker-images`, {
      params: {
        key: apiKey
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      validateStatus: (status) => true // Don't throw on any status code
    });
    
    console.log(`Status Code: ${response.status}`);
    console.log(`Content Type: ${response.headers['content-type']}`);
    
    // Check response type
    if (response.headers['content-type']?.includes('application/json')) {
      console.log(`✅ Received JSON response (length: ${JSON.stringify(response.data).length} chars)`);
      console.log('First 500 chars of response:');
      console.log(JSON.stringify(response.data).substring(0, 500) + '...');
    } else {
      console.log(`❌ Received non-JSON response (${typeof response.data})`);
      
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.log('Response appears to be HTML (possibly a login page)');
      }
    }
  } catch (error: any) {
    console.error(`Error in Test 3: ${error.message || 'Unknown error'}`);
  }
}

testEndpoint().catch(console.error);