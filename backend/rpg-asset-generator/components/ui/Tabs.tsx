import React from 'react';

interface TabsProps {
  children: React.ReactNode;
}
export const Tabs: React.FC<TabsProps> = ({ children }) => <div>{children}</div>;

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}
export const TabsList: React.FC<TabsListProps> = ({ children, className }) => (
  <div
    className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-800 p-1 text-slate-400 ${className}`}
  >
    {children}
  </div>
);

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
}
export const TabsTrigger: React.FC<TabsTriggerProps> = ({ children, className, isActive, ...props }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-slate-950 text-slate-50 shadow-sm' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);

interface TabsContentProps {
  children: React.ReactNode;
  className?: string;
}
export const TabsContent: React.FC<TabsContentProps> = ({ children, className }) => (
  <div className={`mt-4 ${className}`}>{children}</div>
);
