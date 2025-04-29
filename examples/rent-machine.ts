/**
 * VAST.ai Machine Rental Example (TypeScript)
 * 
 * This example demonstrates how to:
 * 1. Search for available machines based on specific criteria
 * 2. Select a suitable machine
 * 3. Create an instance on the selected machine (rent it)
 * 4. Start the instance
 * 5. Monitor the instance status
 * 6. Stop and clean up the instance when done
 */

import { VastClient } from '../src';
import { 
  SearchOffersParams, 
  CreateInstanceParams, 
  MachineOffer, 
  Instance 
} from '../src/types';

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
  } as SearchOffersParams,
  
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
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

async function rentMachine(): Promise<void> {
  // Create client with the API key
  const client = new VastClient(API_KEY);
  let instanceId: number | null = null;
  
  try {
    console.log('VAST.ai Machine Rental Example (TypeScript)');
    console.log('==========================================');
    
    // STEP 1: Search for available machines matching our criteria
    console.log('\n1. Searching for available machines...');
    const results = await client.searchOffers(config.searchCriteria);
    
    // Extract the offers array from the response
    const offers = Array.isArray(results) ? results : 
                  (results && 'offers' in results) ? (results as any).offers : [];
    
    if (!offers || offers.length === 0) {
      throw new Error('No suitable machines found matching criteria');
    }
    
    console.log(`Found ${offers.length} machines matching criteria`);
    
    // STEP 2: Select the best machine (first in the list since we sorted by price)
    const selectedMachine = offers[0] as MachineOffer;
    const machineId = selectedMachine.id;
    
    // Handle both camelCase and snake_case properties
    const price = 'dphTotal' in selectedMachine ? selectedMachine.dphTotal : 
                 ('dph_total' in selectedMachine ? (selectedMachine as any).dph_total : 'unknown');
                 
    const gpuName = 'gpuName' in selectedMachine ? selectedMachine.gpuName : 
                   ('gpu_name' in selectedMachine ? (selectedMachine as any).gpu_name : 'Unknown GPU');
                   
    const gpuCount = 'numGpus' in selectedMachine ? selectedMachine.numGpus : 
                    ('num_gpus' in selectedMachine ? (selectedMachine as any).num_gpus : 1);
    
    console.log(`\n2. Selected machine #${machineId}:`);
    console.log(`   - GPU: ${gpuName} (${gpuCount}x)`);
    console.log(`   - Price: $${price}/hr`);
    
    // STEP 3: Create an instance on the selected machine
    console.log('\n3. Creating instance on selected machine...');
    
    // Prepare the instance creation parameters
    const instanceParams: CreateInstanceParams = {
      ...config.instanceConfig,
      machineId: machineId
    };
    
    // Create the instance
    const instance = await client.createInstance(instanceParams);
    instanceId = instance.id;
    
    console.log(`   Instance created successfully! ID: ${instanceId}`);
    
    // STEP 4: Start the instance
    console.log('\n4. Starting the instance...');
    await client.startInstance(instanceId);
    console.log('   Start command sent successfully');
    
    // STEP 5: Monitor instance status
    console.log('\n5. Monitoring instance status...');
    let isRunning = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isRunning && attempts < maxAttempts) {
      attempts++;
      console.log(`   Checking status (attempt ${attempts}/${maxAttempts})...`);
      
      // Get the latest instance information
      const instanceStatus = await client.getInstance(instanceId);
      
      // Handle both camelCase and snake_case properties
      const status = 'actualStatus' in instanceStatus ? instanceStatus.actualStatus : 
                    ('actual_status' in instanceStatus ? (instanceStatus as any).actual_status : 'unknown');
                    
      console.log(`   Current status: ${status}`);
      
      if (status === 'running') {
        isRunning = true;
        
        // Display connection information
        const sshHost = 'sshHost' in instanceStatus ? instanceStatus.sshHost : 
                       ('ssh_host' in instanceStatus ? (instanceStatus as any).ssh_host : 'unknown');
                       
        const sshPort = 'sshPort' in instanceStatus ? instanceStatus.sshPort : 
                       ('ssh_port' in instanceStatus ? (instanceStatus as any).ssh_port : 0);
                       
        const jupyterUrl = 'jupyterUrl' in instanceStatus ? instanceStatus.jupyterUrl : 
                          ('jupyter_url' in instanceStatus ? (instanceStatus as any).jupyter_url : null);
        
        console.log('\n6. Instance is now running!');
        console.log('   Connection Information:');
        console.log(`   - SSH: ssh -p ${sshPort} root@${sshHost}`);
        
        if (jupyterUrl) {
          console.log(`   - JupyterLab: ${jupyterUrl}`);
        }
        
        console.log('\n   Your instance is now ready to use!');
        console.log('   It will continue running and incurring charges until you stop it.');
        console.log('   To stop and delete this instance, uncomment the cleanup code below.');
      } else {
        // Wait 15 seconds before checking again
        console.log('   Instance not ready yet. Waiting 15 seconds...');
        await sleep(15000);
      }
    }
    
    if (!isRunning) {
      console.log('\n   The instance failed to reach running status after multiple attempts.');
      console.log('   You may need to check the VAST.ai console for more information.');
    }
    
    // STEP 6: Cleanup (commented out to prevent accidental deletion)
    // In a real application, you would stop and delete the instance when done
    /*
    console.log('\n7. Cleaning up (stopping and deleting instance)...');
    
    // Stop the instance
    await client.stopInstance(instanceId);
    console.log('   Instance stopped successfully');
    
    // Delete the instance
    await client.deleteInstance(instanceId);
    console.log('   Instance deleted successfully');
    */
    
    // Instead of automatic cleanup, show how to do it manually
    console.log('\n7. Manual Cleanup Instructions:');
    console.log('   When you are finished with this instance, clean it up with:');
    console.log(`   
    // Stop the instance
    await client.stopInstance(${instanceId});
    
    // Delete the instance
    await client.deleteInstance(${instanceId});
    `);
    
  } catch (error: any) {
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