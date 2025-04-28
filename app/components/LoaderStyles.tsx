'use client';

export default function LoaderStyles() {
  return (
    <style jsx global>{`
      .typing-loader {
        display: inline-block;
        position: relative;
        width: 80px;
        height: 30px;
      }
      .typing-loader:before {
        content: '';
        position: absolute;
        background-color: var(--primary);
        border-radius: 50%;
        width: 10px;
        height: 10px;
        animation: typing 1s infinite ease-in-out both;
        left: 8px;
      }
      .typing-loader:after {
        content: '';
        position: absolute;
        background-color: var(--primary);
        border-radius: 50%;
        width: 10px;
        height: 10px;
        left: 32px;
        animation: typing 1s infinite ease-in-out both;
        animation-delay: 0.2s;
      }
      .typing-loader span {
        content: '';
        position: absolute;
        background-color: var(--primary);
        border-radius: 50%;
        width: 10px;
        height: 10px;
        left: 56px;
        animation: typing 1s infinite ease-in-out both;
        animation-delay: 0.4s;
      }

      @keyframes typing {
        0%, 80%, 100% {
          transform: scale(0);
          opacity: 0;
        } 
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      /* Feedback content styling */
      .feedback-content {
        line-height: 1.7;
        letter-spacing: 0.01em;
        animation: fadeIn 0.5s ease-out;
      }
      
      .feedback-content h1 {
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        padding-bottom: 0.75rem;
        margin-bottom: 1.75rem;
        letter-spacing: -0.01em;
        animation: slideDown 0.6s ease-out;
      }
      
      .feedback-content h2 {
        letter-spacing: -0.01em;
        animation: slideDown 0.7s ease-out;
      }
      
      .feedback-content h3 {
        letter-spacing: -0.01em;
        animation: slideDown 0.8s ease-out;
      }
      
      .feedback-content p, 
      .feedback-content ul, 
      .feedback-content ol {
        animation: fadeIn 1s ease-out;
      }
      
      .feedback-content ul li, 
      .feedback-content ol li {
        animation: fadeIn 1.2s ease-out;
      }
      
      .feedback-content blockquote {
        border-left: 2px solid var(--primary);
        padding-left: 1.25rem;
        margin-left: 0;
        margin-right: 0;
        opacity: 0.85;
        font-style: italic;
        animation: slideRight 1s ease-out;
      }
      
      /* Better emoji display */
      .feedback-content p:has(img), 
      .feedback-content h1:has(img),
      .feedback-content h2:has(img),
      .feedback-content h3:has(img),
      .feedback-content li:has(img) {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .feedback-content img.emoji {
        height: 1.3em;
        width: 1.3em;
        margin: 0 0.2em;
        vertical-align: -0.2em;
      }
      
      /* Animations */
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-15px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideRight {
        from {
          opacity: 0;
          transform: translateX(-15px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `}</style>
  );
} 