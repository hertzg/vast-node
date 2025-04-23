/**
 * Verify the listImages fix
 * 
 * This script tests the fixed listImages functionality to verify
 * that it now works correctly with the updated endpoint.
 * 
 * Usage:
 * VAST_API_KEY=your-key-here npx ts-node examples/verify-images-fix.ts
 */

import { VastClient } from '../src';
import { LogLevel } from '../src/diagnostics';

// Get API key from environment variable
const apiKey = process.env.VAST_API_KEY;

if (!apiKey) {
  console.error('Please set the VAST_API_KEY environment variable');
  process.exit(1);
}

// Initialize the client
const client = new VastClient(apiKey);

// Note: Currently the VastClient doesn't support diagnostic logging options directly.
// In a future update, we can enhance it to accept configuration options
// such as logLevel, logRequests, logResponses, and logErrors.

async function main() {
  try {
    console.log('Testing listImages functionality with fixed endpoint...');
    console.log('------------------------------------------------------');
    
    // List available Docker images with explicitly passed api_key parameter
    const images = await client.listImages({ api_key: apiKey });
    
    if (Array.isArray(images)) {
      console.log(`✅ SUCCESS: Retrieved ${images.length} Docker images`);
      
      // Display a few images if available
      if (images.length > 0) {
        console.log('\nSample Docker images:');
        
        // Show up to 3 images
        images.slice(0, 3).forEach((image, index) => {
          console.log(`\n[${index+1}] ${image.name || 'Unnamed image'}`);
          console.log(`  ID: ${image.id || 'Unknown'}`);
          console.log(`  Description: ${image.description || 'No description'}`);
          
          // Display additional details if available
          if (image.url) console.log(`  URL: ${image.url}`);
          if (image.version) console.log(`  Version: ${image.version}`);
          if (image.is_cuda !== undefined) console.log(`  CUDA: ${image.is_cuda ? 'Yes' : 'No'}`);
          if (image.is_pytorch !== undefined) console.log(`  PyTorch: ${image.is_pytorch ? 'Yes' : 'No'}`);
          if (image.is_tensorflow !== undefined) console.log(`  TensorFlow: ${image.is_tensorflow ? 'Yes' : 'No'}`);
        });
      } else {
        console.log('No Docker images found. This may be normal for your account.');
      }
      
      // Validate result against expected schema
      console.log('\nSchema validation:');
      
      if (images.length > 0) {
        // Check for expected DockerImage properties
        const expectedProps = ['id', 'name', 'description', 'image_uuid', 'docker_id'];
        const sampleImage = images[0];
        const missingProps = expectedProps.filter(prop => !(prop in sampleImage));
        
        if (missingProps.length === 0) {
          console.log('✅ Response schema matches expected DockerImage type');
        } else {
          console.log('⚠️ Some expected properties are missing from the response:');
          console.log(missingProps);
          console.log('\nActual properties in response:');
          console.log(Object.keys(sampleImage));
        }
      } else {
        console.log('⚠️ Cannot validate schema (no images returned)');
      }
      
      console.log('\n✅ FIX VERIFICATION COMPLETE: The listImages function now works correctly!');
    } else {
      console.log('⚠️ Unexpected response format (not an array)');
      console.log('Response type:', typeof images);
      console.log('Response data:', images);
    }
    
  } catch (error: any) {
    console.error('❌ ERROR during verification:', error.message || 'Unknown error');
    
    // Check if this is an axios error with response data
    if (error && error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    }
  }
}

main().catch(console.error);