'use client';

import { useState } from 'react';
import type { TypingSessionData } from '../lib/types';

interface TypingStatsProps {
  sessionData: TypingSessionData | null;
}

export default function TypingStats({ sessionData }: TypingStatsProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'raw'>('summary');
  
  if (!sessionData) {
    return null;
  }
  
  const { metadata, metrics } = sessionData;
  const { deviceInfo } = metadata;
  
  // Format timestamp for display
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Format duration for display
  const formatDuration = (durationMs: number | null) => {
    if (!durationMs) return 'N/A';
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Get top problem keys
  const getProblemKeys = () => {
    const entries = Object.entries(metrics.problemKeys);
    
    if (entries.length === 0) {
      return <p className="text-sm opacity-70">No problem keys detected</p>;
    }
    
    // Sort by error count in descending order
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    
    // Take top 5
    const top5 = sorted.slice(0, 5);
    
    return (
      <div className="grid grid-cols-2 gap-2">
        {top5.map(([key, count]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="font-mono px-2 py-1 bg-secondary rounded">{key}</span>
            <span>{count} errors</span>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div 
      className="w-full max-w-3xl mx-auto mt-8 p-6 rounded-lg"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)'
      }}
    >
      <h2 className="text-xl font-bold mb-4">Typing Statistics</h2>
      
      {/* Tabs */}
      <div className="flex mb-4 border-b border-gray-300 dark:border-gray-700">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'summary' ? 'border-b-2 border-primary' : 'opacity-70'}`}
          style={{ borderColor: activeTab === 'summary' ? 'var(--primary)' : 'transparent' }}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'detailed' ? 'border-b-2 border-primary' : 'opacity-70'}`}
          style={{ borderColor: activeTab === 'detailed' ? 'var(--primary)' : 'transparent' }}
          onClick={() => setActiveTab('detailed')}
        >
          Detailed
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'raw' ? 'border-b-2 border-primary' : 'opacity-70'}`}
          style={{ borderColor: activeTab === 'raw' ? 'var(--primary)' : 'transparent' }}
          onClick={() => setActiveTab('raw')}
        >
          Raw Data
        </button>
      </div>
      
      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--secondary)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                {Math.round(metrics.wpm)}
              </p>
              <p className="text-sm">WPM</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--secondary)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                {Math.round(metrics.accuracy)}%
              </p>
              <p className="text-sm">Accuracy</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--secondary)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                {formatDuration(metadata.duration)}
              </p>
              <p className="text-sm">Duration</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Problem Keys</h3>
            {getProblemKeys()}
          </div>
        </div>
      )}
      
      {/* Detailed Tab */}
      {activeTab === 'detailed' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Session Info</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div>Start Time:</div>
              <div>{formatTime(metadata.startTime)}</div>
              
              <div>End Time:</div>
              <div>{metadata.endTime ? formatTime(metadata.endTime) : 'N/A'}</div>
              
              <div>Status:</div>
              <div className="capitalize">{metadata.completionStatus}</div>
              
              <div>Session ID:</div>
              <div className="font-mono text-xs truncate">{metadata.sessionId}</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div>Words Per Minute:</div>
              <div>{Math.round(metrics.wpm * 100) / 100}</div>
              
              <div>Accuracy:</div>
              <div>{Math.round(metrics.accuracy * 100) / 100}%</div>
              
              <div>Error Rate:</div>
              <div>{Math.round(metrics.errorRate * 1000) / 10}%</div>
              
              <div>Total Keystrokes:</div>
              <div>{metrics.totalKeystrokes}</div>
              
              <div>Correct Keystrokes:</div>
              <div>{metrics.correctKeystrokes}</div>
              
              <div>Error Keystrokes:</div>
              <div>{metrics.errorKeystrokes}</div>
              
              <div>Typing Consistency:</div>
              <div>{Math.round(metrics.consistency)} ms</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Device Info</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div>Device Type:</div>
              <div className="capitalize">{deviceInfo.deviceType}</div>
              
              <div>Browser:</div>
              <div>{deviceInfo.browserName} {deviceInfo.browserVersion}</div>
              
              <div>Operating System:</div>
              <div>{deviceInfo.operatingSystem}</div>
              
              <div>Screen Size:</div>
              <div>{deviceInfo.screenWidth} x {deviceInfo.screenHeight}</div>
              
              <div>Keyboard Layout:</div>
              <div>{deviceInfo.keyboardLayout}</div>
              
              <div>Input Method:</div>
              <div className="capitalize">{deviceInfo.inputMethod}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Raw Data Tab */}
      {activeTab === 'raw' && (
        <div>
          <p className="mb-2 text-sm">Raw session data (JSON):</p>
          <div 
            className="font-mono text-xs p-4 rounded overflow-auto max-h-96"
            style={{ backgroundColor: 'var(--input-bg)' }}
          >
            <pre>{JSON.stringify(sessionData, null, 2)}</pre>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              className="px-3 py-1 rounded-md text-sm font-medium"
              style={{ 
                backgroundColor: 'var(--primary)',
                color: 'var(--background)'
              }}
              onClick={() => {
                // Create a blob and download it
                const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `typing-session-${sessionData.metadata.sessionId}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              Download JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 