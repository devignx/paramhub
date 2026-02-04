'use client';

import { cn } from '@/lib/utils';

interface OptionGridProps<T extends string> {
  label: string;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function OptionGrid<T extends string>({
  label,
  options,
  value,
  onChange,
  columns = 3,
  className,
}: OptionGridProps<T>) {
  const colsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium">{label}</label>
      <div className={cn('grid gap-2', colsClass[columns])}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all',
              value === option.value
                ? 'border-foreground bg-foreground text-background'
                : 'border-border hover:border-foreground/50 text-foreground'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorInput({ label, value, onChange, className }: ColorInputProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg cursor-pointer border border-border"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono"
        />
      </div>
    </div>
  );
}
