/**
 * Typing Data Capture System - Type Definitions
 * 
 * This file contains all the type definitions related to the data
 * capture system for the typing test application.
 */

/**
 * Represents a single keystroke event in a typing session
 */
export interface KeystrokeData {
  id: string;                 // Unique identifier for this keystroke
  timestamp: number;          // Milliseconds since epoch
  key: string;                // The character or key that was pressed
  expectedKey: string | null; // The expected character at this position
  isCorrect: boolean;         // Whether the keystroke matched the expected character
  position: number;           // Position in the text
  actionType: 'keydown' | 'keyup' | 'keypress'; // Type of keyboard event
  interKeyDelay: number | null; // Time since the last keystroke in ms (null for first keystroke)
}

/**
 * Represents environmental context for a typing session
 */
export interface TypingEnvironment {
  deviceType: string;         // 'desktop', 'mobile', 'tablet', etc.
  browserName: string;        // Browser name
  browserVersion: string;     // Browser version
  operatingSystem: string;    // OS name and version
  screenWidth: number;        // Screen width in pixels
  screenHeight: number;       // Screen height in pixels
  keyboardLayout: string;     // 'QWERTY', 'AZERTY', 'Dvorak', etc. (if available)
  inputMethod: string;        // 'physical keyboard', 'touch screen', etc.
}

/**
 * Represents overall session metadata
 */
export interface SessionMetadata {
  sessionId: string;          // Unique identifier for the session
  startTime: number;          // Session start time (milliseconds since epoch)
  endTime: number | null;     // Session end time (null if not completed)
  textPrompt: string;         // The original text prompt
  userTranscript: string;     // The final text input by the user
  completionStatus: 'completed' | 'abandoned' | 'in-progress'; // Status of the session
  duration: number | null;    // Total duration in milliseconds (null if not completed)
  deviceInfo: TypingEnvironment; // Environmental context
}

/**
 * Represents all data for a typing session
 */
export interface TypingSessionData {
  metadata: SessionMetadata;   // Session metadata
  keystrokes: KeystrokeData[]; // Array of all keystroke events
  metrics: TypingMetrics;      // Calculated performance metrics
}

/**
 * Represents performance metrics for a typing session
 */
export interface TypingMetrics {
  wpm: number;                // Words per minute
  accuracy: number;           // Accuracy percentage (0-100)
  errorRate: number;          // Errors per character typed
  totalKeystrokes: number;    // Total number of keystrokes
  correctKeystrokes: number;  // Number of correct keystrokes
  errorKeystrokes: number;    // Number of error keystrokes
  consistency: number;        // Standard deviation of inter-key intervals
  problemKeys: Record<string, number>; // Map of keys to error counts
} 