#!/usr/bin/env ts-node
/**
 * Test script for Palantir Foundry Integration
 * 
 * This script tests sending typing data to Palantir Foundry
 * using the preview mode to validate the format without actually ingesting data.
 * 
 * Usage:
 * npm run test:foundry
 */

// Load environment variables (must be done before importing modules that use them)
require('dotenv').config();

import { v4 as uuidv4 } from 'uuid';

// Mock typing session data for testing
const mockSessionData = {
  metadata: {
    sessionId: uuidv4(),
    startTime: Date.now() - 60000, // 1 minute ago
    endTime: Date.now(),
    textPrompt: "The quick brown fox jumps over the lazy dog.",
    userTranscript: "The quick brown fox jumps over the lazy dog.",
    completionStatus: "completed",
    duration: 60000, // 1 minute
    deviceInfo: {
      deviceType: "desktop",
      browserName: "Chrome",
      browserVersion: "91",
      operatingSystem: "Windows 10",
      screenWidth: 1920,
      screenHeight: 1080,
      keyboardLayout: "QWERTY",
      inputMethod: "physical keyboard"
    }
  },
  keystrokes: [
    {
      id: uuidv4(),
      timestamp: Date.now() - 59000,
      key: "T",
      expectedKey: "T",
      isCorrect: true,
      position: 0,
      actionType: "keydown",
      interKeyDelay: null
    },
    {
      id: uuidv4(),
      timestamp: Date.now() - 58800,
      key: "h",
      expectedKey: "h",
      isCorrect: true,
      position: 1,
      actionType: "keydown",
      interKeyDelay: 200
    }
  ],
  metrics: {
    wpm: 45.6,
    accuracy: 100.0,
    errorRate: 0.0,
    totalKeystrokes: 2,
    correctKeystrokes: 2,
    errorKeystrokes: 0,
    consistency: 0.0,
    problemKeys: {}
  }
};

// Simplified version of the sendToFoundry function for testing
async function testSendToFoundry() {
  const token = process.env.AIP_DATASTREAM_TOKEN;
  
  if (!token) {
    console.error('Foundry API token not found. Make sure AIP_DATASTREAM_TOKEN is set in .env');
    process.exit(1);
  }
  
  const postUri = "https://nathannguyen.usw-16.palantirfoundry.com/api/v2/highScale/streams/datasets/ri.foundry.main.dataset.9325624e-4042-47bb-bf45-102a41eebda4/streams/master/publishRecords?preview=true";
  
  try {
    console.log('Sending test data to Foundry in preview mode...');
    console.log('Data:', JSON.stringify(mockSessionData, null, 2));
    
    const response = await fetch(postUri, {
      method: 'POST',
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [mockSessionData] })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Foundry API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Success! Response:', result);
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run the test
testSendToFoundry()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 