# Getting Started with Vast.ai Node.js SDK

This guide will help you quickly get up and running with the Vast.ai Node.js SDK to rent and manage GPU instances for your machine learning and AI workloads.

## Prerequisites

- Node.js v14 or higher
- A Vast.ai account with API key
- Basic familiarity with TypeScript/JavaScript

## Installation

Install the SDK using npm:

```bash
npm install @sschepis/vast-node
```

Or using yarn:

```bash
yarn add @sschepis/vast-node
```

## Authentication

The first step is to initialize the client with your Vast.ai API key:

```typescript
import { VastClient } from '@sschepis/vast-node';

// Initialize with your API key
const client = new VastClient('your-api-key');
```

### Getting your API Key

1. Log in to your [Vast.ai account](https://console.vast.ai/)
2. Navigate to your user settings
3. Copy your API key from the API section

You can also set the API key later:

```typescript
const client = new VastClient();
client.setApiKey('your-api-key');
```

## Basic Operations

### Searching for Available GPUs

The most common use case is finding available GPU instances based on your requirements:

```typescript
async function findGPUs() {
  // Search for machines with at least 1 GPU and CUDA 11.7
  const offers = await client.searchOffers({
    num_gpus: 1,              // Number of GPUs
    cuda_max_good: 11.7,      // CUDA version
    order: 'dph_total+'       // Sort by price (cheapest first)
  });
  
  console.log(`Found ${offers.length} machines matching your criteria`);
  
  // Display the top 3 cheapest offers
  offers.slice(0, 3).forEach((offer, index) => {
    console.log(`\n[${index + 1}] Machine ID: ${offer.id}`);
    console.log(`  GPU: ${offer.num_gpus}x ${offer.gpu_name}`);
    console.log(`  Price: $${offer.dph_total.toFixed(4)}/hour`);
    console.log(`  RAM: ${offer.gpu_ram}GB GPU, ${offer.cpu_ram}GB CPU`);
    console.log(`  Storage: ${offer.disk_space}GB`);
    console.log(`  Location: ${offer.datacenter?.geolocation || 'Unknown'}`);
  });
}
```

### Creating an Instance

Once you've found a suitable machine, you can create an instance:

```typescript
async function createInstance(machineId) {
  const instance = await client.createInstance({
    image: 'pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime',
    machineId: machineId,
    diskSpace: 20,            // GB of disk space
    jupyterLab: true,         // Enable JupyterLab
    env: {
      JUPYTER_PASSWORD: 'mypassword'  // Set Jupyter password
    }
  });
  
  console.log(`Created instance ID: ${instance.id}`);
  
  if (instance.jupyter_url) {
    console.log(`Jupyter URL: ${instance.jupyter_url}`);
  }
  
  return instance;
}
```

### Managing Your Instances

List all your running instances:

```typescript
async function listMyInstances() {
  const instances = await client.listInstances();
  
  console.log(`You have ${instances.length} instances`);
  
  instances.forEach((instance, index) => {
    console.log(`\n[${index + 1}] Instance ID: ${instance.id}`);
    console.log(`  Status: ${instance.actual_status}`);
    console.log(`  Machine: ${instance.machine?.hostname || 'Unknown'}`);
    console.log(`  GPU: ${instance.num_gpus || 1}x ${instance.gpu_name || 'Unknown'}`);
    console.log(`  Cost: $${instance.cost_per_hour?.toFixed(4) || 'Unknown'}/hour`);
    
    if (instance.ssh_host && instance.ssh_port) {
      console.log(`  SSH: ssh -p ${instance.ssh_port} root@${instance.ssh_host}`);
    }
    
    if (instance.jupyter_url) {
      console.log(`  Jupyter: ${instance.jupyter_url}`);
    }
  });
}
```

Start, stop, or delete an instance:

```typescript
// Start an instance
await client.startInstance(12345);

// Stop an instance (pause billing)
await client.stopInstance(12345);

// Delete an instance (terminates and removes it)
await client.deleteInstance(12345);
```

### Getting Account Information

Check your account balance:

```typescript
async function checkAccount() {
  const user = await client.getUserInfo();
  
  console.log(`Username: ${user.username}`);
  console.log(`Email: ${user.email}`);
  console.log(`Account Balance: $${user.balance.toFixed(2)}`);
}
```

## Common Use Cases

### Machine Learning Training Workflow

Here's a complete example of setting up and running a machine learning training job:

```typescript
import { VastClient } from '@sschepis/vast-node';

async function runTrainingJob() {
  // Initialize client
  const client = new VastClient('your-api-key');
  
  try {
    // 1. Find a suitable machine
    const offers = await client.searchOffers({
      num_gpus: 1,
      cuda_max_good: 11.7,
      order: 'dph_total+'
    });
    
    if (offers.length === 0) {
      console.log('No suitable machines found');
      return;
    }
    
    const selectedMachine = offers[0];
    console.log(`Selected machine: ${selectedMachine.id} (${selectedMachine.gpu_name})`);
    
    // 2. Create an instance on the machine
    const instance = await client.createInstance({
      image: 'pytorch/pytorch:latest',
      machineId: selectedMachine.id,
      diskSpace: 30,
      runCommand: 'cd /workspace && python train.py',
      env: {
        WANDB_API_KEY: 'your-wandb-key'  // For logging to Weights & Biases
      }
    });
    
    console.log(`Created instance: ${instance.id}`);
    
    // 3. Start the instance
    await client.startInstance(instance.id);
    console.log('Instance started');
    
    // 4. You can periodically check instance status
    // This would typically be done in a separate script or process
    const runningInstance = await client.getInstance(instance.id);
    console.log(`Status: ${runningInstance.actual_status}`);
    
    // 5. When finished, delete the instance (in a real app, this would be done later)
    // await client.deleteInstance(instance.id);
    // console.log('Training complete and instance deleted');
  } catch (error) {
    console.error('Error:', error);
  }
}

runTrainingJob().catch(console.error);
```

## Error Handling

The SDK provides detailed error information to help diagnose issues:

```typescript
try {
  const offers = await client.searchOffers({
    num_gpus: 2
  });
} catch (error) {
  if (error.response) {
    // The request was made and the server responded with an error status code
    console.error(`API Error (${error.response.status}):`, error.response.data);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Network Error - No response received');
  } else {
    // Something happened in setting up the request
    console.error('Request Error:', error.message);
  }
}
```

## Troubleshooting Common Issues

### Authentication Errors

If you see 401 Unauthorized errors:
- Verify your API key is correct
- Check that you've set the API key correctly using `setApiKey()`

### Connection Timeouts

If requests are timing out:
- Check your internet connection
- The Vast.ai API might be experiencing high load
- Try increasing the timeout: `new VastClient(apiKey, 'https://console.vast.ai', 60000)`

### Instance Creation Failures

If you're unable to create instances:
- Verify you have sufficient funds in your Vast.ai account
- Ensure you're providing a valid machine ID
- Check that the image you're requesting exists
- Make sure the disk space requested is reasonable

## Next Steps

- See the [full API reference](API.md) for detailed documentation of all methods
- Check out the [examples directory](../examples) for more code samples
- Visit the [Vast.ai documentation](https://vast.ai/docs/) for general platform information