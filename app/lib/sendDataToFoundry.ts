/**
 * Palantir Foundry Data Integration
 * 
 * This module provides functions to send typing test data to Palantir Foundry.
 */

import { TypingSessionData } from './types';
import { stringifySessionData } from './dataCapture';

// Our Next.js API route that will proxy requests to Foundry
const API_ROUTE = '/api/foundry';

// Environment variables should be loaded via Next.js's built-in support
// Access the token from process.env
const getFoundryToken = (): string => {
  // Try both regular and NEXT_PUBLIC_ prefixed versions
  const token = process.env.AIP_DATASTREAM_TOKEN || process.env.NEXT_PUBLIC_AIP_DATASTREAM_TOKEN;
  
  // Debug log to see available env vars (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Environment context:', process.env.NODE_ENV);
    console.log('Available env vars:', Object.keys(process.env).filter(key => 
      !key.includes('TOKEN') && !key.includes('SECRET') && !key.includes('KEY')
    ));
  }
  
  if (!token) {
    throw new Error('Foundry API token not found. Make sure AIP_DATASTREAM_TOKEN is set in .env.local in the root directory and that you have restarted the Next.js server.');
  }
  
  return token;
};

/**
 * Formats the typing session data for Foundry ingestion
 * @param sessionData Typing session data
 * @returns Formatted data object
 */
export const formatDataForFoundry = (sessionData: TypingSessionData): Record<string, any> => {
  // Convert the session data to stringified format before sending to Foundry
  const stringifiedData = stringifySessionData(sessionData);
  
  // Return the stringified data wrapped in a records array as expected by Foundry API
  return { records: [stringifiedData] };
};

/**
 * Sends typing session data to Palantir Foundry via our Next.js API route
 * @param sessionData Typing session data to send
 * @param previewMode If true, runs in preview mode without actual data ingestion
 * @returns Promise resolving to the API response
 */
export const sendToFoundry = async (sessionData: TypingSessionData, previewMode = false): Promise<any> => {
  try {
    // Format the data for Foundry
    const formattedData = formatDataForFoundry(sessionData);
    
    // Build the API URL with preview parameter if needed
    const apiUrl = `${API_ROUTE}${previewMode ? '?preview=true' : ''}`;
    
    console.log(`Sending request to ${apiUrl}${previewMode ? ' (preview mode)' : ''}`);
    console.log('Request payload:', JSON.stringify(formattedData).substring(0, 200) + '...');
    
    // Send the data to our API route, which will then forward it to Foundry
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    
    if (!response.ok) {
      let errorMessage = 'Unknown API error';
      let errorData: any = null;
      
      try {
        // Try to get detailed error information from the API response
        const responseText = await response.text();
        console.log('Error response text:', responseText);
        
        if (responseText) {
          try {
            errorData = JSON.parse(responseText);
            console.error('API error details:', errorData);
            errorMessage = errorData.error || errorData.message || `API error (${response.status})`;
          } catch (parseError) {
            console.error('Error parsing JSON error response:', parseError);
            errorMessage = `API error: ${response.status} ${response.statusText}`;
            // Store the raw text as errorData
            errorData = responseText;
          }
        } else {
          console.log('Empty error response body');
          errorMessage = `API error: ${response.status} ${response.statusText} (empty response)`;
        }
      } catch (responseError) {
        console.error('Error reading response:', responseError);
        errorMessage = `Error reading API response: ${responseError instanceof Error ? responseError.message : String(responseError)}`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Handle responses
    try {
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      console.log('Response text preview:', responseText.substring(0, 100) || '(empty response)');
      
      if (!responseText.trim()) {
        console.log('Empty response received');
        return { 
          success: true,
          message: 'Empty response received from server',
          warning: previewMode ? null : 'Expected JSON data but received empty response'
        };
      }
      
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed JSON response:', data);
        return data;
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        console.log('Response is not valid JSON:', responseText);
        throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    } catch (error) {
      console.error('Error processing response:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error sending data to Foundry:', error);
    if (error instanceof Error) {
      console.error('Error stack trace:', error.stack);
    }
    throw error;
  }
};

/**
 * Sends typing session data to Foundry in preview mode
 * @param sessionData Typing session data to send
 * @returns Promise resolving to the API response or a diagnostic object on error
 */
export const previewSendToFoundry = async (sessionData: TypingSessionData): Promise<any> => {
  try {
    return await sendToFoundry(sessionData, true);
  } catch (error) {
    // Instead of treating the error as a success, return detailed diagnostic information
    console.error('Preview mode error details:', error);
    
    if (error instanceof Error && error.message.includes('Unexpected end of JSON input')) {
      return { 
        success: false, 
        message: 'Server returned invalid or empty JSON response',
        error: error.message,
        diagnostic: true,
        errorType: 'JSON_PARSE_ERROR',
        hint: 'This may indicate that the API endpoint is working but not returning proper JSON. Check server logs.'
      };
    }
    
    throw error;
  }
};