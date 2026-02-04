'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { copyToClipboard } from '@/lib/url-utils';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label = 'Copy Link', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      onClick={handleCopy}
      className={cn('w-full', className)}
      size="lg"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}

interface PreviewButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function PreviewButton({ href, label = 'Preview', className }: PreviewButtonProps) {
  return (
    <Button
      asChild
      variant="outline"
      className={cn('w-full', className)}
      size="lg"
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="w-4 h-4 mr-2" />
        {label}
      </a>
    </Button>
  );
}

interface ActionButtonsProps {
  generateUrl: () => string;
  disabled?: boolean;
}

export function ActionButtons({ generateUrl, disabled }: ActionButtonsProps) {
  const url = disabled ? '' : generateUrl();

  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4">
      <CopyButton value={url} className={disabled ? 'opacity-50 pointer-events-none' : ''} />
      {!disabled && <PreviewButton href={url} />}
    </div>
  );
}
