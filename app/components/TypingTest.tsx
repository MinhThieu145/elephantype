'use client';

import { useState, useEffect, useRef } from 'react';

// Sample text prompts - in a real app, you might fetch these from an API
const sampleTexts = [
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!",
  "Programming is the process of taking an algorithm and encoding it into a notation, a programming language, so that it can be executed by a computer.",
  "A well-designed keyboard can make all the difference in your typing experience. Look for one with good key travel, satisfying tactile feedback, and proper ergonomics.",
  "The art of typing quickly and accurately is a valuable skill in the digital age. Regular practice can significantly improve your words per minute and reduce errors."
];

export default function TypingTest() {
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isActive, setIsActive] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [errors, setErrors] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  
  const inputRef = useRef<HTMLDivElement>(null);

  // Select random text on component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * sampleTexts.length);
    setText(sampleTexts[randomIndex]);
  }, []);

  // Start the timer when the user starts typing
  useEffect(() => {
    if (userInput.length === 1 && !startTime) {
      setStartTime(Date.now());
      setIsActive(true);
    }
  }, [userInput, startTime]);

  // Focus on the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Calculate WPM and accuracy
  useEffect(() => {
    if (startTime && isActive) {
      const words = userInput.trim().split(/\s+/).length;
      setWordCount(words);
      
      const errorCount = calculateErrors();
      const accuracyPercentage = Math.max(0, 100 - (errorCount / text.length * 100));
      setAccuracy(Math.round(accuracyPercentage));
      setErrors(errorCount);
      
      // Check if test is complete
      if (currentPosition >= text.length) {
        setIsActive(false);
        setTestComplete(true);
      }
    }
  }, [userInput, startTime, isActive, currentPosition, text]);

  const calculateErrors = () => {
    let errorCount = 0;
    const textToCompare = text.substring(0, currentPosition);
    const inputToCompare = userInput.substring(0, currentPosition);
    
    for (let i = 0; i < currentPosition; i++) {
      if (i >= inputToCompare.length || textToCompare[i] !== inputToCompare[i]) {
        errorCount++;
      }
    }
    
    return errorCount;
  };

  const calculateWPM = () => {
    if (!startTime || !isActive) return 0;
    
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const wpm = Math.round(wordCount / timeElapsed);
    
    return isNaN(wpm) ? 0 : wpm;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent default for Tab key to avoid losing focus
    if (e.key === 'Tab') {
      e.preventDefault();
    }
    
    if (e.key === 'Escape') {
      resetTest();
      return;
    }
    
    // Allow normal input
    if (!isActive && e.key.length === 1) {
      setStartTime(Date.now());
      setIsActive(true);
    }
    
    if (e.key.length === 1 || e.key === 'Backspace') {
      handleInput(e);
    }
  };

  const handleInput = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (userInput.length > 0) {
        setUserInput(userInput.substring(0, userInput.length - 1));
        setCurrentPosition(Math.max(0, currentPosition - 1));
      }
    } else if (e.key.length === 1) {
      const newInput = userInput + e.key;
      setUserInput(newInput);
      setCurrentPosition(currentPosition + 1);
    }
  };

  const resetTest = () => {
    const randomIndex = Math.floor(Math.random() * sampleTexts.length);
    setText(sampleTexts[randomIndex]);
    setUserInput('');
    setStartTime(null);
    setWordCount(0);
    setAccuracy(100);
    setIsActive(false);
    setCurrentPosition(0);
    setErrors(0);
    setTestComplete(false);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderText = () => {
    return text.split('').map((char, index) => {
      let className = '';
      
      if (index < currentPosition) {
        // User has typed this character
        className = userInput[index] === char ? 'text-correct-char' : 'text-incorrect-char';
      } else if (index === currentPosition) {
        // Current character to type
        className = 'text-current-char underline';
      } else {
        // Not yet typed
        className = 'text-untyped-char';
      }
      
      return (
        <span 
          key={index} 
          className={className}
          style={{
            color: 
              index < currentPosition 
                ? userInput[index] === char 
                  ? 'var(--correct-char)' 
                  : 'var(--incorrect-char)'
                : index === currentPosition 
                  ? 'var(--current-char)' 
                  : 'var(--untyped-char)',
          }}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Stats Display */}
      <div className="mb-8 flex justify-center gap-8">
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{calculateWPM()}</p>
          <p className="text-sm">WPM</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{accuracy}%</p>
          <p className="text-sm">Accuracy</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{errors}</p>
          <p className="text-sm">Errors</p>
        </div>
      </div>
      
      {/* Text Display */}
      <div 
        className="font-mono text-lg leading-relaxed p-8 rounded-lg shadow-sm mb-8"
        style={{ 
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)'
        }}
      >
        {renderText()}
      </div>
      
      {/* Input Area */}
      <div 
        ref={inputRef}
        className="font-mono text-lg p-6 outline-none rounded-lg cursor-text"
        style={{ 
          backgroundColor: 'var(--input-bg)',
          border: `2px solid ${isActive ? 'var(--primary)' : 'var(--card-border)'}`,
          transition: 'border-color 0.2s'
        }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Typing input area"
      >
        {!isActive && !testComplete ? (
          <p className="text-center text-sm opacity-70">Click here and start typing to begin the test</p>
        ) : testComplete ? (
          <p className="text-center text-sm opacity-70">Test complete! Press ESC to restart</p>
        ) : null}
      </div>
      
      {/* Restart Button */}
      <div className="mt-6 flex justify-center">
        <button
          className="px-4 py-2 rounded-md font-medium transition-colors"
          style={{ 
            backgroundColor: 'var(--primary)',
            color: 'var(--background)'
          }}
          onClick={resetTest}
        >
          Reset Test
        </button>
      </div>
    </div>
  );
} 