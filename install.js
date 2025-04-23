#!/usr/bin/env node

/**
 * Installation script for vast-node
 * This script guides users through the setup process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Vast.ai Node.js SDK Installation Helper ===\n');
console.log('This script will help you set up the Vast.ai Node.js SDK.\n');

// Check if package.json exists
const hasPackageJson = fs.existsSync(path.join(process.cwd(), 'package.json'));

if (!hasPackageJson) {
  console.log('No package.json found in current directory.');
  console.log('Creating a new npm project...\n');
  
  try {
    execSync('npm init -y', { stdio: 'inherit' });
    console.log('\nCreated package.json successfully.\n');
  } catch (error) {
    console.error('Failed to create package.json:', error.message);
    process.exit(1);
  }
}

// Install dependencies
console.log('Installing the Vast.ai Node.js SDK and its dependencies...\n');

try {
  // For local development, we'll use the current directory
  execSync('npm install', { stdio: 'inherit' });
  console.log('\nInstalled dependencies successfully.\n');
} catch (error) {
  console.error('Failed to install dependencies:', error.message);
  process.exit(1);
}

// Ask for API key
rl.question('Do you have a Vast.ai API key? (yes/no): ', (hasKey) => {
  if (hasKey.toLowerCase() === 'yes') {
    rl.question('Enter your Vast.ai API key (it will only be stored locally): ', (apiKey) => {
      console.log('\nGreat! You can use this API key in your code like this:\n');
      console.log(`const { VastClient } = require('vast-node');`);
      console.log(`const client = new VastClient('${apiKey}');\n`);
      
      // Create example file
      const examplePath = path.join(process.cwd(), 'vast-example.js');
      const exampleContent = `
const { VastClient } = require('./dist');

// Initialize the client with your API key
const client = new VastClient('${apiKey}');

// Example: Get user info
async function getUserInfo() {
  try {
    const userInfo = await client.getUserInfo();
    console.log('User information:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('Error getting user info:', error.message);
  }
}

// Run the example
getUserInfo();
`;
      
      fs.writeFileSync(examplePath, exampleContent);
      console.log(`Created an example file at ${examplePath}`);
      console.log('You can run it with: node vast-example.js\n');
      
      console.log('Installation complete!');
      rl.close();
    });
  } else {
    console.log('\nYou can get an API key from https://console.vast.ai/\n');
    console.log('Once you have an API key, you can use it like this:\n');
    console.log(`const { VastClient } = require('vast-node');`);
    console.log(`const client = new VastClient('your-api-key-here');\n`);
    
    console.log('Installation complete!');
    rl.close();
  }
});