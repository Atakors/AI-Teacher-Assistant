import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  const errorStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-error-surface)',
    border: '1px solid var(--color-error-border)',
    color: 'var(--color-error-text)',
    borderRadius: 'var(--border-radius-md)',
  };

  return (
    <div 
        className="p-4" 
        role="alert"
        style={errorStyle}
    >
      <p className="font-bold">Error</p>
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage;