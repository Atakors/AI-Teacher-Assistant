import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div 
        className="aurora-card p-4" 
        role="alert"
        style={{
            '--color-surface': 'var(--color-error-surface)',
            '--color-border': 'var(--color-error-border)',
            color: 'var(--color-error-text)'
        } as React.CSSProperties}
    >
      <p className="font-bold" style={{ color: 'var(--color-error-accent)' }}>Error</p>
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage;