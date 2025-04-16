import { NextResponse } from 'next/server';

/**
 * This API endpoint fetches HighAvailabilityStats from Palantir Foundry
 * 
 * @returns JSON array of HighAvailabilityStats objects
 */
export async function GET() {
  // Environment variables
  const FOUNDRY_URL = process.env.FOUNDRY_URL || 'https://nathannguyen.usw-16.palantirfoundry.com';
  const FOUNDRY_TOKEN = process.env.FOUNDRY_TOKEN;
  const ONTOLOGY_ID = process.env.ONTOLOGY_ID;

  if (!FOUNDRY_TOKEN || !ONTOLOGY_ID) {
    return NextResponse.json(
      { error: 'Missing required environment variables' },
      { status: 500 }
    );
  }

  try {
    const url = `${FOUNDRY_URL}/api/v2/ontologies/${ONTOLOGY_ID}/objectSets/loadObjects`;
    
    // Prepare the request body
    const requestBody = {
      objectSet: {
        type: 'base',
        objectType: 'HighAvailabilityStats'
      }
    };
    
    // Set up headers with auth token
    const headers = {
      'Authorization': `Bearer ${FOUNDRY_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    // Make the API call
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
      cache: 'no-store' // Ensure we don't cache the response
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    // Extract objects array from response
    const objects = data.data || [];
    
    return NextResponse.json(objects);
  } catch (error) {
    console.error('Error fetching HighAvailabilityStats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 