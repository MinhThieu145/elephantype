/**
 * Typing Data Capture System - Core Functionality
 * 
 * This file contains utility functions for capturing, processing,
 * and analyzing typing test data.
 */

import { 
  KeystrokeData, 
  SessionMetadata, 
  TypingEnvironment, 
  TypingMetrics,
  TypingSessionData
} from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Captures environmental information about the current device
 * @returns TypingEnvironment object with device context
 */
export function captureEnvironmentInfo(): TypingEnvironment {
  // Get browser information
  const userAgent = navigator.userAgent;
  
  // Simple browser detection
  const getBrowserInfo = () => {
    const browsers = [
      { name: 'Edge', regex: /Edg\/([0-9]+)/ },
      { name: 'Chrome', regex: /Chrome\/([0-9]+)/ },
      { name: 'Firefox', regex: /Firefox\/([0-9]+)/ },
      { name: 'Safari', regex: /Safari\/([0-9]+)/ },
      { name: 'Opera', regex: /OPR\/([0-9]+)/ },
      { name: 'IE', regex: /Trident\/([0-9]+)/ }
    ];
    
    for (const browser of browsers) {
      const match = userAgent.match(browser.regex);
      if (match) {
        return {
          name: browser.name,
          version: match[1] || 'Unknown'
        };
      }
    }
    
    return {
      name: 'Unknown',
      version: 'Unknown'
    };
  };
  
  // Simple OS detection
  const getOSInfo = () => {
    const os = [
      { name: 'Windows', regex: /Windows NT ([0-9]+\.[0-9]+)/ },
      { name: 'macOS', regex: /Mac OS X ([0-9_]+)/ },
      { name: 'iOS', regex: /iPhone OS ([0-9_]+)/ },
      { name: 'Android', regex: /Android ([0-9\.]+)/ },
      { name: 'Linux', regex: /Linux/ }
    ];
    
    for (const system of os) {
      const match = userAgent.match(system.regex);
      if (match) {
        return system.name + (match[1] ? ' ' + match[1].replace(/_/g, '.') : '');
      }
    }
    
    return 'Unknown';
  };
  
  // Detect device type
  const getDeviceType = () => {
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(userAgent)) {
      return /iPad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  };
  
  // Basic keyboard layout detection (limited)
  const getKeyboardLayout = () => {
    // This is a simplification - accurate detection requires more complex logic
    const locale = navigator.language || 'en-US';
    if (locale.startsWith('fr')) return 'AZERTY';
    if (locale.startsWith('de')) return 'QWERTZ';
    return 'QWERTY'; // Default assumption
  };
  
  const browserInfo = getBrowserInfo();
  
  return {
    deviceType: getDeviceType(),
    browserName: browserInfo.name,
    browserVersion: browserInfo.version,
    operatingSystem: getOSInfo(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    keyboardLayout: getKeyboardLayout(),
    inputMethod: /touch/i.test(userAgent) ? 'touch screen' : 'physical keyboard'
  };
}

/**
 * Initializes a new typing session with metadata
 * @param textPrompt The text prompt for the typing test
 * @returns SessionMetadata object for the new session
 */
export function initializeSession(textPrompt: string): SessionMetadata {
  const startTime = Date.now();
  
  return {
    sessionId: uuidv4(),
    startTime,
    endTime: null,
    textPrompt,
    userTranscript: '',
    completionStatus: 'in-progress',
    duration: null,
    deviceInfo: captureEnvironmentInfo()
  };
}

/**
 * Records a keystroke event
 * @param key The key that was pressed
 * @param expectedKey The expected key at the current position
 * @param position Position in the text
 * @param actionType Type of key event
 * @param lastKeystrokeTime Time of the last keystroke (optional)
 * @returns KeystrokeData object with the keystroke information
 */
export function recordKeystroke(
  key: string,
  expectedKey: string | null,
  position: number,
  actionType: 'keydown' | 'keyup' | 'keypress',
  lastKeystrokeTime: number | null = null
): KeystrokeData {
  const timestamp = Date.now();
  
  return {
    id: uuidv4(),
    timestamp,
    key,
    expectedKey,
    isCorrect: key === expectedKey,
    position,
    actionType,
    interKeyDelay: lastKeystrokeTime ? timestamp - lastKeystrokeTime : null
  };
}

/**
 * Finalizes a typing session
 * @param sessionMetadata Current session metadata
 * @param userTranscript Final text input by the user
 * @param completionStatus Status of the session
 * @returns Updated SessionMetadata object
 */
export function finalizeSession(
  sessionMetadata: SessionMetadata,
  userTranscript: string,
  completionStatus: 'completed' | 'abandoned'
): SessionMetadata {
  const endTime = Date.now();
  
  return {
    ...sessionMetadata,
    endTime,
    userTranscript,
    completionStatus,
    duration: endTime - sessionMetadata.startTime
  };
}

/**
 * Calculates typing metrics from keystroke data
 * @param keystrokes Array of keystroke events
 * @param sessionMetadata Session metadata
 * @returns TypingMetrics object with calculated performance metrics
 */
export function calculateMetrics(
  keystrokes: KeystrokeData[],
  sessionMetadata: SessionMetadata
): TypingMetrics {
  // Filter to include only actual typing keystrokes (not control keys)
  const typingKeystrokes = keystrokes.filter(k => 
    k.actionType === 'keypress' && k.key.length === 1);
  
  // Calculate basic counts
  const totalKeystrokes = typingKeystrokes.length;
  const correctKeystrokes = typingKeystrokes.filter(k => k.isCorrect).length;
  const errorKeystrokes = totalKeystrokes - correctKeystrokes;
  
  // Calculate accuracy
  const accuracy = totalKeystrokes > 0 
    ? (correctKeystrokes / totalKeystrokes) * 100 
    : 0;
    
  // Calculate WPM
  const durationMinutes = sessionMetadata.duration 
    ? sessionMetadata.duration / (1000 * 60) 
    : 0;
  
  // Standard: 5 characters = 1 word
  const charCount = typingKeystrokes.length;
  const wpm = durationMinutes > 0 
    ? (charCount / 5) / durationMinutes 
    : 0;
  
  // Calculate error rate (errors per character)
  const errorRate = totalKeystrokes > 0 
    ? errorKeystrokes / totalKeystrokes 
    : 0;
  
  // Calculate typing consistency (standard deviation of inter-key intervals)
  const interKeyDelays = typingKeystrokes
    .filter(k => k.interKeyDelay !== null)
    .map(k => k.interKeyDelay as number);
  
  let consistency = 0;
  
  if (interKeyDelays.length > 1) {
    const mean = interKeyDelays.reduce((sum, delay) => sum + delay, 0) / interKeyDelays.length;
    const squaredDiffs = interKeyDelays.map(delay => Math.pow(delay - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / interKeyDelays.length;
    consistency = Math.sqrt(variance);
  }
  
  // Identify problem keys
  const problemKeys: Record<string, number> = {};
  
  typingKeystrokes.forEach(keystroke => {
    if (!keystroke.isCorrect && keystroke.key) {
      if (!problemKeys[keystroke.key]) {
        problemKeys[keystroke.key] = 0;
      }
      problemKeys[keystroke.key]++;
    }
  });
  
  return {
    wpm,
    accuracy,
    errorRate,
    totalKeystrokes,
    correctKeystrokes,
    errorKeystrokes,
    consistency,
    problemKeys
  };
}

/**
 * Generates a complete typing session data object
 * @param sessionMetadata Session metadata
 * @param keystrokes Array of keystroke events
 * @returns TypingSessionData object with complete session data
 */
export function generateSessionData(
  sessionMetadata: SessionMetadata,
  keystrokes: KeystrokeData[]
): TypingSessionData {
  const metrics = calculateMetrics(keystrokes, sessionMetadata);
  
  return {
    metadata: sessionMetadata,
    keystrokes,
    metrics
  };
}

/**
 * Exports typing session data as JSON
 * @param sessionData TypingSessionData object
 * @returns JSON string of the session data
 */
export function exportSessionData(sessionData: TypingSessionData): string {
  return JSON.stringify(sessionData, null, 2);
}

/**
 * Saves typing session data to localStorage
 * @param sessionData TypingSessionData object
 */
export function saveSessionToLocalStorage(sessionData: TypingSessionData): void {
  try {
    const key = `typing-session-${sessionData.metadata.sessionId}`;
    localStorage.setItem(key, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to save session data to localStorage:', error);
  }
}

/**
 * Retrieves typing session data from localStorage
 * @param sessionId ID of the session to retrieve
 * @returns TypingSessionData object or null if not found
 */
export function getSessionFromLocalStorage(sessionId: string): TypingSessionData | null {
  try {
    const key = `typing-session-${sessionId}`;
    const data = localStorage.getItem(key);
    
    if (data) {
      return JSON.parse(data) as TypingSessionData;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to retrieve session data from localStorage:', error);
    return null;
  }
} 