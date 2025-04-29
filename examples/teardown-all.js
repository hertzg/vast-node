/**
 * VAST.ai Teardown All Running Instances Example
 *
 * This example demonstrates how to:
 * 1. List all running instances for the current user
 * 2. Tear down (delete) each running instance
 */

const { VastClient } = require('../dist');

// API key for testing
const API_KEY = '43866bfbb34e8c810d58987bad96ea6bde3e5d0f29def48337462b4e4d4d94c3';

async function teardownAllInstances() {
  // Create client with the API key
  const client = new VastClient(API_KEY);

  try {
    console.log('VAST.ai Teardown All Running Instances Example');
    console.log('==============================================');

    // STEP 1: List all instances for the current user
    console.log('\n1. Listing all instances...');
    // Get instances and handle both possible return formats
    const result = await client.listInstances({ owner: 'me' });
    
    // Extract instances array from the response, handling different possible formats
    let instances = [];
    if (result) {
      if (Array.isArray(result)) {
        instances = result;
      } else if (result.instances && Array.isArray(result.instances)) {
        instances = result.instances;
      }
    }

    console.log(`Raw instances data:`, JSON.stringify(instances, null, 2));
    
    // Check if we have any instances
    if (!instances || instances.length === 0) {
      console.log('No instances found for the current user.');
      return;
    }

    console.log(`Found ${instances.length} instances - proceeding to tear them all down.`);
    
    // Process ALL instances regardless of status
    const instancesToTerminate = instances;

    // STEP 2: Tear down each running instance
    console.log('\n2. Tearing down ALL instances...');

    for (const instance of instancesToTerminate) {
      const instanceId = instance.id;
      console.log(`  - Tearing down instance ${instanceId}...`);
      try {
        await client.deleteInstance(instanceId);
        console.log(`    Instance ${instanceId} torn down successfully.`);
      } catch (error) {
        console.error(`    ERROR tearing down instance ${instanceId}:`, error.message);
        if (error.response) {
          console.error('    API Error Response:', {
            status: error.response.status,
            data: JSON.stringify(error.response.data, null, 2)
          });
        }
      }
    }

    console.log('\nTeardown process completed.');

  } catch (error) {
    console.error('\nERROR:', error.message);

    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: JSON.stringify(error.response.data, null, 2)
      });
    }
  }
}

// Run the example
teardownAllInstances();