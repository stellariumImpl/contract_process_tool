import React from 'react';

const Alert = ({ children, variant = 'default', className = '', ...props }) => {
  const variantClasses = {
    default: 'bg-gray-800 text-white',
    destructive: 'bg-red-500/15 text-red-500',
    warning: 'bg-yellow-500/15 text-yellow-500',
    success: 'bg-green-500/15 text-green-500',
  };

  return (
    <div
      role="alert"
      className={`
        rounded-lg p-4 
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const AlertTitle = ({ children, className = '', ...props }) => (
  <h5
    className={`mb-1 font-medium leading-none tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h5>
);

const AlertDescription = ({ children, className = '', ...props }) => (
  <div
    className={`text-sm opacity-90 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export { Alert, AlertTitle, AlertDescription };