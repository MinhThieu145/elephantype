'use client';

import { useState, useEffect, useRef } from 'react';
import { useTypingData } from '../lib/useTypingData';
import TypingStats from './TypingStats';

// Sample text prompts - in a real app, you might fetch these from an API
const sampleTexts = [
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!",
  "Programming is the process of taking an algorithm and encoding it into a notation, a programming language, so that it can be executed by a computer.",
  "A well-designed keyboard can make all the difference in your typing experience. Look for one with good key travel, satisfying tactile feedback, and proper ergonomics.",
  "The art of typing quickly and accurately is a valuable skill in the digital age. Regular practice can significantly improve your words per minute and reduce errors."
];

// Time limit in seconds
const TIME_LIMIT = 60;

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
  const [timeRemaining, setTimeRemaining] = useState(TIME_LIMIT);
  const [totalWords, setTotalWords] = useState(0);
  
  // Integrate data capture system
  const { 
    captureKeystroke, 
    completeSession, 
    sessionData 
  } = useTypingData(text);
  
  const inputRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Select random text on component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * sampleTexts.length);
    const selectedText = sampleTexts[randomIndex];
    setText(selectedText);
    
    // Calculate total words in the text
    const words = selectedText.trim().split(/\s+/);
    setTotalWords(words.length);
  }, []);

  // Start the timer when the user starts typing
  useEffect(() => {
    if (userInput.length === 1 && !startTime) {
      setStartTime(Date.now());
      setIsActive(true);
      
      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up
            clearInterval(timerRef.current as NodeJS.Timeout);
            finishTest('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [userInput, startTime]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
        finishTest('completed');
      }
    }
  }, [userInput, startTime, isActive, currentPosition, text, completeSession]);

  const finishTest = (status: 'completed' | 'abandoned') => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsActive(false);
    setTestComplete(true);
    
    // Complete the session and capture final data
    completeSession(userInput, status);
  };

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
      
      // Capture keystroke data for data analysis
      const expectedKey = e.key.length === 1 
        ? text[currentPosition] 
        : null;
        
      captureKeystroke(
        e.key, 
        expectedKey, 
        currentPosition, 
        'keydown'
      );
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
    // If test is active or complete, mark as abandoned
    if (isActive || testComplete) {
      finishTest('abandoned');
    }
    
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const randomIndex = Math.floor(Math.random() * sampleTexts.length);
    const selectedText = sampleTexts[randomIndex];
    setText(selectedText);
    
    // Calculate total words in the new text
    const words = selectedText.trim().split(/\s+/);
    setTotalWords(words.length);
    
    setUserInput('');
    setStartTime(null);
    setWordCount(0);
    setAccuracy(100);
    setIsActive(false);
    setCurrentPosition(0);
    setErrors(0);
    setTestComplete(false);
    setTimeRemaining(TIME_LIMIT);
    
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

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
      
      {/* Timer and Word Count */}
      <div className="mb-6 flex justify-between items-center">
        <div 
          className="px-4 py-2 rounded font-mono font-medium"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)'
          }}
        >
          <span className={timeRemaining <= 10 ? 'text-incorrect-char' : ''}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        <div 
          className="px-4 py-2 rounded font-mono font-medium"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)'
          }}
        >
          <span>{wordCount}/{totalWords} words</span>
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
          <p className="text-center text-sm opacity-70">Click here and start typing to begin the test (1 minute timer)</p>
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
      
      {/* Display typing statistics if session is complete */}
      {testComplete && sessionData && (
        <TypingStats sessionData={sessionData} />
      )}
    </div>
  );
} 