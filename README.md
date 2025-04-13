# MonkeyType Clone

A minimalistic typing test application similar to [MonkeyType](https://monkeytype.com/), built with Next.js.

## Features

- **Clean, Distraction-Free Design**: Focused on the typing experience with minimal UI elements
- **Real-Time Feedback**: Visual indicators for correct and incorrect keystrokes
- **Performance Metrics**: Track your WPM (Words Per Minute), accuracy, and error count
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Light/Dark Mode**: Switch between light and dark themes based on your preference
- **Comprehensive Data Capture**: Detailed tracking of typing patterns, errors, and performance metrics
- **Statistical Analysis**: View and analyze your typing performance with interactive statistics
- **Data Export**: Download your typing data in JSON format for external analysis
- **Timed Tests**: 1-minute typing test with automatic completion
- **Word Count Tracking**: Monitor progress through the text with word count display

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [UUID](https://github.com/uuidjs/uuid) - Unique ID generation for data capture

## Getting Started

First, clone the repository:

```bash
git clone https://github.com/MinhThieu145/monkeytype.git
cd monkeytype
```

Install dependencies:

```bash
npm install
# or
yarn install
```

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `app/` - Next.js application directory
  - `components/` - Reusable UI components
    - `Header.tsx` - App header with logo and theme toggle
    - `Footer.tsx` - App footer with links
    - `TypingTest.tsx` - Main typing test component
    - `ThemeToggle.tsx` - Theme switcher component
    - `TypingStats.tsx` - Component for displaying typing statistics
  - `lib/` - Utility functions and types
    - `types.ts` - TypeScript type definitions for data capture
    - `dataCapture.ts` - Functions for capturing and processing typing data
    - `useTypingData.ts` - React hook for integrating data capture
  - `globals.css` - Global styles and CSS variables
  - `layout.tsx` - Root layout component
  - `page.tsx` - Main page component
- `docs/` - Documentation for the project
  - `DATA_CAPTURE_SYSTEM.md` - Overview of the data capture system
  - `DATA_POINTS_REFERENCE.md` - Detailed reference of captured data points
  - `DEVELOPER_GUIDE.md` - Guide for extending the data capture system

## Data Capture System

The application includes a comprehensive data capture system that records detailed information about typing sessions. This data can be used to:

- **Analyze Typing Performance**: Track WPM, accuracy, and error patterns
- **Identify Problem Areas**: Detect which keys and character combinations cause the most errors
- **Monitor Progress**: Compare results across multiple typing sessions
- **Improve Typing Skills**: Use detailed feedback to focus practice on specific weaknesses

### Key Features of the Data Capture System

- **Accurate Keystroke Tracking**: Properly captures and analyzes every keystroke with precise timing
- **Raw Keystroke Data**: Records timestamp, key value, correctness, and position for each keystroke
- **Session Metadata**: Captures information about the overall typing session
- **Environmental Context**: Collects data about the device, browser, and input method
- **Performance Metrics**: Calculates WPM, accuracy, error rate, and typing consistency
- **Local Storage**: All data is stored locally in the browser
- **Privacy-Focused**: No data is sent to any server unless explicitly exported by the user

For more information about the data capture system, see the [documentation](/docs/DATA_CAPTURE_SYSTEM.md).

### Documentation

For detailed information about the Foundry integration, see:
- [Developer Guide](./docs/DEVELOPER_GUIDE.md)
- [Data Capture System](./docs/DATA_CAPTURE_SYSTEM.md)
- [Data Points Reference](./docs/DATA_POINTS_REFERENCE.md)

## Accessibility

The application is designed with accessibility in mind:
- Proper contrast ratios for text readability
- Keyboard navigability
- Screen reader friendly elements with appropriate ARIA attributes

## License

This project is licensed under the MIT License.
