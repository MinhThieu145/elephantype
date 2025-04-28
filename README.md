# ElephantType

A typing test app built with Next.js that tracks your typing speed and accuracy. Features Palantir Foundry integration for data storage and analysis.

![image](https://github.com/user-attachments/assets/b896425f-8b49-4e86-be3b-6104b4ef45cb)


## Tech Stack

- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- **Shadcn UI**
- **Palantir Foundry SDK**

## Technical Architecture

### Data Structures

The application uses a comprehensive typing data model split into several interfaces:

#### Core Data Interfaces

- **KeystrokeData**: Records individual keystrokes with properties like:
  - `id`: Unique identifier
  - `timestamp`: When the key was pressed
  - `key`: The character pressed
  - `expectedKey`: What should have been typed
  - `isCorrect`: Whether the keystroke was correct
  - `position`: Position in the text
  - `interKeyDelay`: Time since previous keystroke

- **TypingMetrics**: Calculated performance data:
  - WPM (words per minute)
  - Accuracy percentage
  - Error rate
  - Keystroke counts (total/correct/error)
  - Typing consistency
  - Problem keys mapping

- **SessionMetadata**: Information about the typing session:
  - Session ID and timestamp data
  - Text prompt and user transcript
  - Duration and completion status
  - Device information

- **TypingSessionData**: The complete data object containing:
  - Session metadata
  - Array of keystroke events
  - Calculated metrics

### Data Capture System

The data capture system handles the complete lifecycle of typing data:

1. **Session Initialization**: Creates session metadata with device context
2. **Keystroke Recording**: Captures each keystroke with timing and correctness info
3. **Metrics Calculation**: Processes raw keystroke data to derive performance metrics
4. **Environment Detection**: Identifies browser, OS, device type, and input method
5. **Local Storage**: Falls back to browser storage when offline

### Foundry Integration Architecture

The application integrates with Palantir Foundry using direct API calls:

#### Data Flow

1. **Client-Side Capture**: JavaScript captures typing events in real-time
2. **Data Formatting**: Structured into Foundry-compatible format
3. **API Gateway**: Next.js API routes proxy requests to Foundry
4. **Ontology Mapping**: Data mapped to Metrics ontology (ID: `ontology-abd4f6ff-9f1c-4af0-849a-bdbd7458993d`)
5. **Authentication**: Secure access via client ID and token

#### API Implementation

The app uses two primary API patterns:

- **SDK-Based Approach**: Leverages the Foundry JavaScript SDK for type-safe data access
- **Direct REST Calls**: Fallback method using custom POST requests to:
  ```
  /api/v2/ontologies/{ONTOLOGY_ID}/objectSets/loadObjects
```

## Project Structure

```
app/
├── api/                  # API routes
│   └── foundry/          # Foundry integration endpoints
│       ├── stats/        # Retrieves typing statistics
│       └── feedback/     # Sends session data to Foundry
├── components/           # UI components
│   ├── TypingTest.tsx    # Main typing test interface
│   └── TypingStats.tsx   # Statistics visualization
├── lib/                  # Core utilities
│   ├── types.ts          # TypeScript definitions
│   ├── dataCapture.ts    # Data collection system
│   └── sendDataToFoundry.ts  # Foundry API integration
└── page.tsx              # Main app page
```
