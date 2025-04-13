# Developer Guide: Typing Test Data Capture System

This guide provides instructions for developers who want to customize or extend the typing test data capture system. It covers the architecture, key files, and common extension scenarios.

## Architecture Overview

The data capture system follows a modular architecture organized around these key components:

1. **Data Types** (`app/lib/types.ts`): TypeScript interfaces that define the structure of all data
2. **Data Capture Utilities** (`app/lib/dataCapture.ts`): Pure functions for capturing and processing data
3. **React Integration** (`app/lib/useTypingData.ts`): A custom hook for using the system in React components
4. **Data Visualization** (`app/components/TypingStats.tsx`): Component for displaying captured data

The system is designed to be:
- **Modular**: Each component has a single responsibility
- **Extensible**: New data points and metrics can be added without disrupting existing functionality
- **Type-Safe**: TypeScript interfaces ensure data integrity
- **Framework-Agnostic**: Core logic is separated from React-specific code

## Key Files

### `app/lib/types.ts`

This file contains TypeScript interfaces that define the structure of all data captured by the system. If you want to add new data points, this is where you should start.

```typescript
// Example: Adding a new field to KeystrokeData
export interface KeystrokeData {
  // ... existing fields
  pressure?: number; // Add optional pressure data for devices that support it
}
```

### `app/lib/dataCapture.ts`

This file contains pure functions for capturing, processing, and analyzing typing data. It's where you'll implement logic for new metrics or data processing features.

```typescript
// Example: Adding a new metric calculation
export function calculateAdvancedMetrics(
  keystrokes: KeystrokeData[],
  sessionMetadata: SessionMetadata
): AdvancedMetrics {
  // Implement your custom metric calculation logic here
  return {
    // ... new metrics
  };
}
```

### `app/lib/useTypingData.ts`

This file provides a React hook that makes it easy to use the data capture system in React components. If you need to change how data is managed in the context of React, this is the file to modify.

```typescript
// Example: Adding a new function to the hook
export function useTypingData(textPrompt: string) {
  // ... existing code
  
  const exportToCsv = useCallback(() => {
    // Implement CSV export logic
  }, [sessionData]);
  
  return {
    // ... existing return values
    exportToCsv,
  };
}
```

### `app/components/TypingStats.tsx`

This file contains the component that displays the captured typing data. If you want to visualize data differently or add new visualizations, this is where you'll make changes.

```typescript
// Example: Adding a new visualization tab
export default function TypingStats({ sessionData }: TypingStatsProps) {
  // ... existing code
  
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'raw' | 'charts'>('summary');
  
  // ... render new tab content
}
```

## Common Extension Scenarios

### Adding a New Data Point

To add a new data point:

1. Add the field to the appropriate interface in `types.ts`
2. Modify the capture function in `dataCapture.ts` to include the new data
3. Update any related calculations in `calculateMetrics` if needed
4. Add UI elements in `TypingStats.tsx` to display the new data

### Adding a New Metric

To add a new performance metric:

1. Add the metric to the `TypingMetrics` interface in `types.ts`
2. Implement the calculation in `calculateMetrics` function in `dataCapture.ts`
3. Add UI elements in `TypingStats.tsx` to display the new metric

### Supporting a New Data Visualization

To add a new way to visualize the data:

1. Add any necessary libraries (e.g., chart libraries) to the project
2. Create a new component for the visualization
3. Integrate it into `TypingStats.tsx` or create a new tab for it
4. Process the data as needed to fit the visualization format

### Adding Data Export Formats

To support exporting data in new formats (beyond JSON):

1. Add the export function to `dataCapture.ts`
2. Create a UI element in `TypingStats.tsx` to trigger the export
3. Implement the format conversion logic

Example for CSV export:
```typescript
export function exportSessionDataAsCsv(sessionData: TypingSessionData): string {
  // Convert session data to CSV format
  // Return CSV string
}
```

### Implementing Server-Side Storage

To store data on a server instead of just localStorage:

1. Create API endpoints for saving and retrieving session data
2. Add API client functions in a new file, e.g., `api.ts`
3. Modify `useTypingData.ts` to use these functions
4. Add authentication and user management as needed

## Best Practices

When extending the data capture system:

1. **Maintain Type Safety**: Always update TypeScript interfaces when adding new data fields
2. **Use Pure Functions**: Keep data processing logic pure and separate from React components
3. **Consider Performance**: Be mindful of performance when capturing high-frequency events like keystrokes
4. **Respect Privacy**: Be transparent about what data is collected and how it's used
5. **Follow Component Structure**: Keep the modular architecture intact to make future extensions easier
6. **Write Tests**: Add tests for new functionality to ensure it works correctly

### Keystroke Capture Best Practices

When working with keystroke capture, follow these critical guidelines:

1. **Capture Before Processing**: Always capture keystrokes BEFORE processing input changes to ensure position data is accurate
2. **Bounds Checking**: Always check array bounds when accessing text characters:
   ```typescript
   const expectedKey = currentPosition < text.length ? text[currentPosition] : null;
   ```
3. **Proper Action Type Matching**: Ensure the keystroke filtering in metrics calculation matches the action type used for capture:
   ```typescript
   // If capturing with 'keydown', filter with the same type
   const typingKeystrokes = keystrokes.filter(k => k.actionType === 'keydown' && k.key.length === 1);
   ```
4. **Timing Consistency**: Handle timing state (like timestamps and intervals) carefully to avoid inconsistencies
5. **Filter Properly**: Only count meaningful keystrokes (typically single characters) in your metrics calculations

## Troubleshooting

Common issues when extending the system:

### Type Errors

If you encounter TypeScript errors after adding new fields:
- Make sure you've updated all relevant interfaces
- Check that you're handling optional fields properly

### Performance Issues

If the app becomes sluggish when capturing data:
- Consider throttling high-frequency events
- Optimize calculations to avoid unnecessary processing
- Use React.memo or useMemo for expensive renders

### Data Inconsistency

If calculated metrics don't match expected values:
- Check the calculation logic in `calculateMetrics`
- Verify that raw data is being captured correctly
- Add logging to debug the data flow

### Common Implementation Pitfalls

Here are common pitfalls to avoid:

1. **Keystroke Capture Timing**:
   - ❌ Capturing keystrokes AFTER updating current position
   - ✅ Capture keystrokes BEFORE any state updates

2. **Expected Key Determination**:
   - ❌ Accessing text without bounds checking: `text[currentPosition]`
   - ✅ Using bounds checking: `currentPosition < text.length ? text[currentPosition] : null`

3. **Timer Management**:
   - ❌ Not properly cleaning up timers when component unmounts or test resets
   - ✅ Clearing intervals and nullifying refs: `clearInterval(timerRef.current); timerRef.current = null;`

4. **State Updates**:
   - ❌ Directly modifying state objects or arrays
   - ✅ Using proper immutable updates with state setters

5. **Dependency Arrays**:
   - ❌ Missing dependencies in useEffect or useCallback hooks
   - ✅ Including all used variables in dependency arrays

## Example Extensions

### Heat Map Visualization

A heat map showing problematic key combinations:

```typescript
// In a new component file
export function TypingHeatMap({ keystrokes }: { keystrokes: KeystrokeData[] }) {
  // Process keystrokes to identify problem combinations
  // Render heat map visualization
}
```

### Typing Pattern Analysis

Advanced analysis of typing patterns:

```typescript
// In dataCapture.ts
export function analyzeTypingPatterns(keystrokes: KeystrokeData[]): TypingPatterns {
  // Identify patterns in typing rhythm
  // Detect common error sequences
  // Return structured analysis
}
```

### Progress Tracking Over Time

Tracking improvement across multiple sessions:

```typescript
// In a new utility file
export function compareSessionsOverTime(sessions: TypingSessionData[]): ProgressData {
  // Analyze trends in WPM, accuracy, etc.
  // Generate progress report
}
```

## Application Structure

## Working with External Integrations

### Palantir Foundry Integration

The application includes built-in support for sending typing test data to Palantir Foundry for advanced analytics.

#### Configuration

1. **Environment Setup**:
   - Create a `.env.local` file in the project root (not just `.env`)
   - Add your Foundry API token: `AIP_DATASTREAM_TOKEN=your_token_here`
   - For production, configure the token in your hosting environment
   - Restart your Next.js server after making changes to environment variables

2. **Key Files**:
   - `app/lib/sendDataToFoundry.ts`: Client-side integration logic
   - `app/api/foundry/route.ts`: Server API route for secure token handling
   - `app/components/FoundryIntegration.tsx`: UI component 
   - `scripts/testFoundryIntegration.ts`: Command-line testing tool

#### How It Works

1. **Client-Side Flow**:
   - User clicks "Send to Foundry" button
   - Client code calls the API route at `/api/foundry`
   - UI shows success/failure feedback

2. **Server-Side Flow**:
   - API route accesses the token securely from environment variables
   - Server forwards the typing data to the Palantir Foundry API
   - Server returns the result to the client

3. **Security Benefits**:
   - Token is never exposed to the client
   - All sensitive API calls happen server-side
   - Preview mode allows testing without data ingestion

#### Troubleshooting

If you encounter issues with the Foundry integration:

1. **Environment Variables**:
   - Ensure the token is in `.env.local` (not just `.env`)
   - Check that you've restarted the Next.js server after changes
   - For debug info, visit `/api/foundry/debug` in development mode

2. **API Permissions**:
   - Verify your token has the correct permissions
   - Check that the dataset ID is correct in the API endpoint

3. **Data Format**:
   - Ensure your data matches the expected Foundry schema
   - Use preview mode to validate without sending

### Creating New Integrations

To add a new integration with another platform:

1. Create a new module in `app/lib/` for the integration logic
2. Implement API calls following the pattern in `sendDataToFoundry.ts`
3. Add a UI component for user interaction if needed
4. Update documentation to reflect the new capabilities

## Conclusion

The typing test data capture system is designed to be easily extended to meet various needs. By following this guide, you can add new features, metrics, and visualizations while maintaining the system's architecture and performance.

For further assistance, refer to the inline documentation in the code or reach out to the project maintainers. 