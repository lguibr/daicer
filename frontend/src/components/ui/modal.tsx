/**
 * Modal Component
 * Reusable modal with blur backdrop
 */

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, maxWidth = 'lg', showCloseButton = true }: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
      <Card
        className={`relative w-full ${maxWidthClasses[maxWidth]} border-accent/30 bg-midnight-900/95 shadow-2xl backdrop-blur-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <CardHeader className="border-b border-accent/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-white">{title}</CardTitle>
              {showCloseButton && (
                <Button onClick={onClose} variant="ghost" size="sm" className="text-shadow-300 hover:text-white">
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </CardHeader>
        )}
        <CardContent className={title ? 'pt-6' : 'p-6'}>{children}</CardContent>
      </Card>
    </div>
  );
}
