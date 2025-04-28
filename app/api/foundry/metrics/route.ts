import { NextRequest, NextResponse } from 'next/server';
import 'dotenv/config';
import fetch from 'node-fetch';

// Define types for the API response
interface FoundryMetric {
  metadataUserId?: string;
  metadataSessionId?: string;
  flatWpm?: number;
  flatAccuracy?: number;
  flatEndTime?: string;
  flatSessionId?: string;
  flatStartTime?: string;
  flatErrorRate?: number;
  flatConsistency?: number;
  metrics?: string;
  __primaryKey?: string;
  __rid?: string;
}

interface FoundryResponse {
  data?: FoundryMetric[];
  totalCount?: string | number;
  [key: string]: any;
}

interface ProcessedMetric {
  userId: string;
  sessionId: string;
  accuracy: number;
  wpm: number;
  endTime: string;
  startTime: string;
  errorRate?: number;
  consistency?: number;
  timestamp: number;
  rawMetrics: any;
  rid: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('Metrics API route called');
    
    // Get environment variables
    const FOUNDRY_URL = process.env.FOUNDRY_URL;
    const FOUNDRY_TOKEN = process.env.FOUNDRY_TOKEN;
    const ONTOLOGY_ID = process.env.ONTOLOGY_ID;

    const OBJECT_TYPE = process.env.FOUNDRY_OBJECT_TYPE_METRICS;
    
    if (!FOUNDRY_URL || !FOUNDRY_TOKEN || !ONTOLOGY_ID || !OBJECT_TYPE) {
      console.error('❌ Required environment variables are missing');
      return NextResponse.json(
        { error: 'Required environment variables are missing' },
        { status: 500 }
      );
    }
    
    const url = `${FOUNDRY_URL}/api/v2/ontologies/${ONTOLOGY_ID}/objectSets/loadObjects`;
    
    // Get userId from query parameter or use default
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || process.env.DEFAULT_TEST_USER_ID || 'user-0d023529'; // Default user ID from env or fallback
    
    console.log(`Fetching metrics for userId: ${userId}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FOUNDRY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objectSet: {
          type: 'base',
          objectType: OBJECT_TYPE
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
    
    const data = await response.json() as FoundryResponse;
    
    if (!data.data || !Array.isArray(data.data)) {
      return NextResponse.json(
        { error: 'Invalid response format from Foundry API' },
        { status: 500 }
      );
    }
    
    // Filter metrics by userId and extract required fields
    const userMetrics = data.data
      .filter((metric: FoundryMetric) => metric.metadataUserId === userId)
      .map((metric: FoundryMetric) => {
        // Extract metrics data from the JSON string if available
        let parsedMetrics = null;
        if (metric.metrics) {
          try {
            parsedMetrics = JSON.parse(metric.metrics);
          } catch (e) {
            console.error('Error parsing metrics JSON:', e);
          }
        }
        
        // Start time could be in flatStartTime or extracted from metrics
        const startTime = metric.flatStartTime || 
                         (parsedMetrics?.startTime ? new Date(parsedMetrics.startTime).toISOString() : null);
        
        // Ensure all numeric values are converted to actual numbers
        const ensureNumber = (value: any): number => {
          if (value === null || value === undefined) return 0;
          // If it's already a number, return it
          if (typeof value === 'number') return value;
          // If it's a string that represents a number, convert it
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        };

        return {
          userId: metric.metadataUserId || userId,
          sessionId: metric.flatSessionId || metric.metadataSessionId || 'unknown',
          accuracy: ensureNumber(metric.flatAccuracy || (parsedMetrics?.accuracy || 0)),
          wpm: ensureNumber(metric.flatWpm || (parsedMetrics?.wpm || 0)),
          errorRate: ensureNumber(metric.flatErrorRate || (parsedMetrics?.errorRate || 0)),
          consistency: ensureNumber(metric.flatConsistency || (parsedMetrics?.consistency || 0)),
          endTime: metric.flatEndTime || 'unknown',
          startTime: startTime || 'unknown',
          timestamp: new Date(metric.flatEndTime || Date.now()).getTime(),
          rawMetrics: parsedMetrics,
          rid: metric.__rid
        } as ProcessedMetric;
      })
      // Sort by timestamp (ascending)
      .sort((a: ProcessedMetric, b: ProcessedMetric) => a.timestamp - b.timestamp);
    
    console.log(`Found ${userMetrics.length} metrics for userId: ${userId}`);
    
    return NextResponse.json({ metrics: userMetrics });
    
  } catch (error) {
    console.error('Error in metrics API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 