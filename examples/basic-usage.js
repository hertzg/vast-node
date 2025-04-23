/**
 * Basic usage example for the Vast.ai Node.js SDK
 * 
 * This example demonstrates how to:
 * 1. Search for available machines
 * 2. Create an instance
 * 3. Start/stop/delete an instance
 * 4. List your current instances
 */

const { VastClient } = require('../dist');

// Replace with your API key
const API_KEY = 'your-api-key-here';

// Initialize the client
const client = new VastClient(API_KEY);

// Add debug logging
const addLogs = (label) => {
  return (data) => {
    console.log(`${label}:`, JSON.stringify(data, null, 2));
    return data;
  };
};

// Search for available machines (offers)
async function searchMachines() {
  console.log('Searching for machines...');
  try {
    const offers = await client.searchOffers({
      num_gpus: 1,           // Number of GPUs required
      cuda_max_good: 11.7,   // CUDA version
      order: 'score-',       // Sort by score (descending)
      disk_space: 20         // Minimum disk space (GB)
    })
    .then(addLogs('Available machines'));
    
    if (offers && offers.length > 0) {
      console.log(`Found ${offers.length} machines!`);
      // Return the first machine ID
      return offers[0].id;
    } else {
      console.log('No machines found that match criteria');
      return null;
    }
  } catch (error) {
    console.error('Error searching for machines:', error.message);
    return null;
  }
}

// Create an instance on a machine
async function createInstance(machineId) {
  console.log(`Creating instance on machine ${machineId}...`);
  try {
    const instance = await client.createInstance({
      image: 'pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime',
      machineId: machineId,
      diskSpace: 20,
      env: {
        // Environment variables
        JUPYTER_PASSWORD: 'vastai'
      },
      jupyterLab: true  // Enable JupyterLab
    })
    .then(addLogs('Created instance'));
    
    console.log(`Instance created with ID: ${instance.id}`);
    return instance.id;
  } catch (error) {
    console.error('Error creating instance:', error.message);
    return null;
  }
}

// List all current instances
async function listInstances() {
  console.log('Listing your instances...');
  try {
    const instances = await client.listInstances()
      .then(addLogs('Current instances'));
    
    console.log(`You have ${instances.length} instances`);
    return instances;
  } catch (error) {
    console.error('Error listing instances:', error.message);
    return [];
  }
}

// Manage an instance (start/stop/delete)
async function manageInstance(instanceId) {
  // Start the instance
  console.log(`Starting instance ${instanceId}...`);
  try {
    await client.startInstance(instanceId)
      .then(addLogs('Start response'));
    console.log('Instance started successfully');
    
    // Wait 10 seconds
    console.log('Waiting 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Stop the instance
    console.log(`Stopping instance ${instanceId}...`);
    await client.stopInstance(instanceId)
      .then(addLogs('Stop response'));
    console.log('Instance stopped successfully');
    
    // Delete the instance
    console.log(`Deleting instance ${instanceId}...`);
    await client.deleteInstance(instanceId)
      .then(addLogs('Delete response'));
    console.log('Instance deleted successfully');
    
  } catch (error) {
    console.error('Error managing instance:', error.message);
  }
}

// Main function to run the example
async function runExample() {
  try {
    // First list current instances
    await listInstances();
    
    // Search for machines
    const machineId = await searchMachines();
    if (!machineId) {
      console.log('Exiting as no suitable machine was found');
      return;
    }
    
    // Create an instance
    const instanceId = await createInstance(machineId);
    if (!instanceId) {
      console.log('Exiting as instance creation failed');
      return;
    }
    
    // Manage the instance (start/stop/delete)
    await manageInstance(instanceId);
    
    // List instances again to see the changes
    await listInstances();
    
  } catch (error) {
    console.error('Error running example:', error);
  }
}

// Uncomment to run the example
// runExample();

// Export the functions for individual use
module.exports = {
  searchMachines,
  createInstance,
  listInstances,
  manageInstance,
  runExample
};