'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { TypingSessionData } from '../lib/types';
import FoundryIntegration from './FoundryIntegration';

interface TypingStatsProps {
  sessionData: TypingSessionData | null;
}

// Define HighAvailabilityStats interface
interface HighAvailabilityStats {
  metrics: string;
  metadata: string;
  highStdKeysOutput: string;
  keystrokesStat: string;
  keystrokes: string;
  __apiName: string;
  __rid: string;
  __primaryKey: string;
  __title: string;
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

// Component to visualize performance (WPM & Accuracy) over time
function PerformanceLineChart({ performanceData, latestSessionData }: { 
  performanceData: Array<{metrics: string, metadata: string}>,
  latestSessionData: HighAvailabilityStats
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
    
    // Process the data
    const processedData = performanceData.map(item => {
      const metrics = JSON.parse(item.metrics);
      const metadata = JSON.parse(item.metadata);
      return {
        wpm: metrics.wpm,
        accuracy: metrics.accuracy,
        timestamp: metadata.endTime || metadata.startTime
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
    
    // Add current session if not already included
    const latestMetrics = JSON.parse(latestSessionData.metrics);
    const latestMetadata = JSON.parse(latestSessionData.metadata);
    const latestTimestamp = latestMetadata.endTime || latestMetadata.startTime;
    
    const isLatestIncluded = processedData.some(d => Math.abs(d.timestamp - latestTimestamp) < 1000);
    
    if (!isLatestIncluded) {
      processedData.push({
        wpm: latestMetrics.wpm,
        accuracy: latestMetrics.accuracy,
        timestamp: latestTimestamp
      });
    }
    
    // Make sure we have data to display
    if (processedData.length === 0) return;
    
    // Special case for only one data point - duplicate it with a slightly different timestamp
    // This allows us to draw a line even with just one real data point
    if (processedData.length === 1) {
      // Create a synthetic data point 1 day before the real one
      const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
      const syntheticPoint = {
        ...processedData[0],
        timestamp: processedData[0].timestamp - oneDay
      };
      
      // Add a note that this is placeholder data
      ctx.fillStyle = 'var(--foreground)';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Only one session available', canvas.width / 2, 20);
      
      // Add the synthetic point at the beginning
      processedData.unshift(syntheticPoint);
    }
    
    // Calculate bounds
    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;
    
    // Determine min/max values with safeguards for identical values
    const wpmValues = processedData.map(d => d.wpm);
    const maxWpm = Math.max(...wpmValues) * 1.1; // Add 10% for padding
    const minWpm = Math.min(...wpmValues) > 0 ? Math.min(...wpmValues) * 0.9 : 0; // Subtract 10% for padding, floor at 0
    
    const accuracyValues = processedData.map(d => d.accuracy);
    const maxAccuracy = Math.min(100, Math.max(...accuracyValues) * 1.05); // Add 5% for padding, cap at 100%
    const minAccuracy = Math.max(0, Math.min(...accuracyValues) > 0 ? Math.min(...accuracyValues) * 0.95 : 0); // Subtract 5% for padding, floor at 0
    
    // Handle edge case of identical values
    const wpmRange = maxWpm - minWpm;
    const accuracyRange = maxAccuracy - minAccuracy;
    
    // If all values are identical, add a small range
    const effectiveWpmRange = wpmRange < 0.001 ? maxWpm * 0.2 : wpmRange;
    const effectiveAccuracyRange = accuracyRange < 0.001 ? maxAccuracy * 0.2 : accuracyRange;
    
    // Draw background
    ctx.fillStyle = 'rgba(240, 240, 250, 0.05)';
    ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);
    
    // Helper function to convert data point to coordinates
    const dataToWpmCoord = (wpm: number, index: number) => {
      const x = padding.left + (index / (processedData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((wpm - minWpm) / effectiveWpmRange) * chartHeight;
      return { x, y };
    };
    
    const dataToAccuracyCoord = (accuracy: number, index: number) => {
      const x = padding.left + (index / (processedData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((accuracy - minAccuracy) / effectiveAccuracyRange) * chartHeight;
      return { x, y };
    };
    
    // Draw title
    ctx.fillStyle = 'var(--foreground)';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Typing Performance Trends', canvas.width / 2, 20);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.15)';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    const numVerticalLines = Math.min(processedData.length, 6);
    for (let i = 0; i < numVerticalLines; i++) {
      const x = padding.left + (chartWidth / (numVerticalLines - 1)) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    const numHorizontalLines = 5;
    for (let i = 0; i <= numHorizontalLines; i++) {
      const y = padding.top + (chartHeight / numHorizontalLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      
      // WPM labels on y-axis
      const wpmValue = maxWpm - (i / numHorizontalLines) * effectiveWpmRange;
      ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(wpmValue).toString() + ' wpm', padding.left - 5, y + 3);
    }
    
    // Create WPM area gradient
    const wpmGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    wpmGradient.addColorStop(0, 'rgba(255, 20, 147, 0.3)'); // DeepPink with alpha
    wpmGradient.addColorStop(1, 'rgba(255, 20, 147, 0.05)');
    
    // Create Accuracy area gradient
    const accuracyGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    accuracyGradient.addColorStop(0, 'rgba(70, 130, 180, 0.3)'); // SteelBlue with alpha
    accuracyGradient.addColorStop(1, 'rgba(70, 130, 180, 0.05)');
    
    // Get control points for bezier curves
    const getBezierControlPoints = (points: Array<{x: number, y: number}>) => {
      if (points.length < 3) return null;
      
      const result = [];
      
      for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        // Calculate control points for smooth curve
        const controlPoint1 = {
          x: curr.x - (curr.x - prev.x) * 0.5,
          y: curr.y - (curr.y - prev.y) * 0.5
        };
        
        const controlPoint2 = {
          x: curr.x + (next.x - curr.x) * 0.5,
          y: curr.y + (next.y - curr.y) * 0.5
        };
        
        result.push([controlPoint1, controlPoint2]);
      }
      
      return result;
    };
    
    // Get points for WPM line
    const wpmPoints = processedData.map((d, i) => dataToWpmCoord(d.wpm, i));
    const wpmControlPoints = getBezierControlPoints(wpmPoints);
    
    // Get points for Accuracy line
    const accuracyPoints = processedData.map((d, i) => dataToAccuracyCoord(d.accuracy, i));
    const accuracyControlPoints = getBezierControlPoints(accuracyPoints);
    
    // Draw WPM area
    ctx.beginPath();
    ctx.moveTo(wpmPoints[0].x, padding.top + chartHeight); // Start at the bottom
    ctx.lineTo(wpmPoints[0].x, wpmPoints[0].y); // Up to first point
    
    // Draw smooth curves for WPM area
    if (wpmControlPoints && wpmPoints.length > 2) {
      for (let i = 0; i < wpmPoints.length - 2; i++) {
        const [c1, c2] = wpmControlPoints[i];
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, wpmPoints[i+1].x, wpmPoints[i+1].y);
      }
      // Last segment
      ctx.lineTo(wpmPoints[wpmPoints.length-1].x, wpmPoints[wpmPoints.length-1].y);
    } else {
      // Fallback to straight lines
      for (let i = 1; i < wpmPoints.length; i++) {
        ctx.lineTo(wpmPoints[i].x, wpmPoints[i].y);
      }
    }
    
    // Complete the area
    ctx.lineTo(wpmPoints[wpmPoints.length-1].x, padding.top + chartHeight);
    ctx.closePath();
    
    // Fill the WPM area
    ctx.fillStyle = wpmGradient;
    ctx.fill();
    
    // Draw Accuracy area
    ctx.beginPath();
    ctx.moveTo(accuracyPoints[0].x, padding.top + chartHeight); // Start at the bottom
    ctx.lineTo(accuracyPoints[0].x, accuracyPoints[0].y); // Up to first point
    
    // Draw smooth curves for Accuracy area
    if (accuracyControlPoints && accuracyPoints.length > 2) {
      for (let i = 0; i < accuracyPoints.length - 2; i++) {
        const [c1, c2] = accuracyControlPoints[i];
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, accuracyPoints[i+1].x, accuracyPoints[i+1].y);
      }
      // Last segment
      ctx.lineTo(accuracyPoints[accuracyPoints.length-1].x, accuracyPoints[accuracyPoints.length-1].y);
    } else {
      // Fallback to straight lines
      for (let i = 1; i < accuracyPoints.length; i++) {
        ctx.lineTo(accuracyPoints[i].x, accuracyPoints[i].y);
      }
    }
    
    // Complete the area
    ctx.lineTo(accuracyPoints[accuracyPoints.length-1].x, padding.top + chartHeight);
    ctx.closePath();
    
    // Fill the Accuracy area
    ctx.fillStyle = accuracyGradient;
    ctx.fill();
    
    // Draw WPM line
    ctx.strokeStyle = 'rgba(255, 20, 147, 0.8)'; // DeepPink
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    
    // Draw smooth curves for WPM line
    ctx.moveTo(wpmPoints[0].x, wpmPoints[0].y);
    
    if (wpmControlPoints && wpmPoints.length > 2) {
      for (let i = 0; i < wpmPoints.length - 2; i++) {
        const [c1, c2] = wpmControlPoints[i];
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, wpmPoints[i+1].x, wpmPoints[i+1].y);
      }
      // Last segment
      ctx.lineTo(wpmPoints[wpmPoints.length-1].x, wpmPoints[wpmPoints.length-1].y);
    } else {
      // Fallback to straight lines
      for (let i = 1; i < wpmPoints.length; i++) {
        ctx.lineTo(wpmPoints[i].x, wpmPoints[i].y);
      }
    }
    
    ctx.stroke();
    
    // Draw Accuracy line
    ctx.strokeStyle = 'rgba(70, 130, 180, 0.8)'; // SteelBlue
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    
    // Draw smooth curves for Accuracy line
    ctx.moveTo(accuracyPoints[0].x, accuracyPoints[0].y);
    
    if (accuracyControlPoints && accuracyPoints.length > 2) {
      for (let i = 0; i < accuracyPoints.length - 2; i++) {
        const [c1, c2] = accuracyControlPoints[i];
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, accuracyPoints[i+1].x, accuracyPoints[i+1].y);
      }
      // Last segment
      ctx.lineTo(accuracyPoints[accuracyPoints.length-1].x, accuracyPoints[accuracyPoints.length-1].y);
    } else {
      // Fallback to straight lines
      for (let i = 1; i < accuracyPoints.length; i++) {
        ctx.lineTo(accuracyPoints[i].x, accuracyPoints[i].y);
      }
    }
    
    ctx.stroke();
    
    // Draw WPM dots and labels
    processedData.forEach((d, i) => {
      // Skip the synthetic point if we only have one real data point
      if (processedData.length === 2 && i === 0 && Math.abs(processedData[0].timestamp - processedData[1].timestamp) > 1000*60*60*24) return;
      
      const { x, y } = dataToWpmCoord(d.wpm, i);
      
      // Custom dot appearance
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 6);
      gradient.addColorStop(0, 'rgba(255, 20, 147, 1)');
      gradient.addColorStop(1, 'rgba(255, 20, 147, 0.5)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add white outer ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw WPM value in small bubble above point
      const wpmValue = Math.round(d.wpm);
      const textWidth = ctx.measureText(wpmValue.toString()).width;
      
      // Draw bubble background
      ctx.fillStyle = 'rgba(255, 20, 147, 0.7)';
      const bubblePadding = 4;
      const bubbleWidth = textWidth + bubblePadding * 2;
      const bubbleHeight = 16;
      const bubbleY = y - 22;
      
      ctx.beginPath();
      ctx.roundRect(x - bubbleWidth/2, bubbleY, bubbleWidth, bubbleHeight, 4);
      ctx.fill();
      
      // Draw text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(wpmValue.toString(), x, bubbleY + 11);
    });
    
    // Draw Accuracy dots and labels
    processedData.forEach((d, i) => {
      // Skip the synthetic point if we only have one real data point
      if (processedData.length === 2 && i === 0 && Math.abs(processedData[0].timestamp - processedData[1].timestamp) > 1000*60*60*24) return;
      
      const { x, y } = dataToAccuracyCoord(d.accuracy, i);
      
      // Custom dot appearance
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 6);
      gradient.addColorStop(0, 'rgba(70, 130, 180, 1)');
      gradient.addColorStop(1, 'rgba(70, 130, 180, 0.5)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add white outer ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw Accuracy value in small bubble below point
      const accuracyValue = Math.round(d.accuracy);
      const textWidth = ctx.measureText(accuracyValue.toString() + '%').width;
      
      // Draw bubble background
      ctx.fillStyle = 'rgba(70, 130, 180, 0.7)';
      const bubblePadding = 4;
      const bubbleWidth = textWidth + bubblePadding * 2;
      const bubbleHeight = 16;
      const bubbleY = y + 10;
      
      ctx.beginPath();
      ctx.roundRect(x - bubbleWidth/2, bubbleY, bubbleWidth, bubbleHeight, 4);
      ctx.fill();
      
      // Draw text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(accuracyValue.toString() + '%', x, bubbleY + 11);
    });
    
    // Draw legend
    const legendX = padding.left;
    const legendY = padding.top - 15;
    
    // WPM legend
    const wpmGradientLegend = ctx.createLinearGradient(legendX, legendY, legendX + 15, legendY);
    wpmGradientLegend.addColorStop(0, 'rgba(255, 20, 147, 1)');
    wpmGradientLegend.addColorStop(1, 'rgba(255, 100, 170, 1)');
    
    ctx.fillStyle = wpmGradientLegend;
    ctx.beginPath();
    ctx.roundRect(legendX, legendY - 5, 15, 10, 3);
    ctx.fill();
    
    ctx.fillStyle = 'var(--foreground)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WPM', legendX + 20, legendY + 2);
    
    // Accuracy legend
    const accuracyGradientLegend = ctx.createLinearGradient(legendX + 80, legendY, legendX + 95, legendY);
    accuracyGradientLegend.addColorStop(0, 'rgba(70, 130, 180, 1)');
    accuracyGradientLegend.addColorStop(1, 'rgba(100, 160, 210, 1)');
    
    ctx.fillStyle = accuracyGradientLegend;
    ctx.beginPath();
    ctx.roundRect(legendX + 80, legendY - 5, 15, 10, 3);
    ctx.fill();
    
    ctx.fillStyle = 'var(--foreground)';
    ctx.fillText('Accuracy', legendX + 100, legendY + 2);
    
    // Draw time labels
    // If we have multiple sessions, show real dates
    if (processedData.length > 2 || (processedData.length === 2 && Math.abs(processedData[0].timestamp - processedData[1].timestamp) > 1000 * 60 * 60)) {
      const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + 
               ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };
      
      // Only show first and last timestamps if they're meaningful
      // Skip the synthetic point if we only have one real data point
      const startIdx = processedData.length === 2 && Math.abs(processedData[0].timestamp - processedData[1].timestamp) > 1000*60*60*24 ? 1 : 0;
      const firstTimestamp = processedData[startIdx].timestamp;
      const lastTimestamp = processedData[processedData.length - 1].timestamp;
      
      ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
      ctx.font = '10px system-ui, sans-serif';
      
      // Only show both timestamps if they're different
      if (Math.abs(firstTimestamp - lastTimestamp) > 1000 * 60) { // more than a minute apart
        ctx.textAlign = 'left';
        ctx.fillText(formatDate(firstTimestamp), padding.left, padding.top + chartHeight + 20);
        
        ctx.textAlign = 'right';
        ctx.fillText(formatDate(lastTimestamp), padding.left + chartWidth, padding.top + chartHeight + 20);
      } else {
        // If only one real point or identical timestamps, show just the one
        ctx.textAlign = 'center';
        ctx.fillText(formatDate(lastTimestamp), padding.left + chartWidth/2, padding.top + chartHeight + 20);
      }
    }
    
  }, [performanceData, latestSessionData]);

  // Calculate how many real, different sessions we have
  const uniqueSessionCount = useMemo(() => {
    const uniqueTimestamps = new Set();
    
    performanceData.forEach(item => {
      const metadata = JSON.parse(item.metadata);
      const timestamp = metadata.endTime || metadata.startTime;
      uniqueTimestamps.add(Math.floor(timestamp / 1000)); // Round to the nearest second
    });
    
    const latestMetadata = JSON.parse(latestSessionData.metadata);
    const latestTimestamp = latestMetadata.endTime || latestMetadata.startTime;
    uniqueTimestamps.add(Math.floor(latestTimestamp / 1000));
    
    return uniqueTimestamps.size;
  }, [performanceData, latestSessionData]);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="w-full h-[250px]"
      />
      <div className="mt-2 text-xs text-center text-opacity-70">
        {uniqueSessionCount > 1 
          ? `Showing performance trends across ${uniqueSessionCount} sessions` 
          : 'Only one session available - more data will be visible as you complete more typing sessions'}
      </div>
    </>
  );
}

export default function TypingStats({ sessionData: initialSessionData }: TypingStatsProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'raw'>('summary');
  const [showDemo, setShowDemo] = useState(false);
  const [foundryStats, setFoundryStats] = useState<HighAvailabilityStats[] | null>(null);
  const [matchedStats, setMatchedStats] = useState<HighAvailabilityStats | null>(null);
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
  const maxRetries = 3;
  const retryInterval = 15000; // 15 seconds
  
  // Auto validate/send data to Foundry when session data is available - only run once
  useEffect(() => {
    if (!sessionData || showDemo || validationStatus.isLoading || validationStatus.result) return;
    
    // Import the function dynamically to avoid import issues
    const validateAndSendData = async () => {
      try {
        setValidationStatus(prev => ({ ...prev, isLoading: true }));
        console.log('Automatically validating and sending data to Foundry...');
        
        // Dynamically import the function
        const { previewSendToFoundry } = await import('../lib/sendDataToFoundry');
        const response = await previewSendToFoundry(sessionData);
        
        console.log('Auto-validation response:', response);
        setValidationStatus({ isLoading: false, result: response });
        
        // If validation was successful, start fetching stats
        if (response && !response.error) {
          console.log('Validation successful, fetching Foundry stats...');
          // Give a small delay to allow data to propagate
          setTimeout(() => {
            setRetryCount(0); // Trigger the fetch
          }, 1000);
        }
      } catch (error) {
        console.error('Error in auto-validation:', error);
        setValidationStatus({ 
          isLoading: false, 
          result: { 
            success: false, 
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            error: error instanceof Error ? error.stack : String(error)
          }
        });
      }
    };
    
    // If we have real session data (not demo), auto-validate it
    validateAndSendData();
  }, [sessionData, showDemo, validationStatus.isLoading, validationStatus.result]);
  
  // Fetch Foundry stats
  useEffect(() => {
    // Don't attempt to fetch if there's no session data
    if (!sessionData) return;
    
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;
    
    async function fetchFoundryStats() {
      if (!isMounted) return;
      
      try {
        setIsLoading(true);
        setLoadingError(null);
        setNoMatchFound(false);
        setFoundryDataFetchComplete(false);
        
        console.log(`Foundry fetch attempt ${retryCount + 1}/${maxRetries}...`);
        
        // This would be replaced with your actual API endpoint
        const response = await fetch('/api/foundry/stats');
        
        if (!isMounted) return;
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!isMounted) return;
        
        setFoundryStats(data);
        
        // Don't reset isLoading here - we need to try matching first
        
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error fetching Foundry stats:', error);
        
        if (retryCount < maxRetries - 1) {
          setLoadingError(`Fetch attempt ${retryCount + 1}/${maxRetries} failed. Retrying in 15 seconds...`);
          timeoutId = setTimeout(() => {
            if (isMounted) {
              setRetryCount(prev => prev + 1);
            }
          }, retryInterval);
        } else {
          setLoadingError(`Failed to fetch stats after ${maxRetries} attempts. Please try again later.`);
          setIsLoading(false);
          setFoundryDataFetchComplete(true);
        }
      }
    }
    
    fetchFoundryStats();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [retryCount, sessionData]);

  // Match Foundry stats with current session
  useEffect(() => {
    if (!sessionData || !foundryStats || !isLoading) return;
    
    try {
      console.log('Attempting to match Foundry stats with current session...');
      console.log('Local session ID:', sessionData.metadata.sessionId);
      console.log('Local start time:', new Date(sessionData.metadata.startTime).toISOString());
      console.log('Local end time:', sessionData.metadata.endTime ? new Date(sessionData.metadata.endTime).toISOString() : 'N/A');
      
      const timeTolerance = 5000; // 5 seconds tolerance instead of 1
      
      // Find the matching stats based on sessionId, startTime, and endTime
      const matched = foundryStats.find(stats => {
        const metadataObj = JSON.parse(stats.metadata);
        
        // Log each potential match for debugging
        console.log(`Checking Foundry stat with session ID: ${metadataObj.sessionId}`);
        
        const sessionIdMatch = metadataObj.sessionId === sessionData.metadata.sessionId;
        const startTimeMatch = Math.abs(metadataObj.startTime - sessionData.metadata.startTime) < timeTolerance;
        const endTimeMatch = !sessionData.metadata.endTime || 
                             Math.abs(metadataObj.endTime - sessionData.metadata.endTime) < timeTolerance;
        
        console.log(`- Session ID match: ${sessionIdMatch}`);
        console.log(`- Start time match: ${startTimeMatch} (diff: ${Math.abs(metadataObj.startTime - sessionData.metadata.startTime)}ms)`);
        console.log(`- End time match: ${endTimeMatch}`);
        
        return sessionIdMatch && startTimeMatch && endTimeMatch;
      });
      
      if (matched) {
        console.log('Found matching Foundry stat!');
        setMatchedStats(matched);
        setNoMatchFound(false);
        
        // Parse highStdKeysOutput and set as real inconsistent keys
        if (matched.highStdKeysOutput) {
          const keysOutput = JSON.parse(matched.highStdKeysOutput);
          setRealInconsistentKeys(keysOutput);
        }
        
        // Found a match, so reset retry count and end loading
        setRetryCount(0);
        setIsLoading(false);
        setFoundryDataFetchComplete(true);
      } else {
        console.warn('No matching Foundry stat found. Available stats:', 
          foundryStats.map(stat => {
            const meta = JSON.parse(stat.metadata);
            return {
              sessionId: meta.sessionId,
              startTime: new Date(meta.startTime).toISOString(),
              endTime: meta.endTime ? new Date(meta.endTime).toISOString() : 'N/A'
            };
          })
        );
        
        // If we've exhausted all retries, show the no match found message
        if (retryCount >= maxRetries - 1) {
          setNoMatchFound(true);
          setIsLoading(false);
          setFoundryDataFetchComplete(true);
        } else {
          // Otherwise, continue retrying
          console.log(`No match found. Will retry in 15 seconds (attempt ${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryInterval);
        }
      }
    } catch (error) {
      console.error('Error matching Foundry stats:', error);
      
      // If an error occurs during matching and we've exhausted retries, stop loading
      if (retryCount >= maxRetries - 1) {
        setIsLoading(false);
        setFoundryDataFetchComplete(true);
      }
    }
  }, [foundryStats, sessionData, retryCount, maxRetries, isLoading]);
  
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
            }
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
  
  // Determine which inconsistent keys to show - priority order:
  // 1. Real Foundry data if we have it
  // 2. Local inconsistent keys from session data if in normal mode
  // 3. Never show demo data
  const shouldShowInconsistentKeys = () => {
    if (showDemo) {
      return false; // Never show charts in demo mode
    } else if (realInconsistentKeys) {
      return true; // We have real Foundry data
    } else if (sessionData?.metrics?.inconsistentKeys && Object.keys(sessionData.metrics.inconsistentKeys).length > 0) {
      return true; // We have local inconsistent keys
    }
    return false;
  };
  
  const getInconsistentKeysToShow = () => {
    if (realInconsistentKeys) {
      return realInconsistentKeys; // Highest priority: real data from Foundry
    } else if (sessionData?.metrics?.inconsistentKeys) {
      return sessionData.metrics.inconsistentKeys; // Second priority: local data
    }
    return null;
  };
  
  const inconsistentKeysToShow = getInconsistentKeysToShow();
  
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
          <pre className="mt-2 text-xs overflow-x-auto">
            {JSON.stringify(DEMO_INCONSISTENT_KEYS, null, 2)}
          </pre>
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
      {!showDemo && matchedStats && sessionData && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
          <p className="text-sm font-medium">✅ Using real data from Palantir Foundry for this session</p>
          <div className="mt-2 text-xs">
            {(() => {
              // Parse metadata from matchedStats to display actual matched values
              const foundryMetadata = JSON.parse(matchedStats.metadata);
              
              // Calculate time differences
              const startTimeDiff = Math.abs(foundryMetadata.startTime - sessionData.metadata.startTime);
              const endTimeDiff = sessionData.metadata.endTime && foundryMetadata.endTime ? 
                Math.abs(foundryMetadata.endTime - sessionData.metadata.endTime) : null;
              
              // Check if there are significant differences
              const hasTimeDifferences = startTimeDiff > 500 || (endTimeDiff !== null && endTimeDiff > 500);
              
              return (
                <>
                  <div className="grid grid-cols-3 gap-y-1 mt-1">
                    <div className="font-medium">Field</div>
                    <div className="font-medium">Local Value</div>
                    <div className="font-medium">Matched Foundry Value</div>
                    
                    <div>Session ID:</div>
                    <div className="truncate">{sessionData.metadata.sessionId}</div>
                    <div className="truncate">{foundryMetadata.sessionId}</div>
                    
                    <div>Start Time:</div>
                    <div className={startTimeDiff > 500 ? "text-yellow-600 dark:text-yellow-400" : ""}>
                      {formatTime(sessionData.metadata.startTime)}
                    </div>
                    <div className={startTimeDiff > 500 ? "text-yellow-600 dark:text-yellow-400" : ""}>
                      {formatTime(foundryMetadata.startTime)}
                    </div>
                    
                    <div>End Time:</div>
                    <div className={endTimeDiff && endTimeDiff > 500 ? "text-yellow-600 dark:text-yellow-400" : ""}>
                      {sessionData.metadata.endTime ? formatTime(sessionData.metadata.endTime) : 'N/A'}
                    </div>
                    <div className={endTimeDiff && endTimeDiff > 500 ? "text-yellow-600 dark:text-yellow-400" : ""}>
                      {foundryMetadata.endTime ? formatTime(foundryMetadata.endTime) : 'N/A'}
                    </div>
                  </div>
                  
                  {hasTimeDifferences && (
                    <div className="mt-2 text-yellow-600 dark:text-yellow-400 text-xs">
                      <p>⚠️ Note: Some timestamps differ between local and Foundry data:</p>
                      {startTimeDiff > 500 && (
                        <p>- Start time difference: {(startTimeDiff / 1000).toFixed(2)} seconds</p>
                      )}
                      {endTimeDiff !== null && endTimeDiff > 500 && (
                        <p>- End time difference: {(endTimeDiff / 1000).toFixed(2)} seconds</p>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
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
              </p>
              <div className="relative overflow-hidden rounded-lg p-4" style={{ backgroundColor: 'var(--secondary)' }}>
                <InconsistentKeysVisualization inconsistentKeys={inconsistentKeysToShow} />
              </div>
            </div>
          )}
          
          {/* Performance Line Chart */}
          {matchedStats && foundryStats && foundryStats.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Performance Over Time</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Track your typing speed (WPM) and accuracy progress over multiple sessions.
              </p>
              <div className="relative overflow-hidden rounded-lg p-4" style={{ backgroundColor: 'var(--secondary)' }}>
                <PerformanceLineChart performanceData={foundryStats} latestSessionData={matchedStats} />
              </div>
            </div>
          )}
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
          
          {matchedStats && (
            <>
              <p className="mt-4 mb-2 text-sm">Foundry HighAvailabilityStats data:</p>
              <div 
                className="font-mono text-xs p-4 rounded overflow-auto max-h-96"
                style={{ backgroundColor: 'var(--input-bg)' }}
              >
                <pre>{JSON.stringify(matchedStats, null, 2)}</pre>
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
                  .catch(err => {
                    console.error('Failed to copy JSON:', err);
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
      {!isLoading && !loadingError && noMatchFound && foundryDataFetchComplete && foundryStats && foundryStats.length > 0 && (
        <div className="my-4 p-3 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
          <div className="flex items-start">
            <svg className="h-5 w-5 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium">No matching Foundry data found for this session</p>
              <p className="mt-1 text-sm">Your local session data doesn't match any records in Foundry. This could happen if:</p>
              <ul className="mt-1 text-sm list-disc list-inside pl-2">
                <li>Your session data hasn't been sent to Foundry yet</li>
                <li>The session ID or timestamps don't match</li>
                <li>There's a synchronization delay with Foundry</li>
              </ul>
              <div className="mt-3 flex space-x-3">
                <button 
                  onClick={() => { setRetryCount(0); }}
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
              <div className="mt-2 text-xs">
                <p>Your Session ID: <span className="font-mono">{sessionData?.metadata.sessionId}</span></p>
                <p>Found {foundryStats.length} non-matching records in Foundry</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 