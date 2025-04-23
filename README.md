# Vast.ai Node.js SDK

A Node.js client for the [Vast.ai](https://vast.ai/) API that allows you to programmatically rent and manage GPU instances for machine learning and AI workloads.

## Features

- 🔎 Search for available GPU instances based on various criteria
- 🚀 Create, start, stop, and delete instances
- 📋 List running instances and available images
- 👤 Access user account information
- 🔄 Automatic retries for failed requests
- ⏱️ Rate limiting to prevent API throttling
- 📊 Detailed logging for debugging

## Installation

```bash
npm install @sschepis/vast-node
```

## Quick Start

```typescript
import { VastClient } from '@sschepis/vast-node';

// Initialize with your API key
const client = new VastClient('your-api-key');

// Search for available machines
async function findCheapestGPUs() {
  const offers = await client.searchOffers({
    num_gpus: 1,
    cuda_max_good: 11.7,
    order: 'dph_total+'  // Sort by price (cheapest first)
  });
  
  console.log(`Found ${offers.length} available machines`);
  
  // Print details of the top 3 cheapest offers
  offers.slice(0, 3).forEach((offer, i) => {
    console.log(`\n[${i+1}] Machine ID: ${offer.id}`);
    console.log(`   GPU: ${offer.num_gpus}x ${offer.gpu_name}`);
    console.log(`   Price: $${offer.dph_total.toFixed(4)}/hour`);
    console.log(`   Location: ${offer.datacenter?.geolocation || 'Unknown'}`);
  });
}

// Run the example
findCheapestGPUs().catch(console.error);
```

## Getting your API Key

1. Log in to your [Vast.ai account](https://console.vast.ai/)
2. Navigate to your user settings
3. Copy your API key from the API section

## Basic Usage

### Initializing the Client

```typescript
import { VastClient } from '@sschepis/vast-node';

// Initialize with API key
const client = new VastClient('your-api-key');

// Or initialize without API key and set it later
const client = new VastClient();
client.setApiKey('your-api-key');
```

### Searching for Available Machines

```typescript
// Search with filters
const offers = await client.searchOffers({
  num_gpus: 2,                // Number of GPUs
  cuda_max_good: 11.7,        // CUDA version
  order: 'dph_total+',        // Sort by hourly price (cheapest first)
  disk_space: 30,             // Minimum disk space in GB
  inet_down: 100,             // Minimum download speed in Mbps
  inet_up: 100                // Minimum upload speed in Mbps
});

// Get details of a specific machine
const machineDetails = await client.getOffer(12345);
```

### Managing Instances

```typescript
// List all your instances
const instances = await client.listInstances();

// List only running instances
const runningInstances = await client.listInstances({ q: 'running' });

// Get details of a specific instance
const instanceDetails = await client.getInstance(67890);

// Create a new instance
const newInstance = await client.createInstance({
  image: 'pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime',
  machineId: 12345,
  diskSpace: 20,
  jupyterLab: true,
  env: {
    JUPYTER_PASSWORD: 'vastai'
  }
});

// Start, stop, or delete an instance
await client.startInstance(67890);
await client.stopInstance(67890);
await client.deleteInstance(67890);
```

### Listing Available Images

```typescript
// Get all available Docker images
const images = await client.listImages();
```

### Getting User Information

```typescript
// Get your user account details
const userInfo = await client.getUserInfo();
console.log(`Account Balance: $${userInfo.balance.toFixed(2)}`);
```

## Advanced Usage

For more advanced usage and detailed API documentation, see the [API Reference](docs/API.md) and [Getting Started Guide](docs/GETTING_STARTED.md).

## Development

### Building the Project

```bash
git clone https://github.com/sschepis/vast-node.git
cd vast-node
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Running Examples

```bash
# Set your API key
export VAST_API_KEY=your-api-key-here

# Run the basic example
npx ts-node examples/basic-usage.ts

# Run diagnostics
npx ts-node examples/debug-sdk.ts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Sebastian Schepis

## Acknowledgments

- [Vast.ai](https://vast.ai/) for providing the original API and Python SDK
- The vast-node SDK team for this Node.js implementation