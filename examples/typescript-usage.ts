/**
 * TypeScript usage example for the Vast.ai Node.js SDK
 * 
 * This example demonstrates typed usage of the SDK including:
 * 1. Searching for available machines with filters
 * 2. Working with typed responses and parameters
 * 3. Error handling with TypeScript
 */

import { VastClient } from '../src';

// Interface definitions for API responses
interface Machine {
  id: number;
  gpu_name: string;
  num_gpus: number;
  cpu_cores: number;
  cpu_ram: number;
  disk_space: number;
  dph_total: number;
  reliability: number;
  inet_up: number;
  inet_down: number;
  static_ip: boolean;
  geolocation: string;
}

interface Instance {
  id: number;
  machine_id: number;
  actual_status: string;
  image: string;
  ssh_host: string;
  ssh_port: number;
  jupyter_url?: string;
  gpu_name: string;
  num_gpus: number;
  gpu_util: number;
  disk_util: number;
  cpu_util: number;
  start_date: string;
  cost_per_hour: number;
  driver_version: string;
  cuda_version: string;
}

// Example search parameters
interface SearchParams {
  num_gpus?: number;
  cuda_max_good?: number;
  disk_space?: number;
  order?: string;
  external?: boolean;
  q?: string;
}

// Initialize with your API key
const API_KEY = 'your-api-key-here';
const client = new VastClient(API_KEY);

// Helper to add logging
const addLogs = <T>(label: string) => {
  return (data: T): T => {
    console.log(`${label}:`, JSON.stringify(data, null, 2));
    return data;
  };
};

// Search for machines with typed parameters and response
async function searchMachines(params: SearchParams): Promise<Machine[]> {
  console.log('Searching for machines with params:', params);
  try {
    const offers = await client.searchOffers(params)
      .then(addLogs<Machine[]>('Available machines'));
    
    console.log(`Found ${offers.length} machines matching criteria`);
    return offers;
  } catch (error) {
    console.error('Error searching for machines:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

// Get and display user information
async function getUserInfo() {
  try {
    const userInfo = await client.getUserInfo()
      .then(addLogs('User information'));
    
    console.log(`Hello, ${userInfo.username || 'User'}!`);
    console.log(`Current balance: $${userInfo.balance || 0}`);
    
    return userInfo;
  } catch (error) {
    console.error('Error getting user info:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// List instances with typed response
async function listInstances(): Promise<Instance[]> {
  try {
    const instances = await client.listInstances()
      .then(addLogs<Instance[]>('Current instances'));
    
    console.log(`You have ${instances.length} active instances`);
    
    // Display instance details in a more readable format
    instances.forEach(instance => {
      console.log(`
Instance ID: ${instance.id}
Status: ${instance.actual_status}
GPU: ${instance.num_gpus}x ${instance.gpu_name}
Image: ${instance.image}
Cost: $${instance.cost_per_hour}/hour
Started: ${new Date(instance.start_date).toLocaleString()}
${instance.jupyter_url ? `Jupyter: ${instance.jupyter_url}` : ''}
-------------------------------`);
    });
    
    return instances;
  } catch (error) {
    console.error('Error listing instances:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

// Main async function to run the example
async function runExample() {
  try {
    // Get user information
    await getUserInfo();
    
    // Search for machines with specific requirements
    const machines = await searchMachines({
      num_gpus: 1,
      cuda_max_good: 11.7,
      disk_space: 20,
      order: 'dph_total+' // Sort by price (cheapest first)
    });
    
    if (machines.length === 0) {
      console.log('No suitable machines found');
      return;
    }
    
    // Show the top 3 cheapest machines
    console.log('\nTop 3 cheapest machines:');
    machines.slice(0, 3).forEach((machine, index) => {
      console.log(`
#${index + 1}: Machine ID ${machine.id}
GPU: ${machine.num_gpus}x ${machine.gpu_name}
CPU: ${machine.cpu_cores} cores, ${machine.cpu_ram}GB RAM
Storage: ${machine.disk_space}GB
Cost: $${machine.dph_total}/hour
Location: ${machine.geolocation || 'Unknown'}
Reliability: ${(machine.reliability * 100).toFixed(1)}%
-------------------------------`);
    });
    
    // List current instances
    await listInstances();
    
  } catch (error) {
    console.error('Error running example:', error instanceof Error ? error.message : String(error));
  }
}

// Uncomment to run the example
// runExample().catch(console.error);

// Export functions for individual use
export {
  searchMachines,
  getUserInfo,
  listInstances,
  runExample
};