/**
 * Basic usage example for the Vast.ai Node.js SDK
 *
 * This script demonstrates the basic functionality of the Vast.ai Node.js SDK,
 * including searching for offers, listing instances, and retrieving user information.
 *
 * Usage:
 * VAST_API_KEY=your-key-here npx ts-node examples/basic-usage.ts
 */

import { VastClient } from '../src';

// Get API key from environment variable
const apiKey = process.env.VAST_API_KEY;

if (!apiKey) {
  console.error('Please set the VAST_API_KEY environment variable');
  process.exit(1);
}

// Initialize the client
const client = new VastClient(apiKey);

async function main() {
  try {
    // Get user info
    console.log('Fetching user information...');
    const user = await client.getUserInfo();
    console.log(`Logged in as: ${user.username}`);
    console.log(`Account balance: $${user.balance}`);
    console.log('-----------------------------------');

    // Search for GPU offers
    console.log('\nSearching for GPU offers...');
    const offerParams = {
      num_gpus: 1,
      cuda_max_good: 11.7,
      order: 'dph_total+', // cheapest first
      limit: 5
    };
    
    const offers = await client.searchOffers(offerParams);
    
    console.log(`Found ${offers.length} offers matching criteria`);
    
    // Display the cheapest 3 offers
    offers.slice(0, 3).forEach((offer, index) => {
      console.log(`\n[${index+1}] Machine ID: ${offer.id}`);
      console.log(`  GPU: ${offer.num_gpus}x ${offer.gpu_name}`);
      console.log(`  Price: $${offer.dph_total.toFixed(4)}/hour`);
      console.log(`  RAM: ${offer.gpu_ram || '?'}GB GPU, ${offer.cpu_ram || '?'}GB CPU`);
      console.log(`  Location: ${offer.datacenter?.geolocation || 'Unknown'}`);
    });
    console.log('-----------------------------------');
    
    // List instances
    console.log('\nListing instances...');
    const instances = await client.listInstances();
    console.log(`You have ${instances.length} instances`);
    
    // Display instance details
    instances.forEach((instance, index) => {
      console.log(`\n[${index+1}] Instance ID: ${instance.id}`);
      console.log(`  Status: ${instance.actual_status || 'Unknown'}`);
      console.log(`  Machine: ${instance.machine?.hostname || 'Unknown'}`);
      console.log(`  GPU: ${instance.num_gpus || '?'}x ${instance.gpu_name || 'Unknown'}`);
      console.log(`  Cost: $${instance.cost_per_hour?.toFixed(4) || '?'}/hour`);
      
      if (instance.ssh_host && instance.ssh_port) {
        console.log(`  SSH: ssh -p ${instance.ssh_port} root@${instance.ssh_host}`);
      }
    });
    console.log('-----------------------------------');
    
    // List available docker images
    console.log('\nListing available Docker images...');
    const images = await client.listImages();
    console.log(`Found ${images.length} docker images`);
    
    // Display a few images
    images.slice(0, 3).forEach((image, index) => {
      console.log(`\n[${index+1}] ${image.name}`);
      console.log(`  ID: ${image.id}`);
      console.log(`  Description: ${image.description || 'No description'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    }
  }
}

main().catch(console.error);