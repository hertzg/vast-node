/**
 * Debug utility for Vast.ai Node.js SDK
 * 
 * This file provides detailed diagnostic information to debug SDK issues.
 * It tests each major API endpoint and logs detailed information about
 * requests, responses, and any errors encountered.
 * 
 * Run with:
 * VAST_API_KEY=your-key-here npx ts-node examples/debug-sdk.ts
 */

import { VastClient } from '../src';

// Get API key from environment or set directly
const apiKey = process.env.VAST_API_KEY || 'YOUR_API_KEY_HERE';

// Initialize the client with debug mode enabled
const client = new VastClient(apiKey);

/**
 * Utility function to run a test with timing and error handling
 */
async function runTest(name: string, fn: () => Promise<any>) {
  console.log(`\n[TEST] ${name}`);
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${name} succeeded in ${duration}ms`);
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${name} failed after ${duration}ms`);
    
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Response Data:`, error.response.data);
      console.error(`  Headers:`, error.response.headers);
    } else if (error.request) {
      console.error(`  Network Error - No response received`);
      console.error(`  Request:`, error.request);
    } else {
      console.error(`  Error Message: ${error.message}`);
    }
    
    if (error.config) {
      console.error(`  Request URL: ${error.config.baseURL}${error.config.url}`);
      console.error(`  Method: ${error.config.method?.toUpperCase()}`);
      console.error(`  Headers:`, error.config.headers);
      
      if (error.config.data) {
        try {
          console.error(`  Request Data:`, JSON.parse(error.config.data));
        } catch {
          console.error(`  Request Data:`, error.config.data);
        }
      }
    }
    
    return null;
  }
}

/**
 * Debug test for searchOffers
 */
async function testSearchOffers() {
  return await runTest('Search Offers', async () => {
    const params = {
      num_gpus: 1,
      cuda_max_good: 11.7,
      order: 'dph_total+'
    };
    
    console.log('Request Parameters:', params);
    const result = await client.searchOffers(params);
    
    console.log(`Found ${result.length} offers`);
    if (result.length > 0) {
      // Log first result for structure analysis
      console.log('Example Response Structure:');
      console.log(JSON.stringify(result[0], null, 2).slice(0, 500) + '...');
    }
    
    return result;
  });
}

/**
 * Debug test for listInstances
 */
async function testListInstances() {
  return await runTest('List Instances', async () => {
    const result = await client.listInstances();
    
    console.log(`Found ${result.length} instances`);
    if (result.length > 0) {
      // Log first result for structure analysis
      console.log('Example Response Structure:');
      console.log(JSON.stringify(result[0], null, 2).slice(0, 500) + '...');
    }
    
    return result;
  });
}

/**
 * Debug test for listImages
 */
async function testListImages() {
  return await runTest('List Images', async () => {
    const result = await client.listImages();
    
    console.log(`Found ${result.length} images`);
    if (result.length > 0) {
      // Log first result for structure analysis
      console.log('Example Response Structure:');
      console.log(JSON.stringify(result[0], null, 2).slice(0, 500) + '...');
    }
    
    return result;
  });
}

/**
 * Debug test for getUserInfo
 */
async function testGetUserInfo() {
  return await runTest('Get User Info', async () => {
    const result = await client.getUserInfo();
    
    console.log('User Info:');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  });
}

/**
 * Main function to run all tests
 */
async function main() {
  console.log('🔍 Vast.ai Node.js SDK Diagnostics');
  console.log('='.repeat(50));
  
  // Check for API key
  if (apiKey === 'YOUR_API_KEY_HERE' && !process.env.VAST_API_KEY) {
    console.error('\n⚠️  Please set your Vast.ai API key before running diagnostics.');
    console.error('   You can do this by setting the VAST_API_KEY environment variable.');
    return;
  }
  
  console.log(`API Key: ${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
  console.log(`Date/Time: ${new Date().toISOString()}`);
  console.log('='.repeat(50));
  
  // Run all tests
  await testGetUserInfo();
  await testSearchOffers();
  await testListInstances();
  await testListImages();
  
  console.log('\n🏁 Diagnostics complete');
}

// Run the diagnostics
main().catch(err => {
  console.error('Unhandled error in diagnostics:', err);
  process.exit(1);
});