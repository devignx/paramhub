'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ViewContainerProps {
  children: React.ReactNode;
  createHref: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ViewContainer({ children, createHref, className, style }: ViewContainerProps) {
  return (
    <div className={cn('min-h-screen', className)} style={style}>
      {children}
      <Link href={createHref} className="fixed bottom-6 right-6 z-50">
        <Button variant="secondary" size="sm" className="shadow-lg">
          Create Your Own
        </Button>
      </Link>
    </div>
  );
}

interface CreatorContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function CreatorContainer({ children, className }: CreatorContainerProps) {
  return (
    <div className={cn('min-h-screen bg-background py-12 px-4', className)}>
      <div className="max-w-2xl mx-auto">{children}</div>
    </div>
  );
}
