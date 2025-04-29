/**
 * VAST.ai API Test
 * 
 * This example tests the VAST.ai API connection using the provided API key.
 * It demonstrates core API functionality including:
 * 1. Searching for available machines
 * 2. Getting user account information
 * 3. Listing user instances
 */

const { VastClient } = require('../dist');

// API key for testing
const API_KEY = '43866bfbb34e8c810d58987bad96ea6bde3e5d0f29def48337462b4e4d4d94c3';

async function testApi() {
  try {
    // Create client with the API key
    const client = new VastClient(API_KEY);
    
    console.log('VAST.ai API Test');
    console.log('===============');
    
    // Search for available machines
    console.log('\n1. Searching for available machines...');
    const offersResult = await client.searchOffers({
      numGpus: 1,
      minBid: 0.5,
      orderBy: 'score-'
    });
    
    // Log the raw structure to understand the API response format
    console.log('API Response Structure:', JSON.stringify(offersResult, null, 2).substring(0, 200) + '...');
    
    // Handle different possible response formats
    const offers = Array.isArray(offersResult) ? offersResult : 
                  (offersResult && offersResult.offers) ? offersResult.offers : [];
    
    console.log(`Found ${offers.length || 0} machines matching criteria`);
    
    if (offers && offers.length > 0) {
      // Display the first few offers
      offers.slice(0, 3).forEach(offer => {
        const gpuName = offer.gpuName || offer.gpu_name || 'Unknown GPU';
        const numGpus = offer.numGpus || offer.num_gpus || 1;
        const price = offer.dphTotal || offer.dph_total || 'unknown price';
        
        console.log(`- Machine #${offer.id}: ${gpuName} (${numGpus}x) - $${price}/hr`);
      });
    }
    
    // Get account information
    console.log('\n2. Getting account information...');
    const userInfo = await client.api.getUserInfo();
    
    if (userInfo) {
      // Support both camelCase and snake_case response formats
      const username = userInfo.username || userInfo.user_name || 'Unknown';
      const balance = userInfo.balance || 0;
      const verified = userInfo.verifiedEmail || userInfo.verified_email || false;
      
      console.log(`- Username: ${username}`);
      console.log(`- Balance: $${balance}`);
      console.log(`- Email verified: ${verified ? 'Yes' : 'No'}`);
    } else {
      console.log('Could not retrieve account information.');
    }
    
    // List current instances
    console.log('\n3. Listing current instances...');
    const instances = await client.listInstances({ owner: 'me' });
    
    // The listInstances method already returns an array directly
    console.log(`You have ${instances.length || 0} active instances`);
    
    if (instances && instances.length > 0) {
      instances.forEach(instance => {
        // Support both camelCase and snake_case response formats
        const id = instance.id;
        const image = instance.image || instance.imageUuid || instance.image_uuid || 'Unknown image';
        const status = instance.actualStatus || instance.actual_status || 'Unknown status';
        
        console.log(`- Instance #${id}: ${image} (${status})`);
      });
    }
    
    console.log('\nAPI test completed successfully!');
    console.log('===============================');
  } catch (error) {
    console.error('API Test Error:', error.message);
    
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Run the test
testApi();