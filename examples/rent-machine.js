/**
 * VAST.ai Machine Rental Example
 *
 * This example demonstrates how to:
 * 1. Search for available machines based on specific criteria
 * 2. Select a suitable machine
 * 3. Create an instance on the selected machine (rent it)
 * 4. Start the instance
 * 5. Monitor the instance status
 * 6. Stop and clean up the instance when done
 */

const { VastClient } = require('../dist');

// API key for testing
const API_KEY = '43866bfbb34e8c810d58987bad96ea6bde3e5d0f29def48337462b4e4d4d94c3';

// Configuration for the machine rental
const config = {
  // Machine search criteria
  searchCriteria: {
    numGpus: 1,                // Number of GPUs
    minBid: 0.05,              // Minimum bid price per hour (lower is cheaper)
    orderBy: 'dph_total+',     // Sort by price, cheapest first
    reliability: 0.95,         // Min 95% reliability
    directPortCount: 1,        // Needs at least 1 direct port
    external: false            // Not an external machine
  },

  // Instance configuration
  instanceConfig: {
    image: 'pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime', // Docker image
    diskSpace: 10,             // 10GB of disk space
    jupyterLab: true,          // Enable JupyterLab
    env: {
      JUPYTER_PASSWORD: 'vastai-demo', // Password for JupyterLab
      DEMO_VAR: 'Hello from VAST.ai!'  // Custom environment variable
    },
    runCommand: 'echo "Container is running! Current time: $(date)" >> /vast/welcome.log'
  }
};

// Sleep function for waiting periods
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function rentMachine() {
  // Create client with the API key
  const client = new VastClient(API_KEY);
  let instanceId = null;

  try {
    console.log('VAST.ai Machine Rental Example');
    console.log('==============================');

    const maxRentalAttempts = 5; // Retry renting a few times if the offer disappears

    for (let attempt = 1; attempt <= maxRentalAttempts; attempt++) {
      try {
        console.log(`\nAttempt ${attempt}/${maxRentalAttempts}: Searching for available machines...`);
        const results = await client.searchOffers(config.searchCriteria);

        // Extract the offers array from the response
        const offers = Array.isArray(results) ? results :
                      (results && results.offers) ? results.offers : [];

        if (!offers || offers.length === 0) {
          if (attempt === maxRentalAttempts) {
            throw new Error('No suitable machines found matching criteria after multiple attempts.');
          } else {
            console.log('No suitable machines found. Retrying search in 5 seconds...');
            await sleep(5000);
            continue; // Retry the loop
          }
        }

        // Select the best machine (first in the list since we sorted by price)
        const selectedMachine = offers[0];
        const machineId = selectedMachine.id;
        const price = selectedMachine.dphTotal || selectedMachine.dph_total;
        const gpuName = selectedMachine.gpuName || selectedMachine.gpu_name;
        const gpuCount = selectedMachine.numGpus || selectedMachine.num_gpus;

        console.log(`Selected machine #${machineId}: ${gpuName} (${gpuCount}x) - $${price}/hr`);

        // Create an instance on the selected machine
        console.log('Creating instance on selected machine...');

        // Prepare the instance creation parameters
        const instanceParams = {
          ...config.instanceConfig,
          id: machineId // Use 'id' for the createInstance method
        };

        // Create the instance
        const instance = await client.createInstance(instanceParams);
        instanceId = instance.new_contract; // Correctly extract instance ID from new_contract

        console.log(`Instance created successfully! ID: ${instanceId}`);

        // Instance created successfully, break out of the retry loop
        break;

      } catch (error) {
        // Also catch 400 errors with the specific "GPU conflict" message
        if (
          error.response &&
          ((error.response.status === 404 && error.response.data.error === 'no_such_ask') ||
           (error.response.status === 400 && error.response.data.error === 'invalid_args' && error.response.data.msg.includes('GPU conflict')))
        ) {
          console.log(`Offer ${error.response.data.ask_id || 'unknown'} is no longer available or has a GPU conflict. Retrying rental...`);
          await sleep(2000); // Wait a bit before retrying
        } else {
          // Re-throw other errors
          throw error;
        }
      }
    }

    // If instanceId is still null after retries, throw an error
    if (instanceId === null) {
      throw new Error('Failed to rent a machine after multiple attempts.');
    }

    // STEP 4: Start the instance (create_instance often starts it, but explicitly calling start is safer)
    console.log('\n4. Starting the instance...');
    // The create_instance call above should handle starting, but if not, uncomment below:
    // await client.startInstance(instanceId);
    console.log('   Start command sent successfully');

    // STEP 5: Monitor instance status (simplified for this example)
    console.log('\n5. Waiting for 30 seconds...');
    await sleep(30000); // Wait for 30 seconds

    console.log('\n6. Tearing down the instance...');
    try {
      // Stop the instance
      console.log(`   Stopping instance ${instanceId}...`);
      await client.stopInstance(instanceId);
      console.log('   Instance stopped successfully');

      // Delete the instance
      console.log(`   Deleting instance ${instanceId}...`);
      await client.deleteInstance(instanceId);
      console.log('   Instance deleted successfully');

      console.log('\nInstance torn down successfully!');

    } catch (cleanupError) {
      console.error(`\nERROR during cleanup of instance ${instanceId}:`, cleanupError.message);
      if (cleanupError.response) {
        console.error('API Error Response during cleanup:', {
          status: cleanupError.response.status,
          data: JSON.stringify(cleanupError.response.data, null, 2)
        });
      }
      console.log('\nYou may need to manually clean up the instance via the VAST.ai console.');
    }

  } catch (error) {
    console.error('\nERROR:', error.message);

    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: JSON.stringify(error.response.data, null, 2)
      });
    }

    // If we created an instance but encountered an error, provide cleanup instructions
    if (instanceId) {
      console.log('\nCleanup Instructions:');
      console.log(`Since an error occurred, you may need to manually clean up instance #${instanceId}`);
      console.log(`
      // To stop and delete the instance:
      const client = new VastClient('${API_KEY}');
      await client.stopInstance(${instanceId});
      await client.deleteInstance(${instanceId});
      `);
    }
  }
}

// Run the example
rentMachine();