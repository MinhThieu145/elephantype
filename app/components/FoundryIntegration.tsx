'use client';

import { useState } from 'react';
import { sendToFoundry, previewSendToFoundry } from '../lib/sendDataToFoundry';
import type { TypingSessionData } from '../lib/types';

interface FoundryIntegrationProps {
  sessionData: TypingSessionData | null;
}

/**
 * Component that provides UI for sending typing session data to Palantir Foundry
 */
export default function FoundryIntegration({ sessionData }: FoundryIntegrationProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Don't render anything if no session data is available
  if (!sessionData) {
    return null;
  }

  /**
   * Sends the data to Foundry in preview mode (which doesn't actually ingest the data)
   */
  const handlePreviewClick = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await previewSendToFoundry(sessionData);
      setResult({
        success: true,
        message: 'Preview successful. Data format validated.'
      });
      console.log('Preview response:', response);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sends the data to Foundry for actual ingestion
   */
  const handleSendClick = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await sendToFoundry(sessionData);
      setResult({
        success: true,
        message: 'Data successfully sent to Palantir Foundry.'
      });
      console.log('Send response:', response);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex space-x-3 mb-2">
        <button
          className="px-3 py-1 rounded-md text-sm font-medium"
          style={{ 
            backgroundColor: 'var(--secondary)',
            color: 'var(--foreground)',
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
          onClick={handlePreviewClick}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Preview Send to Foundry'}
        </button>
        <button
          className="px-3 py-1 rounded-md text-sm font-medium"
          style={{ 
            backgroundColor: 'var(--primary)',
            color: 'var(--background)',
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
          onClick={handleSendClick}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Send to Palantir Foundry'}
        </button>
      </div>
      
      {result && (
        <div 
          className={`text-sm p-2 rounded mt-2 ${result.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}
          style={{
            color: result.success ? 'var(--success)' : 'var(--error)'
          }}
        >
          {result.message}
        </div>
      )}
    </div>
  );
} 