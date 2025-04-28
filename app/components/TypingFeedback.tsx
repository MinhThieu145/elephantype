'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import LoaderStyles from './LoaderStyles';

interface TypingFeedbackProps {
  userId: string;
  sessionId: string;
}

export default function TypingFeedback({ userId, sessionId }: TypingFeedbackProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [arePrerequisitesReady, setArePrerequisitesReady] = useState(false);

  // Check if stats and metrics are ready before fetching feedback
  useEffect(() => {
    if (!userId || !sessionId) return;

    async function checkPrerequisites() {
      try {
        setIsLoading(true);
        
        // First check if stats are available
        console.log(`Checking if stats are ready for session: ${sessionId}`);
        const statsResponse = await fetch(`/api/foundry/stats`);
        if (!statsResponse.ok) {
          throw new Error(`Stats endpoint error: ${statsResponse.status}`);
        }
        
        // Then check if metrics are available
        console.log(`Checking if metrics are ready for user: ${userId}`);
        const metricsResponse = await fetch(`/api/foundry/metrics?userId=${encodeURIComponent(userId)}`);
        if (!metricsResponse.ok) {
          throw new Error(`Metrics endpoint error: ${metricsResponse.status}`);
        }
        
        // If we got here, both prerequisites are ready
        console.log('Stats and metrics are ready, can fetch feedback now');
        setArePrerequisitesReady(true);
      } catch (err) {
        console.error('Prerequisites not yet ready:', err);
        
        // Retry after 2 seconds
        setTimeout(checkPrerequisites, 2000);
      }
    }
    
    checkPrerequisites();
  }, [userId, sessionId]);

  const fetchFeedback = async () => {
    if (!userId || !sessionId) {
      setError('Missing user ID or session ID');
      setIsLoading(false);
      return;
    }

    if (!arePrerequisitesReady) {
      console.log('Cannot fetch feedback yet, prerequisites not ready');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching feedback for userId: ${userId}, sessionId: ${sessionId}`);
      const response = await fetch(
        `/api/foundry/feedback?userId=${encodeURIComponent(userId)}&sessionId=${encodeURIComponent(sessionId)}`
      );
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Feedback data received:', data);
      
      if (data.feedback) {
        console.log('LLM Feedback content:', data.feedback);
        setFeedback(data.feedback);
        setIsExpanded(true);
      } else {
        console.log('No feedback content in the API response');
        setError('No feedback available in API response');
      }
    } catch (err) {
      setError(`Failed to fetch feedback: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch feedback when prerequisites are ready
  useEffect(() => {
    if (arePrerequisitesReady) {
      fetchFeedback();
    }
  }, [arePrerequisitesReady]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className="w-full mt-10 rounded-lg overflow-hidden transition-all duration-300 ease-in-out bg-white dark:bg-gray-800"
      style={{ 
        border: '1px solid var(--card-border)',
        maxHeight: isExpanded ? '2000px' : '60px',
        opacity: isExpanded ? 1 : 0.9,
        transitionProperty: 'max-height, opacity',
      }}
    >
      <LoaderStyles />
      
      <div 
        className="p-4 flex justify-between items-center cursor-pointer"
        onClick={toggleExpand}
        style={{
          borderBottom: '1px solid var(--card-border)',
          backgroundColor: 'transparent',
          color: 'var(--foreground)'
        }}
      >
        <h3 className="text-lg font-medium" style={{ color: 'var(--primary)' }}>Typing Analysis & Feedback</h3>
        <span>{isExpanded ? '▲' : '▼'}</span>
      </div>
      
      <div className="p-8 font-mono">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="typing-loader mb-4">
              <span></span>
            </div>
            <p className="opacity-80 mt-4">
              {!arePrerequisitesReady 
                ? 'Analyzing your typing patterns...' 
                : 'Generating personalized feedback...'}
            </p>
            <p className="text-xs mt-2 opacity-60">This may take 10-15 seconds</p>
          </div>
        )}
        
        {error && !isLoading && (
          <div 
            className="px-6 py-4 rounded"
            style={{
              backgroundColor: 'rgba(255, 100, 100, 0.05)',
              border: '1px solid rgba(255, 100, 100, 0.2)',
              color: 'var(--incorrect-char)'
            }}
          >
            <p>{error}</p>
            <button
              onClick={fetchFeedback}
              className="mt-4 px-4 py-2 text-sm rounded transition-colors"
              style={{ 
                backgroundColor: 'transparent',
                border: '1px solid var(--incorrect-char)',
                color: 'var(--incorrect-char)'
              }}
              disabled={isLoading || !arePrerequisitesReady}
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  <span className="animate-pulse mr-2">•</span>
                  Trying again...
                </span>
              ) : 'Try Again'}
            </button>
          </div>
        )}
        
        {feedback && !isLoading && (
          <div className="feedback-content font-sans">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, [remarkEmoji, { emoticon: true }]]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-5" style={{color: 'var(--primary)'}} {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-8 mb-4" style={{color: 'var(--primary)'}} {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-5 mb-3" style={{color: 'var(--foreground)'}} {...props} />,
                p: ({node, ...props}) => <p className="mb-5 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-5 space-y-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-5 space-y-2" {...props} />,
                li: ({node, ...props}) => <li className="mb-2" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold" style={{color: 'var(--primary)'}} {...props} />,
                em: ({node, ...props}) => <em className="opacity-90" {...props} />,
                code: ({node, ...props}) => <code className="font-mono px-1 py-0.5 rounded" style={{backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)'}} {...props} />,
                a: ({node, ...props}) => <a className="underline" style={{color: 'var(--primary)'}} {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="pl-4 italic opacity-80 my-4" style={{borderLeft: '2px solid var(--primary)'}} {...props} />,
              }}
            >
              {feedback}
            </ReactMarkdown>
            
            {/* Refresh button */}
            <div className="mt-8 text-center">
              <button
                onClick={fetchFeedback}
                className="px-4 py-1 text-sm rounded-md transition-colors"
                style={{ 
                  backgroundColor: 'transparent',
                  border: '1px solid var(--card-border)',
                  color: 'var(--foreground)',
                  opacity: 0.7
                }}
                disabled={isLoading || !arePrerequisitesReady}
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    <span className="animate-pulse mr-2">•</span>
                    Refreshing...
                  </span>
                ) : 'Refresh Feedback'}
              </button>
            </div>
          </div>
        )}
        
        {!feedback && !isLoading && !error && (
          <div className="text-center py-12">
            <p className="mb-4 opacity-80">No feedback is available for this session yet.</p>
            <button
              onClick={fetchFeedback}
              className="px-6 py-2 rounded-md font-medium transition-colors"
              style={{ 
                backgroundColor: 'transparent',
                border: '1px solid var(--primary)',
                color: 'var(--primary)'
              }}
              disabled={!arePrerequisitesReady}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// CSS for the typing loader animation
export const TypingLoaderStyles = `
.typing-loader {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 30px;
}
.typing-loader:before {
  content: '';
  position: absolute;
  background-color: var(--primary);
  border-radius: 50%;
  width: 12px;
  height: 12px;
  animation: typing 1s infinite ease-in-out both;
  left: 8px;
}
.typing-loader:after {
  content: '';
  position: absolute;
  background-color: var(--primary);
  border-radius: 50%;
  width: 12px;
  height: 12px;
  left: 32px;
  animation: typing 1s infinite ease-in-out both;
  animation-delay: 0.2s;
}
.typing-loader span {
  content: '';
  position: absolute;
  background-color: var(--primary);
  border-radius: 50%;
  width: 12px;
  height: 12px;
  left: 56px;
  animation: typing 1s infinite ease-in-out both;
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0;
  } 
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
`; 