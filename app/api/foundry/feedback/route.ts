import { NextRequest, NextResponse } from 'next/server';
import 'dotenv/config';
import fetch from 'node-fetch';

// Define types for the API response
interface FeedbackResponse {
  value: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('Feedback API route called');
    
    // Get environment variables
    const FOUNDRY_URL = process.env.FOUNDRY_URL;
    const FOUNDRY_TOKEN = process.env.FOUNDRY_TOKEN;
    const ONTOLOGY_ID = process.env.ONTOLOGY_ID || 'ontology-abd4f6ff-9f1c-4af0-849a-bdbd7458993d';

    if (!FOUNDRY_URL || !FOUNDRY_TOKEN) {
      console.error('❌ Required environment variables are missing');
      return NextResponse.json(
        { error: 'Required environment variables are missing' },
        { status: 500 }
      );
    }
    
    // Get userId and sessionId from query parameters or use defaults
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user-0d023529';
    const sessionId = searchParams.get('sessionId') || '6f7ff8a7-076b-4134-b3df-cb9393b56167';
    
    console.log(`Fetching feedback for userId: ${userId}, sessionId: ${sessionId}`);
    
    const url = `${FOUNDRY_URL}/api/v2/ontologies/${ONTOLOGY_ID}/queries/llmFeedback/execute`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FOUNDRY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parameters: {
          userId: userId,
          sessionId: sessionId
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status} - ${response.statusText}`);
      console.error(`Response body: ${errorText}`);
      return NextResponse.json(
        { error: `Foundry API error: ${errorText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json() as FeedbackResponse;
    
    if (!data || !data.value) {
      return NextResponse.json(
        { error: 'Invalid response format from Foundry API' },
        { status: 500 }
      );
    }
    
    // Process the response - convert the markdown to HTML if needed
    // For now, we're just returning the raw feedback value
    return NextResponse.json({ 
      feedback: data.value,
      metadata: {
        userId,
        sessionId,
        generatedAt: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('Error in feedback API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 