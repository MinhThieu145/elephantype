/**
 * Palantir Foundry Data Integration
 * 
 * This module provides functions to send typing test data to Palantir Foundry.
 */

import { TypingSessionData } from './types';

// Palantir Foundry API endpoint
const FOUNDRY_API_ENDPOINT = 'https://nathannguyen.usw-16.palantirfoundry.com/api/v2/highScale/streams/datasets/ri.foundry.main.dataset.9325624e-4042-47bb-bf45-102a41eebda4/streams/master/publishRecords?preview=true';

// Environment variables should be loaded via Next.js's built-in support
// Access the token from process.env
const getFoundryToken = (): string => {
  const token = process.env.AIP_DATASTREAM_TOKEN;
  
  if (!token) {
    throw new Error('Foundry API token not found. Make sure AIP_DATASTREAM_TOKEN is set in .env');
  }
  
  return token;
};

/**
 * Formats the typing session data for Foundry ingestion
 * @param sessionData Typing session data
 * @returns Formatted data object
 */
export const formatDataForFoundry = (sessionData: TypingSessionData): Record<string, any> => {
  // Return the session data directly as it already matches the expected structure
  return sessionData;
};

/**
 * Sends typing session data to Palantir Foundry
 * @param sessionData Typing session data to send
 * @param previewMode If true, runs in preview mode without actual data ingestion
 * @returns Promise resolving to the API response
 */
export const sendToFoundry = async (sessionData: TypingSessionData, previewMode = false): Promise<any> => {
  try {
    const token = getFoundryToken();
    const formattedData = formatDataForFoundry(sessionData);
    
    // Build the API URL with preview parameter if needed
    const apiUrl = `${FOUNDRY_API_ENDPOINT}${previewMode ? '?preview=true' : ''}`;
    
    // Send the data to Foundry
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records: [formattedData] }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Foundry API error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending data to Foundry:', error);
    throw error;
  }
};

/**
 * Sends typing session data to Foundry in preview mode
 * @param sessionData Typing session data to send
 * @returns Promise resolving to the API response
 */
export const previewSendToFoundry = async (sessionData: TypingSessionData): Promise<any> => {
  return sendToFoundry(sessionData, true);
}; 