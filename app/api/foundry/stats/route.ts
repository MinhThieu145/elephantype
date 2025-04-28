import { NextResponse } from 'next/server';

/**
 * This API endpoint fetches HighVarianceKeys from Palantir Foundry
 * 
 * @returns JSON array of HighVarianceKeys objects
 */
export async function GET() {
  // Environment variables
  const FOUNDRY_URL = process.env.FOUNDRY_URL;
  const FOUNDRY_TOKEN = process.env.FOUNDRY_TOKEN;
  const ONTOLOGY_ID = process.env.ONTOLOGY_ID;

  const OBJECT_TYPE = process.env.FOUNDRY_OBJECT_TYPE_VARIANCE;
  
  if (!FOUNDRY_URL || !FOUNDRY_TOKEN || !ONTOLOGY_ID || !OBJECT_TYPE) {
    return NextResponse.json(
      { error: 'Missing required environment variables' },
      { status: 500 }
    );
  }

  try {
    const url = `${FOUNDRY_URL}/api/v2/ontologies/${ONTOLOGY_ID}/objectSets/loadObjects`;
    
    // Prepare the request body for HighVarianceKeys
    const requestBody = {
      objectSet: {
        type: 'base',
        objectType: OBJECT_TYPE
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
    
    // Process the keystroke data
    const processedData = data.data?.map((item: any) => {
      let inconsistentKeys = {};
      
      // Parse the highStdKeysOutput JSON string if it exists
      if (item.highStdKeysOutput) {
        try {
          // The highStdKeysOutput should be a JSON string containing the inconsistent keys data
          inconsistentKeys = JSON.parse(item.highStdKeysOutput);
          console.log('Successfully parsed highStdKeysOutput for session:', item.metadatasessionId);
        } catch (error) {
          console.error('Error parsing highStdKeysOutput JSON:', error);
          console.error('Raw data was:', item.highStdKeysOutput);
        }
      }
      
      return {
        userId: item.metadatauserId,
        sessionId: item.metadatasessionId,
        primaryKey: item.__primaryKey,
        // Include both the raw data and the parsed inconsistent keys
        highStdKeysOutput: item.highStdKeysOutput,
        inconsistentKeys: inconsistentKeys
      };
    }) || [];
    
    console.log(`Processed ${processedData.length} HighVarianceKeys records`);
    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Error fetching HighVarianceKeys:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 