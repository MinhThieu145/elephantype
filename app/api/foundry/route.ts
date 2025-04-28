import { NextRequest, NextResponse } from 'next/server';
import { TypingSessionData } from '../../lib/types';

// Construct the Palantir Foundry API endpoint from environment variables
const constructFoundryApiEndpoint = () => {
  const foundryUrl = process.env.FOUNDRY_URL;
  const typingDatasetUrl = process.env.FOUNDRY_API_TYPING_DATASET_URL;
  
  if (!foundryUrl || !typingDatasetUrl) {
    throw new Error('Required environment variables FOUNDRY_URL or FOUNDRY_API_TYPING_DATASET_URL are missing');
  }
  
  return `${foundryUrl}${typingDatasetUrl}`;
};

export async function POST(request: NextRequest) {
  console.log('API route called with preview:', new URL(request.url).searchParams.has('preview'));
  
  try {
    // Get the API token from environment variables
    const token = process.env.AIP_DATASTREAM_TOKEN;
    
    // Log token availability (not the actual token)
    console.log('Token available:', !!token);
    console.log('Environment mode:', process.env.NODE_ENV);
    
    if (!token) {
      console.error('API token not found in environment variables');
      return NextResponse.json(
        { error: 'Foundry API token not found. Check server configuration.' },
        { status: 500 }
      );
    }
    
    // Get data from the request
    const requestData = await request.json();
    console.log('Received data structure:', Object.keys(requestData));
    
    // Always stringify the session data for Foundry
    let sessionData: any; // Use any temporarily to handle various formats
    let payload: { records: any[] };
    
    if (requestData.records) {
      // Data is already in the correct format, but ensure stringification
      sessionData = requestData.records[0];
    } else {
      sessionData = requestData;
    }

    // Fix for metadata possibly being a string
    if (sessionData.metadata && typeof sessionData.metadata === 'string') {
      try {
        // If metadata is a string, parse it first
        const parsedMetadata = JSON.parse(sessionData.metadata);
        // Set the userId on the parsed object
        parsedMetadata.userId = process.env.DEFAULT_TEST_USER_ID || 'user-0d023529';
        // Set the metadata back to a string
        sessionData.metadata = JSON.stringify(parsedMetadata);
      } catch (error) {
        console.error('Error parsing metadata string:', error);
        // If parsing fails, we'll leave it as is and it will be handled by stringifySessionData
      }
    } else if (sessionData.metadata && typeof sessionData.metadata === 'object') {
      // If metadata is already an object, set userId directly
      sessionData.metadata.userId = process.env.DEFAULT_TEST_USER_ID || 'user-0d023529';
    } else {
      console.error('Unexpected metadata format in sessionData:', typeof sessionData.metadata);
    }

    // Stringify the session data fields as required by Foundry
    const { stringifySessionData } = await import('../../lib/dataCapture');
    const stringifiedData = stringifySessionData(sessionData);
    
    // Use the stringified data directly, without additional JSON.stringify
    payload = { 
      records: [{
        metadata: JSON.parse(stringifiedData.metadata),
        keystrokes: JSON.parse(stringifiedData.keystrokes),
        metrics: JSON.parse(stringifiedData.metrics)
      }] 
    };
    
    console.log('Using session data with ID:', 
      typeof sessionData.metadata === 'string' 
        ? JSON.parse(sessionData.metadata).sessionId 
        : sessionData.metadata?.sessionId);
    
    // Get preview mode from the URL parameters
    const { searchParams } = new URL(request.url);
    const previewMode = searchParams.has('preview');
    
    // Build the API URL with preview parameter if needed
    // Construct the API URL from environment variables
    let apiUrl;
    try {
      apiUrl = `${constructFoundryApiEndpoint()}${previewMode ? '?preview=true' : ''}`;
    } catch (error) {
      console.error('Failed to construct Foundry API endpoint:', error);
      return NextResponse.json(
        { error: 'Missing environment configuration for Foundry API' },
        { status: 500 }
      );
    }
    console.log('Sending request to:', apiUrl);
    
    console.log('Request payload structure:', Object.keys(payload));
    console.log('Request payload first record type:', typeof payload.records[0]);
    console.log('Request payload sample:', JSON.stringify(payload).substring(0, 200) + '...');
    
    // Forward the request to Foundry
    try {
      console.log('Starting Foundry API call...');
      const foundryResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('Foundry API response status:', foundryResponse.status);
      console.log('Foundry API response status text:', foundryResponse.statusText);
      console.log('Foundry API response headers:', Object.fromEntries([...foundryResponse.headers.entries()]));
      
      // Get the response from Foundry
      if (!foundryResponse.ok) {
        try {
          const errorText = await foundryResponse.text();
          console.error('Foundry API error response text:', errorText);
          
          let parsedError;
          try {
            parsedError = JSON.parse(errorText);
            console.error('Foundry API parsed error:', parsedError);
          } catch (parseError) {
            console.error('Could not parse error as JSON:', parseError);
          }
          
          return NextResponse.json(
            { error: `Foundry API error (${foundryResponse.status}): ${errorText}` },
            { status: foundryResponse.status }
          );
        } catch (textReadError) {
          console.error('Error reading error response text:', textReadError);
          return NextResponse.json(
            { error: `Foundry API error (${foundryResponse.status}): Could not read error details` },
            { status: foundryResponse.status }
          );
        }
      }
      
      // Process successful response
      try {
        const responseText = await foundryResponse.text();
        console.log('Foundry API response text length:', responseText.length);
        console.log('Foundry API response text preview:', responseText.substring(0, 200) || '(empty response)');
        
        if (!responseText.trim()) {
          console.log('Foundry API returned empty response - this is common for preview mode');
          // Empty response is common for preview mode
          return new Response('', { 
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
        
        try {
          const data = JSON.parse(responseText);
          console.log('Successfully received and parsed JSON response from Foundry API');
          return NextResponse.json(data, { status: foundryResponse.status });
        } catch (jsonError) {
          console.error('Error parsing Foundry response as JSON:', jsonError);
          // Instead of trying to parse invalid JSON, return the raw text with diagnostic info
          return NextResponse.json({
            warning: 'Received non-JSON response from Foundry API',
            rawResponse: responseText,
            success: true  // Still mark as success if the API call worked
          }, { status: 200 });
        }
      } catch (responseError) {
        console.error('Error processing Foundry response:', responseError);
        return NextResponse.json(
          { error: `Error processing Foundry response: ${responseError instanceof Error ? responseError.message : String(responseError)}` },
          { status: 500 }
        );
      }
    } catch (fetchError) {
      console.error('Fetch operation failed:', fetchError);
      return NextResponse.json(
        { error: `Network error communicating with Foundry API: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in API route:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json(
      { error: 'Failed to communicate with Foundry API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
