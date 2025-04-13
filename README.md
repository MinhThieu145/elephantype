# MonkeyType Clone

A minimalistic typing test application similar to [MonkeyType](https://monkeytype.com/), built with Next.js.

## Features

- **Clean, Distraction-Free Design**: Focused on the typing experience with minimal UI elements
- **Real-Time Feedback**: Visual indicators for correct and incorrect keystrokes
- **Performance Metrics**: Track your WPM (Words Per Minute), accuracy, and error count
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Light/Dark Mode**: Switch between light and dark themes based on your preference

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling

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
  - `globals.css` - Global styles and CSS variables
  - `layout.tsx` - Root layout component
  - `page.tsx` - Main page component

## Accessibility

The application is designed with accessibility in mind:
- Proper contrast ratios for text readability
- Keyboard navigability
- Screen reader friendly elements with appropriate ARIA attributes

## License

This project is licensed under the MIT License.
