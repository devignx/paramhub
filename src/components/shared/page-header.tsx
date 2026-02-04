'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description: string;
  backHref?: string;
}

export function PageHeader({ title, description, backHref = '/' }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <Link href={backHref}>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </Link>
      <h1 className="text-3xl md:text-4xl font-serif mb-2">{title}</h1>
      <p className="text-muted-foreground text-lg">{description}</p>
    </div>
  );
}
