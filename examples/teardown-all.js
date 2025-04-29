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
    const instances = await client.listInstances({ owner: 'me' });

    // Check if we have any instances
    if (!instances || instances.length === 0) {
      console.log('No instances found for the current user.');
      return;
    }

    console.log(`Found ${instances.length} instances.`);

    // Filter for running instances using a more robust comparison
    const runningInstances = instances.filter(instance => 
      instance.actual_status && typeof instance.actual_status === 'string' && 
      instance.actual_status.trim().toLowerCase() === 'running'
    );

    if (runningInstances.length === 0) {
      console.log('No running instances found.');
      return;
    }

    console.log(`Found ${runningInstances.length} running instances.`);

    // STEP 2: Tear down each running instance
    console.log('\n2. Tearing down running instances...');

    for (const instance of runningInstances) {
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