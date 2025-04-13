/**
 * Typing Data Capture System - React Hook
 * 
 * This file provides a React hook for easily integrating the typing data
 * capture system with React components.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  initializeSession,
  recordKeystroke,
  finalizeSession,
  generateSessionData,
  saveSessionToLocalStorage
} from './dataCapture';
import type {
  KeystrokeData,
  SessionMetadata,
  TypingSessionData
} from './types';

/**
 * Custom hook for capturing typing data in a React component
 * @param textPrompt The text prompt for the typing test
 * @returns Object with functions and state for typing data capture
 */
export function useTypingData(textPrompt: string) {
  // Store session metadata
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata | null>(null);
  
  // Store keystroke data
  const [keystrokes, setKeystrokes] = useState<KeystrokeData[]>([]);
  
  // Store last keystroke timestamp for inter-key calculations
  const [lastKeystrokeTime, setLastKeystrokeTime] = useState<number | null>(null);
  
  // Session ID to retrieve from localStorage
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Store complete session data once finalized
  const [sessionData, setSessionData] = useState<TypingSessionData | null>(null);
  
  // Initialize session when the text prompt changes
  useEffect(() => {
    if (textPrompt) {
      const newSession = initializeSession(textPrompt);
      setSessionMetadata(newSession);
      setKeystrokes([]);
      setLastKeystrokeTime(null);
      setSessionData(null);
    }
  }, [textPrompt]);
  
  /**
   * Capture a keystroke event
   * @param key The key that was pressed
   * @param expectedKey The expected key at the current position
   * @param position Position in the text
   * @param actionType Type of key event
   */
  const captureKeystroke = useCallback((
    key: string,
    expectedKey: string | null,
    position: number,
    actionType: 'keydown' | 'keyup' | 'keypress'
  ) => {
    if (!sessionMetadata) return;
    
    const keystroke = recordKeystroke(
      key,
      expectedKey,
      position,
      actionType,
      lastKeystrokeTime
    );
    
    setKeystrokes(prevKeystrokes => [...prevKeystrokes, keystroke]);
    setLastKeystrokeTime(keystroke.timestamp);
  }, [sessionMetadata, lastKeystrokeTime]);
  
  /**
   * Complete the typing session
   * @param userTranscript Final text input by the user
   * @param completionStatus Status of the session
   */
  const completeSession = useCallback((
    userTranscript: string,
    completionStatus: 'completed' | 'abandoned'
  ) => {
    if (!sessionMetadata) return;
    
    const finalizedMetadata = finalizeSession(
      sessionMetadata,
      userTranscript,
      completionStatus
    );
    
    setSessionMetadata(finalizedMetadata);
    
    const fullSessionData = generateSessionData(
      finalizedMetadata,
      keystrokes
    );
    
    setSessionData(fullSessionData);
    saveSessionToLocalStorage(fullSessionData);
    setSessionId(fullSessionData.metadata.sessionId);
    
    return fullSessionData;
  }, [sessionMetadata, keystrokes]);
  
  // Automatically save session data to localStorage when it's available
  useEffect(() => {
    if (sessionData) {
      saveSessionToLocalStorage(sessionData);
    }
  }, [sessionData]);
  
  return {
    sessionMetadata,
    keystrokes,
    sessionData,
    sessionId,
    captureKeystroke,
    completeSession
  };
} 