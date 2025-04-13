'use client';

import { useState } from 'react';
import { previewSendToFoundry } from '../lib/sendDataToFoundry';
import type { TypingSessionData } from '../lib/types';

interface FoundryIntegrationProps {
  sessionData: TypingSessionData | null;
}

// Expanded result type to include diagnostic information
interface ValidationResult {
  success: boolean;
  message: string;
  error?: string;
  diagnostic?: boolean;
  errorType?: string;
  hint?: string;
  warning?: string | null;
}

/**
 * Component that provides UI for sending typing session data to Palantir Foundry in preview mode
 */
export default function FoundryIntegration({ sessionData }: FoundryIntegrationProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

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
      console.log('Sending data to Foundry in preview mode...');
      const response = await previewSendToFoundry(sessionData);
      console.log('Preview mode response:', response);
      
      // Check if the response is a diagnostic error object
      if (response && response.diagnostic === true) {
        setResult(response);
      } else {
        setResult({
          success: true,
          message: 'Preview successful. Data format validated.',
          warning: response?.warning || null
        });
      }
    } catch (error) {
      console.error('Error in preview mode:', error);
      
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.stack : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex mb-2">
        <button
          className="px-3 py-1 rounded-md text-sm font-medium"
          style={{ 
            backgroundColor: 'var(--primary)',
            color: 'var(--background)',
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
          onClick={handlePreviewClick}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Validate Data with Foundry'}
        </button>
      </div>
      
      {result && (
        <div 
          className={`text-sm p-2 rounded mt-2 ${result.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}
          style={{
            color: result.success ? 'var(--success)' : 'var(--error)'
          }}
        >
          <div className="font-medium">{result.message}</div>
          
          {result.warning && (
            <div className="mt-1 text-yellow-600 dark:text-yellow-400">
              Warning: {result.warning}
            </div>
          )}
          
          {result.hint && (
            <div className="mt-1 text-blue-600 dark:text-blue-400">
              Hint: {result.hint}
            </div>
          )}
          
          {result.errorType && (
            <div className="mt-1 opacity-80">
              Error type: {result.errorType}
            </div>
          )}
          
          {result.error && (
            <details className="mt-2">
              <summary className="cursor-pointer">Show technical details</summary>
              <pre className="mt-1 p-2 bg-black/5 dark:bg-white/5 rounded text-xs overflow-auto max-h-[200px]">
                {result.error}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
} 