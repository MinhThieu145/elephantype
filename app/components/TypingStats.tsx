'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { TypingSessionData } from '../lib/types';
import FoundryIntegration from './FoundryIntegration';

interface MetricDataPoint {
  userId: string;
  sessionId: string;
  accuracy: number;
  wpm: number;
  endTime: string;
  timestamp: number;
  rawMetrics: any;
}

interface TypingStatsProps {
  sessionData: TypingSessionData | null;
}

interface HighVarianceKeystrokesData {
  userId: string;
  sessionId: string;
  primaryKey: string;
  inconsistentKeys: Record<string, number>;
  // These fields aren't in the new API response but needed for compatibility
  metadata?: string;
  metrics?: string;
}

// Component to visualize inconsistent keys
function InconsistentKeysVisualization({ inconsistentKeys }: { inconsistentKeys: Record<string, number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maxValue = Math.max(...Object.values(inconsistentKeys));
  
  // Sort keys by their standard deviation values (descending)
  const sortedKeys = Object.entries(inconsistentKeys)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6); // Show top 6 most inconsistent keys

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up chart dimensions
    const padding = { top: 30, right: 20, bottom: 40, left: 20 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;
    
    // Draw title
    ctx.fillStyle = 'var(--foreground)';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Delay Standard Deviation (ms)', canvas.width / 2, 20);
    
    // Draw background grid
    const numGridLines = 4;
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= numGridLines; i++) {
      const y = padding.top + chartHeight - (i / numGridLines) * chartHeight;
      
      // Draw grid line
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(canvas.width - padding.right, y);
      ctx.stroke();
      
      // Label the grid line
      const value = (i / numGridLines) * maxValue;
      ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(value).toString(), padding.left - 5, y + 3);
    }
    
    // Calculate bar dimensions
    const barWidth = chartWidth / sortedKeys.length * 0.7;
    const spacing = chartWidth / sortedKeys.length * 0.3;
    
    // Draw bars
    sortedKeys.forEach((entry, index) => {
      const [key, value] = entry;
      const normalizedHeight = (value / maxValue) * chartHeight;
      const x = padding.left + index * (barWidth + spacing) + spacing/2;
      const y = padding.top + chartHeight - normalizedHeight;
      
      // Create gradient based on value (higher values = more intense)
      const intensity = Math.min(1, value / maxValue);
      const gradient = ctx.createLinearGradient(x, y, x, y + normalizedHeight);
      
      // Color scheme: pink to purple gradient
      gradient.addColorStop(0, `rgba(255, ${Math.floor(50 + 100 * (1-intensity))}, ${Math.floor(150 + 100 * (1-intensity))}, 0.9)`);
      gradient.addColorStop(1, `rgba(255, 20, ${Math.floor(100 * (1-intensity))}, 0.8)`);
      
      // Draw bar with rounded corners
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      const radius = Math.min(8, barWidth / 2);
      
      // Only round the top corners
      ctx.moveTo(x, y + normalizedHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + normalizedHeight);
      ctx.closePath();
      
      ctx.fill();
      
      // Add stroke for definition
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw value label above bar
      ctx.fillStyle = 'var(--foreground)';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(value).toString(), x + barWidth/2, y - 8);
      
      // Draw key label below bar
      ctx.font = '12px system-ui, sans-serif';
      
      // Use nice display for special keys
      const displayKey = key === ' ' ? 'Space' : 
                        key === 'Backspace' ? '⌫' :
                        key.length > 1 ? key : `'${key}'`;
      
      ctx.fillText(displayKey, x + barWidth/2, padding.top + chartHeight + 15);
    });
    
  }, [inconsistentKeys, maxValue, sortedKeys]);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="w-full h-[220px]" 
      />
      <div className="mt-2 text-xs grid grid-cols-3 gap-1">
        {sortedKeys.map(([key, value]) => (
          <div key={key} className="flex items-center">
            <span 
              className="inline-block w-3 h-3 mr-1 rounded-sm" 
              style={{ 
                background: `linear-gradient(to bottom, rgba(255, 80, 180, 0.9), rgba(255, 20, 80, 0.8))` 
              }}
            ></span>
            <span className="font-mono">{key === ' ' ? 'Space' : key}</span>: {Math.round(value)} ms
          </div>
        ))}
      </div>
    </>
  );
}

// Component to visualize performance metrics over time
function PerformanceTimeseries({ metrics, currentSessionId }: { metrics: MetricDataPoint[], currentSessionId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [includesCurrentSession, setIncludesCurrentSession] = useState(false);
  
  // Check if metrics include current session
  useEffect(() => {
    if (currentSessionId && metrics.length > 0) {
      const hasCurrentSession = metrics.some(m => m.sessionId === currentSessionId);
      setIncludesCurrentSession(hasCurrentSession);
      if (hasCurrentSession) {
        console.log('Performance chart includes current session:', currentSessionId);
      }
    }
  }, [metrics, currentSessionId]);
  
  // Debug effect for metrics data received by component
  useEffect(() => {
    console.log('PerformanceTimeseries received metrics:', metrics);
    if (metrics.length > 0) {
      console.log('First metric in PerformanceTimeseries:', metrics[0]);
      console.log('Types of first metric values:', {
        accuracy: typeof metrics[0].accuracy,
        wpm: typeof metrics[0].wpm,
        timestamp: typeof metrics[0].timestamp
      });
    }
  }, [metrics]);
  
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || metrics.length === 0) {
        console.log('Canvas not available or no metrics data');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        return;
      }

      console.log('Drawing performance chart with metrics:', metrics.length);
      
      // Set canvas dimensions based on its display size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set up chart dimensions
      const padding = { top: 30, right: 50, bottom: 40, left: 50 };
      const chartWidth = canvas.width - padding.left - padding.right;
      const chartHeight = canvas.height - padding.top - padding.bottom;
      
      // Find max values for scaling
      const maxWpm = Math.max(...metrics.map(m => m.wpm)) * 1.1; // Add 10% headroom
      const maxAccuracy = 100; // Accuracy is always 0-100%
      
      // Draw title
      ctx.fillStyle = 'var(--foreground)';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Performance Over Time', canvas.width / 2, 20);

      // Sort metrics by timestamp (ascending)
      const sortedMetrics = [...metrics].sort((a, b) => a.timestamp - b.timestamp);
      
      // Calculate positions for x-axis - use session number instead of timestamp
      const getXPosition = (index: number) => {
        return padding.left + (index / (sortedMetrics.length - 1)) * chartWidth;
      };
      
      // Format for x-axis label - use session number and relative time
      const formatXLabel = (metric: MetricDataPoint, index: number) => {
        // Get relative time (how long ago)
        const now = Date.now();
        const timestamp = metric.timestamp;
        const diffMs = now - timestamp;
        
        // Convert to appropriate units
        if (diffMs < 60000) { // Less than 1 minute
          return `#${index + 1}\n(just now)`;
        } else if (diffMs < 3600000) { // Less than 1 hour
          const minutes = Math.floor(diffMs / 60000);
          return `#${index + 1}\n(${minutes}m ago)`;
        } else if (diffMs < 86400000) { // Less than 1 day
          const hours = Math.floor(diffMs / 3600000);
          return `#${index + 1}\n(${hours}h ago)`;
        } else {
          const days = Math.floor(diffMs / 86400000);
          return `#${index + 1}\n(${days}d ago)`;
        }
      };
      
      // Draw x-axis (time)
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartHeight);
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw y-axis
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.stroke();
      
      // Draw x-axis labels (evenly spaced)
      const numXLabels = Math.min(sortedMetrics.length, 5);
      if (sortedMetrics.length > 1) {
        for (let i = 0; i < numXLabels; i++) {
          const position = i / (numXLabels - 1);
          const index = Math.floor(position * (sortedMetrics.length - 1));
          const x = getXPosition(index);
          const metric = sortedMetrics[index];
          
          ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
          ctx.font = '10px system-ui, sans-serif';
          ctx.textAlign = 'center';
          
          // Split label into two lines
          const label = formatXLabel(metric, index);
          const lines = label.split('\n');
          
          // Draw first line (session number)
          ctx.fillText(lines[0], x, padding.top + chartHeight + 15);
          
          // Draw second line (relative time)
          if (lines.length > 1) {
            ctx.fillText(lines[1], x, padding.top + chartHeight + 30);
          }
          
          // Draw vertical grid line
          ctx.beginPath();
          ctx.moveTo(x, padding.top);
          ctx.lineTo(x, padding.top + chartHeight);
          ctx.strokeStyle = 'rgba(150, 150, 150, 0.1)';
          ctx.stroke();
        }
      }
      
      // Draw y-axis labels and grid lines for WPM (left side)
      const yWpmLabels = 5;
      for (let i = 0; i <= yWpmLabels; i++) {
        const value = (i / yWpmLabels) * maxWpm;
        const y = padding.top + chartHeight - (i / yWpmLabels) * chartHeight;
        
        ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(value).toString(), padding.left - 5, y + 3);
        
        // Draw horizontal grid line
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.1)';
        ctx.stroke();
      }
      
      // Draw y-axis labels for Accuracy (right side)
      for (let i = 0; i <= yWpmLabels; i++) {
        const value = (i / yWpmLabels) * maxAccuracy;
        const y = padding.top + chartHeight - (i / yWpmLabels) * chartHeight;
        
        ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(Math.round(value).toString() + '%', padding.left + chartWidth + 5, y + 3);
      }
      
      // Draw WPM line
      ctx.beginPath();
      sortedMetrics.forEach((point, index) => {
        const x = getXPosition(index);
        const y = padding.top + chartHeight - (point.wpm / maxWpm) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add gradient under the WPM line
      const wpmGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      wpmGradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)');
      wpmGradient.addColorStop(1, 'rgba(255, 100, 100, 0.05)');
      
      ctx.beginPath();
      sortedMetrics.forEach((point, index) => {
        const x = getXPosition(index);
        const y = padding.top + chartHeight - (point.wpm / maxWpm) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      // Complete the gradient fill path
      const lastX = getXPosition(sortedMetrics.length - 1);
      ctx.lineTo(lastX, padding.top + chartHeight);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.closePath();
      ctx.fillStyle = wpmGradient;
      ctx.fill();
      
      // Draw WPM data points
      sortedMetrics.forEach((point, index) => {
        const x = getXPosition(index);
        const y = padding.top + chartHeight - (point.wpm / maxWpm) * chartHeight;
        
        // Check if this is the current session point
        const isCurrentSession = point.sessionId === currentSessionId;
        
        ctx.beginPath();
        ctx.arc(x, y, isCurrentSession ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isCurrentSession ? 'rgba(255, 50, 50, 1)' : 'rgba(255, 100, 100, 0.9)';
        ctx.fill();
        ctx.strokeStyle = isCurrentSession ? 'white' : 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = isCurrentSession ? 2 : 1;
        ctx.stroke();
        
        // Add label for current session
        if (isCurrentSession) {
          ctx.fillStyle = 'rgba(255, 50, 50, 1)';
          ctx.font = 'bold 10px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Latest', x, y - 12);
        }
      });
      
      // Draw Accuracy line
      ctx.beginPath();
      sortedMetrics.forEach((point, index) => {
        const x = getXPosition(index);
        const y = padding.top + chartHeight - (point.accuracy / maxAccuracy) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.9)';
      ctx.stroke();
      
      // Draw Accuracy data points
      sortedMetrics.forEach((point, index) => {
        const x = getXPosition(index);
        const y = padding.top + chartHeight - (point.accuracy / maxAccuracy) * chartHeight;
        
        // Check if this is the current session point
        const isCurrentSession = point.sessionId === currentSessionId;
        
        ctx.beginPath();
        ctx.arc(x, y, isCurrentSession ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isCurrentSession ? 'rgba(0, 120, 255, 1)' : 'rgba(100, 180, 255, 0.9)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = isCurrentSession ? 2 : 1;
        ctx.stroke();
      });
      
      // Add legend
      const legendY = padding.top + 15;
      
      // WPM legend item
      ctx.beginPath();
      ctx.rect(padding.left, legendY - 5, 15, 2);
      ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(padding.left + 8, legendY - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'var(--foreground)';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('WPM', padding.left + 20, legendY);
      
      // Accuracy legend item
      ctx.beginPath();
      ctx.rect(padding.left + 70, legendY - 5, 15, 2);
      ctx.fillStyle = 'rgba(100, 180, 255, 0.9)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(padding.left + 78, legendY - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'var(--foreground)';
      ctx.textAlign = 'left';
      ctx.fillText('Accuracy', padding.left + 90, legendY);
      
    } catch (error) {
      console.error('Error rendering performance chart:', error);
    }
  }, [metrics, currentSessionId]);

  if (metrics.length === 0) {
    console.log('PerformanceTimeseries: No metrics available');
    return (
      <div className="text-center py-6 text-sm opacity-70">
        No performance data available yet.
      </div>
    );
  }

  // Debug the metrics data that should be rendered
  console.log('PerformanceTimeseries rendering with valid metrics:', 
    metrics.map((m: MetricDataPoint) => ({ 
      wpm: m.wpm, 
      accuracy: m.accuracy, 
      timestamp: m.timestamp,
      sessionId: m.sessionId?.substring(0, 8) + '...'
    }))
  );

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="w-full h-[250px]" 
      />
      <div className="mt-2 text-xs text-center opacity-70">
        {includesCurrentSession ? (
          <span>Showing performance trends across {metrics.length} typing sessions (including current session)</span>
        ) : (
          <span>Showing performance trends across {metrics.length} typing sessions (latest session still processing)</span>
        )}
      </div>
    </>
  );
}

export default function TypingStats({ sessionData: initialSessionData }: TypingStatsProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'raw'>('summary');
  const [showDemo, setShowDemo] = useState(false);
  const [foundryKeystrokeData, setFoundryKeystrokeData] = useState<HighVarianceKeystrokesData[] | null>(null);
  const [matchedKeystrokeData, setMatchedKeystrokeData] = useState<HighVarianceKeystrokesData | null>(null);
  const [realInconsistentKeys, setRealInconsistentKeys] = useState<Record<string, number> | null>(null);
  const [sessionData, setSessionData] = useState<TypingSessionData | null>(initialSessionData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [noMatchFound, setNoMatchFound] = useState<boolean>(false);
  const [foundryDataFetchComplete, setFoundryDataFetchComplete] = useState<boolean>(false);
  const [validationStatus, setValidationStatus] = useState<{isLoading: boolean, result: any | null}>({
    isLoading: false,
    result: null
  });
  const [metricsData, setMetricsData] = useState<MetricDataPoint[]>([]);
  const [matchFound, setMatchFound] = useState<boolean>(false);
  const [waitingForCurrentSession, setWaitingForCurrentSession] = useState<boolean>(false);
  const maxRetries = 7;
  const retryInterval = 30000;
  
  // Add this useEffect to debug metrics data state at the beginning
  useEffect(() => {
    console.log('======= DEBUG METRICS STATE =======');
    console.log('metricsData:', metricsData);
    console.log('metricsData.length:', metricsData.length);
    console.log('showDemo:', showDemo);
    console.log('isLoading:', isLoading);
    console.log('foundryDataFetchComplete:', foundryDataFetchComplete);
    console.log('==================================');
  }, [metricsData, showDemo, isLoading, foundryDataFetchComplete]);
  
  // Fetch Foundry high variance keystroke data AND metrics data within the same retry flow
  useEffect(() => {
    // Don't attempt to fetch if there's no session data
    if (!sessionData) {
      console.log('Skipping fetch - no sessionData');
      return;
    }
    
    // Skip if we've already found a match
    if (matchFound) {
      console.log('Skipping fetch - match already found');
      return;
    }
    
    // This is key: we want to refetch even if foundryDataFetchComplete is true,
    // if we're on a retry (retryCount > 0) - reset this flag to allow refetching
    if (retryCount > 0 && foundryDataFetchComplete) {
      console.log(`Retry ${retryCount}/${maxRetries} - resetting foundryDataFetchComplete to fetch fresh data`);
      setFoundryDataFetchComplete(false);
    }
    
    // Skip if we've already fetched and it's not a retry
    if (foundryDataFetchComplete && retryCount === 0) {
      console.log('Skipping fetch - foundryDataFetchComplete already true and not a retry');
      return;
    }
    
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;
    
    async function fetchFoundryData() {
      if (!isMounted) return;
      
      try {
        // Only set loading state on first fetch or explicit retries
        if (!foundryDataFetchComplete || retryCount > 0) {
          setIsLoading(true);
          setLoadingError(null);
          setNoMatchFound(false);
        }
        
        console.log(`Foundry fetch attempt ${retryCount + 1}/${maxRetries}...`);
        
        // STEP 1: First fetch high variance keystroke data
        console.log('Starting fresh fetch of keystroke data...');
        const keystrokeResponse = await fetch('/api/foundry/stats');
        
        if (!isMounted) return;
        
        if (!keystrokeResponse.ok) {
          throw new Error(`Failed to fetch high variance keystroke data: ${keystrokeResponse.status} ${keystrokeResponse.statusText}`);
        }
        
        const keystrokeData = await keystrokeResponse.json();
        
        if (!isMounted) return;
        
        console.log(`Keystroke data fetched: ${keystrokeData.length} items`);
        setFoundryKeystrokeData(keystrokeData);
        
        // STEP 2: Then fetch metrics data using the same user ID
        // Determine the userId to use for metrics fetch
        let userId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'user-0d023529'; // Use environment variable or fallback to default
        
        // Get the actual userId from session if available
        if (sessionData && sessionData.metadata) {
          // Handle the case where metadata might be a string instead of an object
          const metadata = typeof sessionData.metadata === 'string' 
            ? JSON.parse(sessionData.metadata) 
            : sessionData.metadata;
          
          if (metadata.userId) {
            // Override with session userId only if we want personalized metrics
            // For now, use the fixed ID to ensure we have data to display
            // userId = metadata.userId;
            console.log('Session has userId:', metadata.userId, 'but using fixed ID for demo');
          }
        }
        
        console.log(`Fetching performance metrics for user: ${userId} (attempt ${retryCount + 1}/${maxRetries})`);
        const metricsResponse = await fetch(`/api/foundry/metrics?userId=${userId}`);
        
        if (!isMounted) return;
        
        if (!metricsResponse.ok) {
          throw new Error(`Failed to fetch metrics data: ${metricsResponse.status} ${metricsResponse.statusText}`);
        }
        
        const metricsResult = await metricsResponse.json();
        
        if (!isMounted) return;
        
        console.log('Raw metrics result:', metricsResult);
        
        if (metricsResult.metrics && Array.isArray(metricsResult.metrics)) {
          console.log(`Loaded ${metricsResult.metrics.length} metrics for user ${userId}`);
          
          // Use a temporary variable to help debug
          const newMetricsData = metricsResult.metrics;
          console.log('New metrics data (first item):', newMetricsData[0]);
          console.log('New metrics data length:', newMetricsData.length);
          
          // Ensure metrics have correct types
          const typedMetrics = newMetricsData.map((m: {
            userId: string;
            sessionId: string;
            accuracy: number | string;
            wpm: number | string;
            endTime: string;
            timestamp: number | string;
            rawMetrics: any;
          }) => ({
            ...m,
            accuracy: typeof m.accuracy === 'string' ? parseFloat(m.accuracy) : m.accuracy,
            wpm: typeof m.wpm === 'string' ? parseFloat(m.wpm) : m.wpm,
            timestamp: typeof m.timestamp === 'string' ? parseInt(m.timestamp) : m.timestamp
          }));
          
          console.log('Setting metricsData with', typedMetrics.length, 'items');
          setMetricsData(typedMetrics);
          
          console.log('Setting foundryDataFetchComplete to true');
          setFoundryDataFetchComplete(true);
          
          // Only turn off loading if we're not trying to match keystroke data
          if (!sessionData || !sessionData.metadata || !sessionData.metadata.sessionId) {
            console.log('Setting isLoading to false (no session ID to match)');
            setIsLoading(false);
          } else {
            console.log('Keeping isLoading true while attempting session match');
          }
        } else {
          console.warn('No metrics data found or invalid format', metricsResult);
          setMetricsData([]);
          // Still set foundryDataFetchComplete to true to allow UI to proceed
          setFoundryDataFetchComplete(true);
          // If no metrics found, we can turn off loading if we're not matching keystroke data
          if (!sessionData || !sessionData.metadata || !sessionData.metadata.sessionId) {
            setIsLoading(false);
          }
        }
        
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error fetching Foundry data:', error);
        
        if (retryCount < maxRetries - 1) {
          setLoadingError(`Fetch attempt ${retryCount + 1}/${maxRetries} failed. Retrying in 30 seconds...`);
          timeoutId = setTimeout(() => {
            if (isMounted) {
              setRetryCount(prev => prev + 1);
            }
          }, retryInterval);
        } else {
          setLoadingError(`Failed to fetch data after ${maxRetries} attempts. Please try again later.`);
          setIsLoading(false);
          setFoundryDataFetchComplete(true);
        }
      }
    }
    
    fetchFoundryData();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [retryCount, sessionData, foundryDataFetchComplete]);

  // Debug the metrics chart rendering condition
  useEffect(() => {
    console.log('Metrics chart render check:', {
      metricsDataLength: metricsData.length,
      showDemo,
      metricsDataLengthGTE2: metricsData.length >= 2,
      willRenderChart: metricsData.length >= 2 && !showDemo
    });
  }, [metricsData.length, showDemo]);

  // Match Foundry data with current session
  useEffect(() => {
    if (!sessionData || !foundryKeystrokeData || !isLoading) {
      console.log('Match data useEffect - skipping with values:', { 
        hasSessionData: !!sessionData, 
        hasFoundryKeystrokeData: !!foundryKeystrokeData, 
        isLoading
      });
      return;
    }
    
    // Skip if we've already found a match
    if (matchFound) {
      console.log('Match check skipped - match already found');
      return;
    }
    
    try {
      console.log('Attempting to match Foundry keystroke data with current session...');
      console.log('Local session ID:', sessionData.metadata.sessionId);
      
      // Find the matching keystroke data based on sessionId instead of userId
      const matched = foundryKeystrokeData.find(data => 
        data.sessionId === sessionData.metadata.sessionId
      );
      
      if (matched) {
        console.log('Found matching Foundry keystroke data!');
        setMatchedKeystrokeData(matched);
        setNoMatchFound(false);
        setMatchFound(true); // Set flag to indicate we found a match
        
        // Set the inconsistent keys
        if (matched.inconsistentKeys) {
          setRealInconsistentKeys(matched.inconsistentKeys);
        }
        
        // Found a match, so end loading without resetting retry count
        setIsLoading(false);
        setFoundryDataFetchComplete(true);
        
        // Clear any pending timeouts by resetting retry count
        setRetryCount(0);
      } else {
        console.warn('No matching Foundry keystroke data found. Available data:', 
          foundryKeystrokeData.map(data => ({
            sessionId: data.sessionId,
            userId: data.userId,
            primaryKey: data.primaryKey
          }))
        );
        
        // If we've exhausted all retries, show the no match found message
        if (retryCount >= maxRetries - 1) {
          console.log(`No match found after ${maxRetries} attempts. Giving up.`);
          setNoMatchFound(true);
          setIsLoading(false);
          setFoundryDataFetchComplete(true);
        } else {
          // Otherwise, continue retrying
          console.log(`No match found. Will retry in ${retryInterval/1000} seconds (attempt ${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryInterval);
        }
      }
      
      // At the end of this useEffect, check metricsData
      console.log('Current metricsData state:', metricsData.length, 'items');
    } catch (error) {
      console.error('Error matching Foundry keystroke data:', error);
      
      // If an error occurs during matching and we've exhausted retries, stop loading
      if (retryCount >= maxRetries - 1) {
        setIsLoading(false);
        setFoundryDataFetchComplete(true);
      } else {
        // Otherwise retry
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, retryInterval);
      }
    }
  }, [foundryKeystrokeData, sessionData, retryCount, maxRetries, isLoading, retryInterval, metricsData]);
  
  // Create session data (either demo or with real inconsistent keys)
  useEffect(() => {
    // If no initial session data, show a demo version with sample data
    if (!initialSessionData) {
      if (showDemo) {
        // Create demo data but WITHOUT inconsistent keys
        setSessionData({
          metadata: {
            sessionId: "demo-session",
            startTime: Date.now() - 300000, // 5 minutes ago
            endTime: Date.now(),
            textPrompt: "The quick brown fox jumps over the lazy dog.",
            userTranscript: "The quick brown fox jumps over the lazy dog.",
            completionStatus: "completed",
            duration: 300000, // 5 minutes in ms
            deviceInfo: {
              deviceType: "desktop",
              browserName: "Chrome",
              browserVersion: "100.0.0",
              operatingSystem: "Windows 10",
              screenWidth: 1920,
              screenHeight: 1080,
              keyboardLayout: "QWERTY",
              inputMethod: "physical keyboard"
            },
            userId: "demo-user",
            userName: "Demo User"
          },
          keystrokes: [], // Empty for demo
          metrics: {
            wpm: 65.42,
            accuracy: 98.5,
            errorRate: 0.015,
            totalKeystrokes: 500,
            correctKeystrokes: 495,
            errorKeystrokes: 5,
            consistency: 38.23,
            problemKeys: {
              "e": 2,
              "r": 1,
              "o": 1,
              "t": 1
            }
            // No longer including inconsistentKeys for demo
          }
        });
      } else {
        setSessionData(null);
      }
    } else if (realInconsistentKeys && initialSessionData.metrics && 
              !initialSessionData.metrics.inconsistentKeys) {
      // If we have real inconsistent keys from Foundry but not in the session data
      setSessionData({
        ...initialSessionData,
        metrics: {
          ...initialSessionData.metrics,
          inconsistentKeys: realInconsistentKeys
        }
      });
    } else {
      setSessionData(initialSessionData);
    }
  }, [initialSessionData, showDemo, realInconsistentKeys]);
  
  // If no sessionData, show demo option
  if (!sessionData) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <h2 className="text-xl font-bold mb-4">Typing Statistics</h2>
        <p className="mb-4">No typing data available. Would you like to see a demonstration?</p>
        <button 
          onClick={() => setShowDemo(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Show Demonstration
        </button>
      </div>
    );
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
  
  // Add a function to get a fallback for inconsistent keys
  const getFallbackInconsistentKeys = () => {
    // If we have foundry keystroke data, use the first record as a fallback
    if (foundryKeystrokeData && foundryKeystrokeData.length > 0) {
      console.log('Using fallback keystroke data from session:', foundryKeystrokeData[0].sessionId);
      return foundryKeystrokeData[0].inconsistentKeys;
    }
    
    // Otherwise return a demo fallback
    return {
      "e": 45.2,
      "t": 38.7,
      "a": 31.5,
      "o": 29.8,
      "i": 26.4,
      "s": 24.3
    };
  };

  // Determine which inconsistent keys to show - priority order:
  // 1. Real Foundry data if we have it
  // 2. Local inconsistent keys from session data if in normal mode
  // 3. Fallback data if no match found but we have keystroke data from Foundry
  // 4. Never show demo data (unless using fallback)
  const shouldShowInconsistentKeys = () => {
    if (showDemo) {
      return false; // Never show charts in demo mode
    } else if (realInconsistentKeys) {
      return true; // We have real Foundry data
    } else if (sessionData?.metrics?.inconsistentKeys && Object.keys(sessionData.metrics.inconsistentKeys).length > 0) {
      return true; // We have local inconsistent keys
    } else if (foundryKeystrokeData && foundryKeystrokeData.length > 0 && noMatchFound && foundryDataFetchComplete) {
      return true; // No match found, but we can use fallback data
    }
    return false;
  };
  
  const getInconsistentKeysToShow = () => {
    if (realInconsistentKeys) {
      return realInconsistentKeys; // Highest priority: real data from Foundry
    } else if (sessionData?.metrics?.inconsistentKeys) {
      return sessionData.metrics.inconsistentKeys; // Second priority: local data
    } else if (foundryKeystrokeData && foundryKeystrokeData.length > 0 && noMatchFound && foundryDataFetchComplete) {
      return getFallbackInconsistentKeys(); // Third priority: fallback data
    }
    return null;
  };
  
  const inconsistentKeysToShow = getInconsistentKeysToShow();
  
  // Add debug useEffect for metrics rendering
  useEffect(() => {
    if (metricsData.length >= 2 && !showDemo) {
      console.log('Rendering PerformanceTimeseries with', metricsData.length, 'metrics');
    } else {
      console.log('Not rendering chart. metricsData:', metricsData);
    }
  }, [metricsData, showDemo]);
  
  // Add debug function for directly checking currently available sessions
  const debugCheckSessions = () => {
    // Get all available sessions from foundryKeystrokeData
    if (foundryKeystrokeData && foundryKeystrokeData.length > 0) {
      const sessionIds = foundryKeystrokeData.map(data => data.sessionId);
      console.log('Available session IDs:', sessionIds);
      
      // Check if current session ID is in the list
      const isCurrentSessionAvailable = sessionIds.includes(sessionData?.metadata.sessionId || '');
      console.log('Current session ID:', sessionData?.metadata.sessionId);
      console.log('Is current session available?', isCurrentSessionAvailable);
      
      // Show alert with result
      alert(`Debug: Found ${sessionIds.length} session IDs in Foundry data.
Current session: ${sessionData?.metadata.sessionId}
Is current session available? ${isCurrentSessionAvailable}
Check console for full list.`);
    } else {
      alert('No foundry keystroke data available yet.');
    }
  };

  // Add debug function to compare user IDs
  const debugCheckUserIds = () => {
    if (sessionData?.metadata) {
      const sessionUserId = typeof sessionData.metadata === 'string' 
        ? JSON.parse(sessionData.metadata).userId
        : sessionData.metadata.userId;
      
      console.log('Session user ID:', sessionUserId);
      console.log('Metrics API user ID:', 'user-0d023529');
      
      // Show alert with result
      alert(`Debug: User ID comparison
Current session user ID: ${sessionUserId}
Metrics API user ID: user-0d023529`);
    } else {
      alert('No session data available.');
    }
  };
  
  // Add debug function to force API refresh
  const debugForceRefresh = async () => {
    try {
      alert('Fetching fresh data from Foundry API...');
      
      // Reset states to allow a new fetch
      setMatchFound(false);
      setRetryCount(0);
      setFoundryDataFetchComplete(false);
      
      // Fetch fresh data from API
      const response = await fetch('/api/foundry/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      const freshData = await response.json();
      
      if (Array.isArray(freshData)) {
        // Log all available session IDs
        const sessionIds = freshData.map(item => item.sessionId);
        console.log('Fresh Foundry data - session IDs:', sessionIds);
        
        // Check if current session ID is in the list
        const currentSessionId = sessionData?.metadata.sessionId;
        const isCurrentSessionAvailable = sessionIds.includes(currentSessionId);
        
        console.log(`Current session ID: ${currentSessionId}`);
        console.log(`Found in fresh data: ${isCurrentSessionAvailable}`);
        
        // Detailed check - look for similar IDs
        const similarIds = sessionIds.filter(id => 
          id && currentSessionId && 
          (id.includes(currentSessionId.substring(0, 8)) || 
           currentSessionId.includes(id.substring(0, 8))));
        
        // Update state with fresh data
        setFoundryKeystrokeData(freshData);
        
        // If we found a match, update match state
        if (isCurrentSessionAvailable) {
          const matched = freshData.find(data => data.sessionId === currentSessionId);
          if (matched) {
            setMatchedKeystrokeData(matched);
            setNoMatchFound(false);
            setMatchFound(true);
            
            if (matched.inconsistentKeys) {
              setRealInconsistentKeys(matched.inconsistentKeys);
            }
          }
        }
        
        // Show result
        alert(`Fresh data loaded from Foundry!
Found ${freshData.length} records.
Current session: ${currentSessionId}
Found exact match: ${isCurrentSessionAvailable}
Similar IDs found: ${similarIds.length > 0 ? 'Yes' : 'No'}

Check console for details.`);
      } else {
        alert('Error: Unexpected data format from API');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Add a function to check if the current session is in metrics data
  useEffect(() => {
    if (sessionData && metricsData.length > 0 && foundryDataFetchComplete) {
      const currentSessionId = sessionData.metadata.sessionId;
      const sessionExists = metricsData.some(m => m.sessionId === currentSessionId);
      
      if (!sessionExists && !waitingForCurrentSession) {
        console.log('Current session not found in metrics data, will try to update metrics');
        setWaitingForCurrentSession(true);
        
        // Schedule a metrics refresh
        const timeoutId = setTimeout(() => {
          refreshMetricsData();
        }, 10000); // Try after 10 seconds
        
        return () => clearTimeout(timeoutId);
      } else if (sessionExists && waitingForCurrentSession) {
        console.log('Current session now found in metrics data!');
        setWaitingForCurrentSession(false);
      }
    }
  }, [sessionData, metricsData, foundryDataFetchComplete]);
  
  // Add a function to refresh metrics data
  const refreshMetricsData = async () => {
    if (!sessionData) return;
    
    try {
      // Determine the userId to use
      let userId = 'user-0d023529'; // Default fixed user ID
      
      console.log('Refreshing metrics data...');
      const metricsResponse = await fetch(`/api/foundry/metrics?userId=${userId}`);
      
      if (!metricsResponse.ok) {
        throw new Error(`Failed to fetch metrics data: ${metricsResponse.status}`);
      }
      
      const metricsResult = await metricsResponse.json();
      
      if (metricsResult.metrics && Array.isArray(metricsResult.metrics)) {
        console.log(`Refreshed ${metricsResult.metrics.length} metrics for user ${userId}`);
        
        // Ensure metrics have correct types
        const typedMetrics = metricsResult.metrics.map((m: {
          userId: string;
          sessionId: string;
          accuracy: number | string;
          wpm: number | string;
          endTime: string;
          timestamp: number | string;
          rawMetrics: any;
        }) => ({
          ...m,
          accuracy: typeof m.accuracy === 'string' ? parseFloat(m.accuracy) : m.accuracy,
          wpm: typeof m.wpm === 'string' ? parseFloat(m.wpm) : m.wpm,
          timestamp: typeof m.timestamp === 'string' ? parseInt(m.timestamp) : m.timestamp
        }));
        
        setMetricsData(typedMetrics);
        
        // Check if current session is now in the data
        const currentSessionId = sessionData.metadata.sessionId;
        const sessionExists = typedMetrics.some(m => m.sessionId === currentSessionId);
        
        if (sessionExists) {
          console.log('Current session found in refreshed metrics data!');
          setWaitingForCurrentSession(false);
        } else if (waitingForCurrentSession) {
          console.log('Current session still not in metrics data, will try again later');
          
          // Schedule another refresh attempt if still waiting
          setTimeout(() => {
            refreshMetricsData();
          }, 15000); // Try again after 15 seconds
        }
      }
    } catch (error) {
      console.error('Error refreshing metrics data:', error);
    }
  };
  
  return (
    <div 
      className="w-full max-w-3xl mx-auto mt-8 p-6 rounded-lg"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)'
      }}
    >
      {/* Only show demo banner in demo mode */}
      {showDemo && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
          <p className="text-sm font-medium">🔍 Demo Mode: Showing visualization with sample inconsistent keys data:</p>
          {/* Commenting out the demo inconsistent keys reference that's not defined
          <pre className="mt-2 text-xs overflow-x-auto">
            {JSON.stringify(DEMO_INCONSISTENT_KEYS, null, 2)}
          </pre>
          */}
          <button 
            onClick={() => setShowDemo(false)}
            className="mt-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Hide Demo Banner
          </button>
        </div>
      )}
      
      {/* Auto-validation status */}
      {!showDemo && validationStatus.isLoading && (
        <div className="mb-4 p-3 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Validating session data with Foundry...</span>
          </div>
        </div>
      )}
      
      {!showDemo && validationStatus.result && validationStatus.result.error && !isLoading && (
        <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
          <p className="font-medium">Failed to validate data with Foundry</p>
          <p className="mt-1 text-sm">{validationStatus.result.message}</p>
          <button 
            onClick={() => { setValidationStatus({isLoading: false, result: null}); }}
            className="mt-2 px-3 py-1 text-sm bg-red-200 dark:bg-red-800 rounded hover:bg-red-300 dark:hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Only show foundry match success banner when not in demo mode AND we have a match */}
      {!showDemo && matchedKeystrokeData && sessionData && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
          <p className="text-sm font-medium">✅ Using real data from Palantir Foundry for this session</p>
          <div className="mt-2 text-xs">
            <div>Session ID: <span className="font-mono">{matchedKeystrokeData.sessionId || 'N/A'}</span></div>
            <div>User ID: <span className="font-mono">{matchedKeystrokeData.userId || 'N/A'}</span></div>
          </div>
        </div>
      )}
      
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
          
          {/* Inconsistent Keys Section - only show when we have appropriate data */}
          {shouldShowInconsistentKeys() && inconsistentKeysToShow && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Inconsistent Typing Keys</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Keys with high variation in typing speed. Lower your delay variation for more consistent typing.
                {foundryKeystrokeData && foundryKeystrokeData.length > 0 && noMatchFound && foundryDataFetchComplete && (
                  <span className="block mt-1 text-yellow-600 dark:text-yellow-400 italic">
                    Note: Showing sample data while your session processes. Check back in a few minutes for your actual data.
                  </span>
                )}
              </p>
              <div className="relative overflow-hidden rounded-lg p-4" style={{ backgroundColor: 'var(--secondary)' }}>
                <InconsistentKeysVisualization inconsistentKeys={inconsistentKeysToShow} />
              </div>
            </div>
          )}
          
          {/* Performance Timeseries Chart - new section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Performance Over Time</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Track your typing speed (WPM) and accuracy progression across sessions.
            </p>
            
            {/* Wrap this section in a div with debugging */}
            <div className="relative" onClick={() => console.log('Performance section clicked - current metricsData:', metricsData)}>
              {isLoading && !metricsData.length ? (
                <div className="flex justify-center items-center h-[250px]" style={{ backgroundColor: 'var(--secondary)' }}>
                  <div className="flex flex-col items-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
                    <p className="text-sm opacity-70">Loading metrics data... (attempt {retryCount + 1}/{maxRetries})</p>
                    {loadingError && <p className="mt-2 text-sm text-center">{loadingError}</p>}
                  </div>
                </div>
              ) : loadingError && !metricsData.length ? (
                <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg">
                  <p className="text-sm">{loadingError}</p>
                  <button 
                    onClick={() => { setRetryCount(0); }}
                    className="mt-2 px-3 py-1 text-xs bg-red-200 dark:bg-red-800 rounded"
                  >
                    Try Again
                  </button>
                </div>
              ) : metricsData.length >= 2 && !showDemo ? (
                <div className="relative overflow-hidden rounded-lg p-4" style={{ backgroundColor: 'var(--secondary)' }}>
                  {waitingForCurrentSession && (
                    <div className="absolute top-2 right-2 text-xs text-yellow-500 dark:text-yellow-400 flex items-center">
                      <span className="animate-pulse mr-1">●</span>
                      Waiting for latest data...
                    </div>
                  )}
                  <PerformanceTimeseries 
                    metrics={metricsData}
                    currentSessionId={sessionData?.metadata.sessionId}
                  />
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm opacity-70">
                    {metricsData.length === 0 
                      ? "No performance history available yet. Using demo user ID (user-0d023529) for this demo version." 
                      : metricsData.length === 1
                        ? "Need more typing tests to show performance trends (at least 2 required)." 
                        : "Waiting for data to finish loading..."}
                  </p>
                  <div className="mt-2 text-xs">Debug: {metricsData.length} metrics available</div>
                  
                  {/* Debug button to inspect metricsData */}
                  <button
                    onClick={() => {
                      console.log('Current metricsData:', metricsData);
                      if (metricsData.length > 0) {
                        console.log('First metric:', metricsData[0]);
                        console.log('metrics types:', {
                          accuracy: typeof metricsData[0].accuracy,
                          wpm: typeof metricsData[0].wpm,
                          timestamp: typeof metricsData[0].timestamp
                        });
                      }
                      alert(`Debug: Found ${metricsData.length} metrics. Check console for details.`);
                    }}
                    className="mt-2 px-3 py-1 text-xs rounded-md bg-gray-300 dark:bg-gray-700"
                  >
                    Debug: Check Metrics
                  </button>
                  
                  {!isLoading && retryCount >= maxRetries - 1 && (
                    <button 
                      onClick={() => { 
                        setRetryCount(0);
                        setMatchFound(false);
                        setFoundryDataFetchComplete(false);
                      }}
                      className="mt-3 px-3 py-1 text-xs rounded-md"
                      style={{ 
                        backgroundColor: 'var(--primary)',
                        color: 'var(--background)'
                      }}
                    >
                      Reload Foundry Data
                    </button>
                  )}
                </div>
              )}
            </div>
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
              
              {shouldShowInconsistentKeys() && inconsistentKeysToShow && (
                <>
                  <div>Most Inconsistent Key:</div>
                  <div>
                    {(() => {
                      const [key, value] = Object.entries(inconsistentKeysToShow)
                        .sort((a, b) => b[1] - a[1])[0];
                      return (
                        <span>
                          <span className="font-mono px-1 py-0.5 bg-primary/20 rounded">{key}</span> ({Math.round(value)} ms)
                        </span>
                      );
                    })()}
                  </div>
                </>
              )}
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
          
          {matchedKeystrokeData && (
            <>
              <p className="mt-4 mb-2 text-sm">Foundry HighVarianceKeystrokesData data:</p>
              <div 
                className="font-mono text-xs p-4 rounded overflow-auto max-h-96"
                style={{ backgroundColor: 'var(--input-bg)' }}
              >
                <pre>{JSON.stringify(matchedKeystrokeData, null, 2)}</pre>
              </div>
            </>
          )}
          
          <div className="mt-4 flex justify-end space-x-3">
            <button
              className="px-3 py-1 rounded-md text-sm font-medium"
              style={{ 
                backgroundColor: 'var(--secondary)',
                color: 'var(--foreground)'
              }}
              onClick={() => {
                // Copy the JSON to clipboard
                navigator.clipboard.writeText(JSON.stringify(sessionData, null, 2))
                  .then(() => {
                    // Optional: Show feedback that it was copied
                    alert('JSON copied to clipboard!');
                  })
                  .catch((error: Error) => {
                    console.error('Failed to copy JSON:', error);
                    alert('Failed to copy. Please try again.');
                  });
              }}
            >
              Copy JSON
            </button>
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
          
          {/* Display Foundry Data */}
          {!showDemo && (
            <div>
              <h3 className="text-lg font-medium mb-2">Foundry Integration</h3>
              
              {isLoading && (
                <div className="flex items-center mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <p className="text-sm font-medium">
                    {loadingError ? loadingError : 'Fetching high variance keystroke data from Palantir Foundry...'}
                  </p>
                </div>
              )}
              
              {/* Foundry Data Match Banner */}
              {!showDemo && matchedKeystrokeData && sessionData && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <p className="text-sm font-medium">✅ Using real data from Palantir Foundry for this session</p>
                  <div className="mt-2 text-xs">
                    <div>Session ID: <span className="font-mono">{matchedKeystrokeData.sessionId || 'N/A'}</span></div>
                    <div>User ID: <span className="font-mono">{matchedKeystrokeData.userId || 'N/A'}</span></div>
                  </div>
                </div>
              )}
              
              {/* Raw Foundry Data Display */}
              {matchedKeystrokeData && (
                <>
                  <p className="mt-4 mb-2 text-sm">Foundry HighVarianceKeystrokesData data:</p>
                  <div 
                    className="font-mono text-xs p-4 rounded overflow-auto max-h-96"
                    style={{ backgroundColor: 'var(--input-bg)' }}
                  >
                    <pre>{JSON.stringify(matchedKeystrokeData, null, 2)}</pre>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Palantir Foundry Integration */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-2">Palantir Foundry Integration</h3>
            <p className="text-sm mb-4">Send this typing session data to Palantir Foundry for analysis.</p>
            <FoundryIntegration sessionData={sessionData} />
          </div>
        </div>
      )}
      
      {/* Loading indicator - show during all 3 retry attempts */}
      {isLoading && (
        <div className="my-4 p-3 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading stats from Foundry... (attempt {retryCount + 1}/{maxRetries})</span>
          </div>
          {loadingError && <p className="mt-2 text-sm">{loadingError}</p>}
        </div>
      )}
      
      {/* Error message shown when loading fails after all retries */}
      {!isLoading && loadingError && retryCount >= maxRetries - 1 && foundryDataFetchComplete && (
        <div className="my-4 p-3 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
          <p>{loadingError}</p>
          <button 
            onClick={() => { setRetryCount(0); }}
            className="mt-2 px-3 py-1 text-sm bg-red-200 dark:bg-red-800 rounded hover:bg-red-300 dark:hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* No match found alert - only shown after all retries are exhausted */}
      {!isLoading && !loadingError && noMatchFound && foundryDataFetchComplete && foundryKeystrokeData && foundryKeystrokeData.length > 0 && (
        <div className="my-4 p-3 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
          <div className="flex items-start">
            <svg className="h-5 w-5 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium">Session data is processing</p>
              <p className="mt-1 text-sm">Your typing data has been sent to Foundry, but may still be processing. We'll show your data when it's available.</p>
              <ul className="mt-1 text-sm list-disc list-inside pl-2">
                <li>Foundry typically takes 2-5 minutes to process session data</li>
                <li>We've tried checking for your data {maxRetries} times (total wait: {(maxRetries*retryInterval/1000/60).toFixed(1)} minutes)</li>
                {retryCount < maxRetries && (
                  <li className="text-blue-700 dark:text-blue-300">
                    Next retry in {Math.floor(retryInterval/1000)} seconds (attempt {retryCount + 1}/{maxRetries})
                  </li>
                )}
                <li>You can try refreshing the page or use the debug tools below</li>
              </ul>
              <div className="mt-3 flex space-x-3">
                <button 
                  onClick={() => { 
                    setRetryCount(0);
                    setMatchFound(false);
                    setFoundryDataFetchComplete(false);
                  }}
                  className="px-3 py-1 text-sm font-medium rounded-md"
                  style={{ 
                    backgroundColor: 'var(--primary)',
                    color: 'var(--background)'
                  }}
                >
                  Reload Foundry Data
                </button>
                <button
                  onClick={() => { setActiveTab('raw'); }}
                  className="px-3 py-1 text-sm rounded-md"
                  style={{ 
                    backgroundColor: 'var(--secondary)',
                    color: 'var(--foreground)'
                  }}
                >
                  View Session Details
                </button>
              </div>
              
              {/* Debug buttons */}
              <div className="mt-2 flex space-x-3">
                <button 
                  onClick={debugCheckSessions}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
                >
                  Debug: Check Sessions
                </button>
                <button 
                  onClick={debugCheckUserIds}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
                >
                  Debug: Check User IDs
                </button>
                <button 
                  onClick={debugForceRefresh}
                  className="px-3 py-1 text-xs bg-red-200 dark:bg-red-700 rounded"
                >
                  Debug: Force API Refresh
                </button>
              </div>
              
              <div className="mt-2 text-xs">
                <p>Your Session ID: <span className="font-mono">{sessionData?.metadata.sessionId}</span></p>
                <p>Found {foundryKeystrokeData.length} non-matching records in Foundry</p>
                <details>
                  <summary>All Session IDs (click to expand)</summary>
                  <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
                    {foundryKeystrokeData.map((data, i) => (
                      <div key={i} className={data.sessionId === sessionData?.metadata.sessionId ? 'text-green-600 dark:text-green-400 font-bold' : ''}>
                        {i+1}. {data.sessionId}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 