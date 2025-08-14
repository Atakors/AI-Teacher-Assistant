
import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
      <svg className="w-16 h-16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          stroke="var(--color-border)" 
          strokeWidth="10" 
          fill="none" 
        />
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          stroke="var(--color-accent)" 
          strokeWidth="10" 
          fill="none" 
          strokeDasharray="282.74" 
          strokeDashoffset="212.055"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <p className="font-medium text-[var(--color-text-primary)] animate-pulse">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
