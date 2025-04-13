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
{
  "format": {
    "type": "json_schema",
    "name": "typing_session_data",
    "schema": {
      "type": "object",
      "properties": {
        "metadata": {
          "type": "object",
          "properties": {
            "sessionId": {
              "type": "string",
              "description": "Unique identifier for the session (UUID format)"
            },
            "startTime": {
              "type": "number",
              "description": "Session start time (milliseconds since epoch)"
            },
            "endTime": {
              "type": ["number", "null"],
              "description": "Session end time (null if not completed)"
            },
            "textPrompt": {
              "type": "string",
              "description": "The original text prompt"
            },
            "userTranscript": {
              "type": "string",
              "description": "The final text input by the user"
            },
            "completionStatus": {
              "type": "string",
              "enum": ["completed", "abandoned", "in-progress"],
              "description": "Status of the session"
            },
            "duration": {
              "type": ["number", "null"],
              "description": "Total duration in milliseconds (null if not completed)"
            },
            "deviceInfo": {
              "type": "object",
              "properties": {
                "deviceType": {
                  "type": "string",
                  "description": "Type of device ('desktop', 'mobile', 'tablet')"
                },
                "browserName": {
                  "type": "string",
                  "description": "Name of the browser used"
                },
                "browserVersion": {
                  "type": "string",
                  "description": "Version of the browser"
                },
                "operatingSystem": {
                  "type": "string",
                  "description": "OS name and version"
                },
                "screenWidth": {
                  "type": "number",
                  "description": "Screen width in pixels"
                },
                "screenHeight": {
                  "type": "number",
                  "description": "Screen height in pixels"
                },
                "keyboardLayout": {
                  "type": "string",
                  "description": "Keyboard layout (e.g., 'QWERTY')"
                },
                "inputMethod": {
                  "type": "string",
                  "description": "Method of input ('physical keyboard', 'touch screen')"
                }
              },
              "required": ["deviceType", "browserName", "browserVersion", "operatingSystem", 
                          "screenWidth", "screenHeight", "keyboardLayout", "inputMethod"]
            }
          },
          "required": ["sessionId", "startTime", "textPrompt", "userTranscript", 
                      "completionStatus", "deviceInfo"]
        },
        "keystrokes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "description": "Unique identifier for this keystroke (UUID format)"
              },
              "timestamp": {
                "type": "number",
                "description": "Milliseconds since epoch"
              },
              "key": {
                "type": "string",
                "description": "The character or key that was pressed"
              },
              "expectedKey": {
                "type": ["string", "null"],
                "description": "The expected character at this position"
              },
              "isCorrect": {
                "type": "boolean",
                "description": "Whether the keystroke matched the expected character"
              },
              "position": {
                "type": "number",
                "description": "Position in the text (0-indexed)"
              },
              "actionType": {
                "type": "string",
                "enum": ["keydown", "keyup", "keypress"],
                "description": "Type of keyboard event"
              },
              "interKeyDelay": {
                "type": ["number", "null"],
                "description": "Time since the last keystroke in ms (null for first keystroke)"
              }
            },
            "required": ["id", "timestamp", "key", "expectedKey", "isCorrect", 
                        "position", "actionType", "interKeyDelay"]
          }
        },
        "metrics": {
          "type": "object",
          "properties": {
            "wpm": {
              "type": "number",
              "description": "Words per minute"
            },
            "accuracy": {
              "type": "number",
              "description": "Accuracy percentage (0-100)"
            },
            "errorRate": {
              "type": "number",
              "description": "Errors per character typed (decimal value between 0-1)"
            },
            "totalKeystrokes": {
              "type": "number",
              "description": "Total number of keystrokes"
            },
            "correctKeystrokes": {
              "type": "number",
              "description": "Number of correct keystrokes"
            },
            "errorKeystrokes": {
              "type": "number",
              "description": "Number of error keystrokes"
            },
            "consistency": {
              "type": "number",
              "description": "Standard deviation of inter-key intervals (ms)"
            },
            "problemKeys": {
              "type": "object",
              "additionalProperties": {
                "type": "number"
              },
              "description": "Map of keys to error counts"
            }
          },
          "required": ["wpm", "accuracy", "errorRate", "totalKeystrokes", 
                      "correctKeystrokes", "errorKeystrokes", "consistency", "problemKeys"]
        }
      },
      "required": ["metadata", "keystrokes", "metrics"]
    },
    "strict": true
  }
}
```

This schema defines the complete structure of a typing session data object, including all required fields and their data types. 