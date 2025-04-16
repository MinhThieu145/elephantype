import { NextRequest, NextResponse } from 'next/server';
import { TypingSessionData } from '../../lib/types';

// Palantir Foundry API endpoint
const FOUNDRY_API_ENDPOINT = 'https://nathannguyen.usw-16.palantirfoundry.com/api/v2/highScale/streams/datasets/ri.foundry.main.dataset.2c68d899-d736-4661-bc42-82acc742cc6e/streams/master/publishRecords';

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
    
    // Check if the data is already formatted with a records field
    let sessionData: TypingSessionData;
    let payload: { records: TypingSessionData[] };
    
    if (requestData.records) {
      // Data is already in the correct format
      payload = requestData;
      sessionData = requestData.records[0];
    } else {
      // Data needs to be wrapped in a records array
      sessionData = requestData;
      payload = { records: [sessionData] };
    }
    
    console.log('Using session data with ID:', sessionData.metadata?.sessionId);
    
    // Get preview mode from the URL parameters
    const { searchParams } = new URL(request.url);
    const previewMode = searchParams.has('preview');
    
    // Build the API URL with preview parameter if needed
    const apiUrl = `${FOUNDRY_API_ENDPOINT}${previewMode ? '?preview=true' : ''}`;
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
