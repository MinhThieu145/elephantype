# Typing Test Data Points Reference

This document provides a detailed reference of all data points captured by the typing test data capture system. Each data point is explained in simple language with information about its purpose and usage.

## Keystroke Data

| Data Point | Type | Description | Purpose |
|------------|------|-------------|---------|
| `id` | string | Unique identifier for each keystroke | Ensures each keystroke can be uniquely identified for analysis |
| `timestamp` | number | Time when the keystroke occurred (milliseconds since epoch) | Allows calculation of typing speed and rhythm analysis |
| `key` | string | The character or key that was pressed | Identifies what was typed for accuracy analysis |
| `expectedKey` | string/null | The expected character at this position | Used to determine if the keystroke was correct |
| `isCorrect` | boolean | Whether the keystroke matched the expected character | Core data point for accuracy calculations |
| `position` | number | Position in the text where this keystroke applies | Helps map keystrokes to positions in the text |
| `actionType` | string | Type of keyboard event ('keydown', 'keyup', 'keypress') | Differentiates between different keystroke events |
| `interKeyDelay` | number/null | Time since the last keystroke in milliseconds | Key data point for analyzing typing rhythm and consistency |

## Session Metadata

| Data Point | Type | Description | Purpose |
|------------|------|-------------|---------|
| `sessionId` | string | Unique identifier for the session | Allows different sessions to be distinguished |
| `startTime` | number | Session start time (milliseconds since epoch) | Marks the beginning of the typing session |
| `endTime` | number/null | Session end time (null if not completed) | Marks the end of the typing session |
| `textPrompt` | string | The original text prompt | Used as the reference text for accuracy calculations |
| `userTranscript` | string | The final text input by the user | Shows what was actually typed for comparison |
| `completionStatus` | string | Status of the session ('completed', 'abandoned', 'in-progress') | Indicates whether the test was finished |
| `duration` | number/null | Total duration in milliseconds | Used for speed calculations and session analysis |
| `deviceInfo` | object | Environmental context of the session | Provides context about the user's setup |

## Environmental Context

| Data Point | Type | Description | Purpose |
|------------|------|-------------|---------|
| `deviceType` | string | Type of device ('desktop', 'mobile', 'tablet') | Helps understand how device type affects typing |
| `browserName` | string | Name of the browser used | Browser may affect keyboard input handling |
| `browserVersion` | string | Version of the browser | Provides more specific browser information |
| `operatingSystem` | string | OS name and version | OS may affect keyboard input behavior |
| `screenWidth` | number | Screen width in pixels | Screen size may affect text display and readability |
| `screenHeight` | number | Screen height in pixels | Screen size may affect text display and readability |
| `keyboardLayout` | string | Keyboard layout (e.g., 'QWERTY') | Different layouts can significantly affect typing patterns |
| `inputMethod` | string | Method of input ('physical keyboard', 'touch screen') | Input method greatly affects typing speed and accuracy |

## Performance Metrics

| Metric | Type | Description | Calculation Method |
|--------|------|-------------|-------------------|
| `wpm` | number | Words per minute | (Characters typed ÷ 5) ÷ (time in minutes) |
| `accuracy` | number | Accuracy percentage (0-100) | (Correct keystrokes ÷ total keystrokes) × 100 |
| `errorRate` | number | Errors per character typed | Error keystrokes ÷ total keystrokes |
| `totalKeystrokes` | number | Total number of keystrokes | Count of all keystrokes recorded |
| `correctKeystrokes` | number | Number of correct keystrokes | Count of keystrokes where isCorrect = true |
| `errorKeystrokes` | number | Number of error keystrokes | Count of keystrokes where isCorrect = false |
| `consistency` | number | Standard deviation of inter-key intervals | √(Variance of inter-key delays) |
| `problemKeys` | object | Map of keys to error counts | Records which keys had the most errors |

## Data Relationships

The data captured is organized hierarchically:

1. A typing **session** contains:
   - Session metadata
   - Array of keystroke data
   - Calculated performance metrics

2. Each **keystroke** contains:
   - Information about a single key press
   - Reference to its expected value
   - Timing information relative to the session

3. The **environmental context** is:
   - Linked to the session metadata
   - Captured once at the beginning of the session

## Example JSON Structure

Below is an example of the complete JSON structure that represents a typing session, based on the actual TypeScript interfaces used in the application:

```json
{
  "metadata": {
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "startTime": 1623456789000,
    "endTime": 1623456799000,
    "textPrompt": "The quick brown fox jumps over the lazy dog.",
    "userTranscript": "The quikc brown fox jumps over the lazy dog.",
    "completionStatus": "completed",
    "duration": 10000,
    "deviceInfo": {
      "deviceType": "desktop",
      "browserName": "Chrome",
      "browserVersion": "91",
      "operatingSystem": "Windows 10",
      "screenWidth": 1920,
      "screenHeight": 1080,
      "keyboardLayout": "QWERTY",
      "inputMethod": "physical keyboard"
    }
  },
  "keystrokes": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "timestamp": 1623456789100,
      "key": "T",
      "expectedKey": "T",
      "isCorrect": true,
      "position": 0,
      "actionType": "keydown",
      "interKeyDelay": null
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "timestamp": 1623456789300,
      "key": "h",
      "expectedKey": "h",
      "isCorrect": true,
      "position": 1,
      "actionType": "keydown",
      "interKeyDelay": 200
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "timestamp": 1623456789500,
      "key": "e",
      "expectedKey": "e",
      "isCorrect": true,
      "position": 2,
      "actionType": "keydown",
      "interKeyDelay": 200
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174004",
      "timestamp": 1623456789700,
      "key": " ",
      "expectedKey": " ",
      "isCorrect": true,
      "position": 3,
      "actionType": "keydown",
      "interKeyDelay": 200
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "timestamp": 1623456789900,
      "key": "q",
      "expectedKey": "q",
      "isCorrect": true,
      "position": 4,
      "actionType": "keydown",
      "interKeyDelay": 200
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174006",
      "timestamp": 1623456790100,
      "key": "u",
      "expectedKey": "u",
      "isCorrect": true,
      "position": 5,
      "actionType": "keydown",
      "interKeyDelay": 200
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174007",
      "timestamp": 1623456790300,
      "key": "i",
      "expectedKey": "i",
      "isCorrect": true,
      "position": 6,
      "actionType": "keydown",
      "interKeyDelay": 200
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174008",
      "timestamp": 1623456790500,
      "key": "k",
      "expectedKey": "c",
      "isCorrect": false,
      "position": 7,
      "actionType": "keydown",
      "interKeyDelay": 200
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174009",
      "timestamp": 1623456790700,
      "key": "c",
      "expectedKey": "k",
      "isCorrect": false,
      "position": 8,
      "actionType": "keydown",
      "interKeyDelay": 200
    }
  ],
  "metrics": {
    "wpm": 45.6,
    "accuracy": 77.78,
    "errorRate": 0.22,
    "totalKeystrokes": 9,
    "correctKeystrokes": 7,
    "errorKeystrokes": 2,
    "consistency": 0.0,
    "problemKeys": {
      "k": 1,
      "c": 1
    }
  }
}
```

This JSON structure represents a complete typing session with all the data captured by the system. It follows exactly the TypeScript interfaces defined in the application and can be exported for further analysis or visualization.

## Data Structure Schema

Below is the JSON schema that defines the structure of the typing session data:

```json
[
  {
    "name": "metadata",
    "customMetadata": {},
    "nullable": true,
    "type": "STRUCT",
    "subSchemas": [
      {
        "name": "sessionId",
        "customMetadata": {},
        "nullable": true,
        "type": "STRING"
      },
      {
        "name": "startTime",
        "customMetadata": {},
        "nullable": true,
        "type": "LONG"
      },
      {
        "name": "endTime",
        "customMetadata": {},
        "nullable": true,
        "type": "LONG"
      },
      {
        "name": "textPrompt",
        "customMetadata": {},
        "nullable": true,
        "type": "STRING"
      },
      {
        "name": "userTranscript",
        "customMetadata": {},
        "nullable": true,
        "type": "STRING"
      },
      {
        "name": "completionStatus",
        "customMetadata": {},
        "nullable": true,
        "type": "STRING"
      },
      {
        "name": "duration",
        "customMetadata": {},
        "nullable": true,
        "type": "LONG"
      },
      {
        "name": "deviceInfo",
        "customMetadata": {},
        "nullable": true,
        "type": "STRUCT",
        "subSchemas": [
          {
            "name": "deviceType",
            "customMetadata": {},
            "nullable": true,
            "type": "STRING"
          },
          {
            "name": "browserName",
            "customMetadata": {},
            "nullable": true,
            "type": "STRING"
          },
          {
            "name": "browserVersion",
            "customMetadata": {},
            "nullable": true,
            "type": "STRING"
          },
          {
            "name": "operatingSystem",
            "customMetadata": {},
            "nullable": true,
            "type": "STRING"
          },
          {
            "name": "screenWidth",
            "customMetadata": {},
            "nullable": true,
            "type": "INTEGER"
          },
          {
            "name": "screenHeight",
            "customMetadata": {},
            "nullable": true,
            "type": "INTEGER"
          },
          {
            "name": "keyboardLayout",
            "customMetadata": {},
            "nullable": true,
            "type": "STRING"
          },
          {
            "name": "inputMethod",
            "customMetadata": {},
            "nullable": true,
            "type": "STRING"
          }
        ]
      },
      {
        "name": "processingStatus",
        "customMetadata": {},
        "nullable": true,
        "type": "STRING"
      }
    ]
  },
  {
    "name": "keystrokes",
    "customMetadata": {},
    "nullable": true,
    "type": "ARRAY",
    "arraySubtype": {
      "nullable": false,
      "customMetadata": {},
      "type": "STRUCT",
      "subSchemas": [
        {
          "name": "id",
          "customMetadata": {},
          "nullable": true,
          "type": "STRING"
        },
        {
          "name": "timestamp",
          "customMetadata": {},
          "nullable": true,
          "type": "LONG"
        },
        {
          "name": "key",
          "customMetadata": {},
          "nullable": true,
          "type": "STRING"
        },
        {
          "name": "expectedKey",
          "customMetadata": {},
          "nullable": true,
          "type": "STRING"
        },
        {
          "name": "isCorrect",
          "customMetadata": {},
          "nullable": true,
          "type": "BOOLEAN"
        },
        {
          "name": "position",
          "customMetadata": {},
          "nullable": true,
          "type": "INTEGER"
        },
        {
          "name": "actionType",
          "customMetadata": {},
          "nullable": true,
          "type": "STRING"
        },
        {
          "name": "interKeyDelay",
          "customMetadata": {},
          "nullable": true,
          "type": "LONG"
        }
      ]
    }
  },
  {
    "name": "metrics",
    "customMetadata": {},
    "nullable": true,
    "type": "STRUCT",
    "subSchemas": [
      {
        "name": "wpm",
        "customMetadata": {},
        "nullable": true,
        "type": "FLOAT"
      },
      {
        "name": "accuracy",
        "customMetadata": {},
        "nullable": true,
        "type": "FLOAT"
      },
      {
        "name": "errorRate",
        "customMetadata": {},
        "nullable": true,
        "type": "FLOAT"
      },
      {
        "name": "totalKeystrokes",
        "customMetadata": {},
        "nullable": true,
        "type": "INTEGER"
      },
      {
        "name": "correctKeystrokes",
        "customMetadata": {},
        "nullable": true,
        "type": "INTEGER"
      },
      {
        "name": "errorKeystrokes",
        "customMetadata": {},
        "nullable": true,
        "type": "INTEGER"
      },
      {
        "name": "consistency",
        "customMetadata": {},
        "nullable": true,
        "type": "FLOAT"
      },
      {
        "name": "problemKeys",
        "customMetadata": {},
        "nullable": false,
        "type": "MAP",
        "mapKeyType": {
          "nullable": false,
          "customMetadata": {},
          "type": "STRING"
        },
        "mapValueType": {
          "nullable": false,
          "customMetadata": {},
          "type": "INTEGER"
        }
      }
    ]
  }
]
```

This schema defines the complete structure of a typing session data object, including all required fields and their data types. 

## Stringified Data Format

For integration with Palantir Foundry and other external systems, the data capture system now supports converting the main data categories to JSON strings. This format simplifies data transmission and storage while preserving all the original information.

### Stringified Structure

```typescript
{
  metadata: string;    // JSON string of the entire metadata object
  keystrokes: string;  // JSON string of the entire keystrokes array
  metrics: string;     // JSON string of the entire metrics object
}
```

### Example Stringified Format

```json
{
  "metadata": "{\"sessionId\":\"123e4567-e89b-12d3-a456-426614174000\",\"startTime\":1623456789000,...}",
  "keystrokes": "[{\"id\":\"123e4567-e89b-12d3-a456-426614174001\",\"timestamp\":1623456789100,...}]",
  "metrics": "{\"wpm\":45.6,\"accuracy\":77.78,\"errorRate\":0.22,...}"
}
```

### Converting Between Formats

The system provides utility functions to convert between the structured and stringified formats:

```typescript
// Convert to stringified format (right before external transmission)
const stringified = stringifySessionData(sessionData);

// Convert back to structured format (after receiving from external source)
const metadata = JSON.parse(stringified.metadata);
const keystrokes = JSON.parse(stringified.keystrokes);
const metrics = JSON.parse(stringified.metrics);
```

The stringified format is primarily used when transmitting data to external systems like Palantir Foundry, while the structured format is used for local calculations and display. 