'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CreatorCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export function CreatorCard({ title, description, children, className }: CreatorCardProps) {
  return (
    <Card className={cn('border-border/50', className)}>
      <CardHeader>
        <CardTitle className="font-serif text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
