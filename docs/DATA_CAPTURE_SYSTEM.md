# Typing Test Data Capture System

This document provides an overview of the data capture system implemented in the MonkeyType clone application. It explains what data is captured, how it is processed, and how you can use this data for analysis.

## Overview

The typing test data capture system records detailed information about a user's typing session, including individual keystrokes, session metadata, and environmental context. This data can be used to generate metrics about typing performance, identify patterns, and help users improve their typing skills.

## Data Captured

The system captures three main categories of data:

### 1. Raw Keystroke Data

Each individual keystroke is recorded with the following information:

- **ID**: A unique identifier for each keystroke
- **Timestamp**: Precise time when the keystroke occurred (milliseconds since epoch)
- **Key**: The character or control key that was pressed
- **Expected Key**: The character that should have been typed at this position
- **Is Correct**: Whether the keystroke matched the expected character
- **Position**: The position in the text where this keystroke applies
- **Action Type**: Type of keyboard event (keydown, keyup, or keypress)
- **Inter-Key Delay**: Time elapsed since the previous keystroke (null for the first keystroke)

This raw keystroke data provides insights into typing rhythm, common errors, and problem keys.

### 2. Session Metadata

Overall information about the typing session:

- **Session ID**: Unique identifier for the session
- **Start Time**: When the session began
- **End Time**: When the session ended (null if not completed)
- **Text Prompt**: The original text the user was asked to type
- **User Transcript**: The final text input by the user
- **Completion Status**: Whether the test was completed, abandoned, or is still in progress
- **Duration**: Total time spent on the typing test (in milliseconds)
- **Device Info**: Environmental context (see below)

This metadata provides context for the session and allows for comparison between different sessions.

### 3. Environmental Context

Information about the user's device and environment:

- **Device Type**: Desktop, mobile, or tablet
- **Browser**: Name and version of the browser used
- **Operating System**: OS name and version
- **Screen Size**: Width and height of the screen in pixels
- **Keyboard Layout**: QWERTY, AZERTY, Dvorak, etc. (when available)
- **Input Method**: Physical keyboard or touch screen

This context helps understand how different devices and environments affect typing performance.

## Calculated Metrics

Based on the raw data, the system calculates several performance metrics:

- **Words Per Minute (WPM)**: Typing speed based on the standard definition of 5 characters = 1 word
- **Accuracy**: Percentage of keystrokes that were correct
- **Error Rate**: Errors per character typed
- **Total Keystrokes**: Total number of keys pressed during the session
- **Correct Keystrokes**: Number of keystrokes that matched the expected characters
- **Error Keystrokes**: Number of keystrokes that did not match the expected characters
- **Consistency**: Standard deviation of inter-key intervals (lower values indicate more consistent typing rhythm)
- **Problem Keys**: Map of keys to error counts, showing which characters caused the most trouble

## How Data is Captured

The data capture system uses these main components:

1. **Data Types** (`types.ts`): Defines TypeScript interfaces for all data structures
2. **Data Capture Utilities** (`dataCapture.ts`): Functions for recording, processing, and analyzing typing data
3. **React Hook** (`useTypingData.ts`): A custom hook for integrating the data capture system with React components
4. **Stats Component** (`TypingStats.tsx`): A component for visualizing the captured data

The process works as follows:

1. When a typing test starts, a new session is initialized
2. As the user types, each keystroke is recorded with relevant metadata
3. When the test ends (either completed or abandoned), the session is finalized
4. The system calculates performance metrics based on the collected data
5. The data is saved to localStorage and can be exported as JSON for further analysis

## Privacy Considerations

The data capture system stores all data locally in the user's browser using localStorage. No data is transmitted to any server unless the user explicitly exports and shares it. Users can delete their data at any time by clearing their browser's localStorage.

## Using the Data

### For Users

The captured data is displayed in the typing statistics panel after completing a test. Users can:

- View a summary of their performance
- Access detailed metrics and session information
- Download the raw data as JSON for personal analysis

### For Developers

The data capture system is designed to be modular and extensible. Developers can:

- Add new metrics by extending the `calculateMetrics` function
- Implement data visualization features using the captured data
- Create features for tracking progress over time by comparing multiple sessions

## Technical Implementation

The data capture system is implemented in TypeScript and follows modern React best practices. It uses:

- React hooks for state management
- TypeScript interfaces for type safety
- Pure functions for data processing
- Local storage for persistent data storage
- UUID generation for unique identifiers

For more technical details, refer to the code documentation in the relevant files:

- `app/lib/types.ts`
- `app/lib/dataCapture.ts`
- `app/lib/useTypingData.ts`
- `app/components/TypingStats.tsx` 