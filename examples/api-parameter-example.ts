/**
 * VAST.ai API parameter transformation example
 *
 * This example demonstrates how the SDK automatically transforms camelCase parameters
 * to snake_case as required by the VAST.ai API.
 */

import { VastClient } from '../src';
import { CreateInstanceParams } from '../src/types';

// Replace with your API key
const API_KEY = 'your_api_key';

async function demonstrateApi() {
  try {
    // Create a client instance
    const client = new VastClient(API_KEY);

    console.log('VAST.ai API Parameter Transformation');
    console.log('===================================');

    // Example 1: Search offers (available machines)
    console.log('\nExample 1: Searching for available machines');
    console.log('Parameters in camelCase (as written in TypeScript):');
    console.log(JSON.stringify({
      numGpus: 1,
      minBid: 0.5,
      orderBy: 'score-'
    }, null, 2));

    // Note: We write camelCase in our code, but the SDK transforms to snake_case before sending
    const offers = await client.searchOffers({
      numGpus: 1,
      minBid: 0.5,
      orderBy: 'score-'
    });
    console.log(`Found ${Array.isArray(offers) ? offers.length : 0} available machines`);

    // Example 2: Instance creation (not executed, just for demonstration)
    console.log('\nExample 2: Instance creation parameters');
    console.log('Parameters in camelCase (as written in TypeScript):');
    const instanceParams: CreateInstanceParams = {
      machineId: 12345,
      image: 'pytorch/pytorch:latest',
      diskSpace: 10,
      jupyterLab: true,
      env: {
        JUPYTER_PASSWORD: 'vastai'
      }
    };
    console.log(JSON.stringify(instanceParams, null, 2));
    console.log('\nThese parameters are automatically transformed to snake_case:');
    console.log(JSON.stringify({
      machine_id: 12345,
      image: 'pytorch/pytorch:latest',
      disk_space: 10,
      jupyter_lab: true,
      env: {
        JUPYTER_PASSWORD: 'vastai'
      }
    }, null, 2));

    console.log('\nThis transformation happens automatically in the SDK.');
    console.log('You can use familiar camelCase in your JavaScript/TypeScript code,');
    console.log('while the API receives the snake_case format it requires.');

  } catch (error) {
    console.error('API Error:', error);
  }
}

// Run the demonstration
demonstrateApi();