import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variantClasses = {
    primary: 'bg-slate-50 text-slate-900 hover:bg-slate-200',
    secondary: 'bg-transparent border border-slate-500 text-slate-50 hover:bg-slate-800',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} px-4 py-2 ${className}`} {...props}>
      {children}
    </button>
  );
};
