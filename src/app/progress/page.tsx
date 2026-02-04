'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { PageHeader, CreatorCard, ActionButtons, TextInput, OptionGrid } from '@/components/shared';
import { ViewContainer, CreatorContainer } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProgressConfig {
  type: 'workday' | 'year' | 'custom';
  start: string;
  end: string;
  label: string;
  theme: 'minimal' | 'gradient' | 'neon';
}

function calculateProgress(config: ProgressConfig): number {
  const now = new Date();

  if (config.type === 'year') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const elapsed = now.getTime() - startOfYear.getTime();
    const total = endOfYear.getTime() - startOfYear.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  if (config.type === 'workday' || config.type === 'custom') {
    const [startHour, startMin] = config.start.split(':').map(Number);
    const [endHour, endMin] = config.end.split(':').map(Number);

    const startTime = new Date(now);
    startTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(now);
    endTime.setHours(endHour, endMin, 0, 0);

    if (now < startTime) return 0;
    if (now > endTime) return 100;

    const elapsed = now.getTime() - startTime.getTime();
    const total = endTime.getTime() - startTime.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  return 0;
}

const themeStyles = {
  minimal: {
    bg: 'bg-background',
    bar: 'bg-foreground',
    track: 'bg-muted',
    text: 'text-foreground',
    subtext: 'text-muted-foreground',
  },
  gradient: {
    bg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    bar: 'bg-white',
    track: 'bg-white/20',
    text: 'text-white',
    subtext: 'text-white/70',
  },
  neon: {
    bg: 'bg-black',
    bar: 'bg-green-400',
    track: 'bg-green-400/20',
    text: 'text-green-400',
    subtext: 'text-green-400/60',
  },
};

function ProgressContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<ProgressConfig>({
    type: 'workday',
    start: '09:00',
    end: '17:00',
    label: 'Work Day',
    theme: 'minimal',
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const type = searchParams.get('type') as ProgressConfig['type'];
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const label = searchParams.get('label');
    const theme = searchParams.get('theme') as ProgressConfig['theme'];

    if (type) {
      setIsCreating(false);
      setConfig({
        type: type || 'workday',
        start: start || '09:00',
        end: end || '17:00',
        label: label || 'Progress',
        theme: theme || 'minimal',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    const updateProgress = () => {
      setProgress(calculateProgress(config));
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [config]);

  const generateUrl = () => {
    const params = new URLSearchParams({
      type: config.type,
      label: config.label,
      theme: config.theme,
    });
    if (config.type !== 'year') {
      params.set('start', config.start);
      params.set('end', config.end);
    }
    return `${window.location.origin}/progress?${params.toString()}`;
  };

  const theme = themeStyles[config.theme];

  if (!isCreating) {
    return (
      <ViewContainer createHref="/progress" className={`${theme.bg} flex items-center justify-center p-8`}>
        <div className="w-full max-w-md text-center">
          <h1 className={`text-2xl font-serif mb-2 ${theme.text}`}>{config.label}</h1>
          <p className={`text-sm mb-6 ${theme.subtext}`}>
            {progress.toFixed(1)}% complete
          </p>
          <div className={`w-full h-3 rounded-full ${theme.track} overflow-hidden`}>
            <div
              className={`h-full rounded-full transition-all duration-1000 ${theme.bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={`text-xs mt-4 ${theme.subtext}`}>
            {config.type === 'year'
              ? `${new Date().getFullYear()}`
              : `${config.start} - ${config.end}`}
          </p>
        </div>
      </ViewContainer>
    );
  }

  return (
    <CreatorContainer>
      <PageHeader
        title="Progress Bar"
        description="Auto-updating progress indicator for Notion, Obsidian, and more."
      />

      <CreatorCard title="Create Progress Bar" description="Track your workday, year, or custom time range.">
        <div className="space-y-6">
          <OptionGrid
            label="Progress Type"
            options={[
              { value: 'workday', label: 'Work Day' },
              { value: 'year', label: 'Year' },
              { value: 'custom', label: 'Custom' },
            ]}
            value={config.type}
            onChange={(type) => setConfig({ ...config, type })}
            columns={3}
          />

          {config.type !== 'year' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={config.start}
                  onChange={(e) => setConfig({ ...config, start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={config.end}
                  onChange={(e) => setConfig({ ...config, end: e.target.value })}
                />
              </div>
            </div>
          )}

          <TextInput
            label="Label"
            value={config.label}
            onChange={(label) => setConfig({ ...config, label })}
            placeholder="Work Day"
          />

          <OptionGrid
            label="Theme"
            options={[
              { value: 'minimal', label: 'Minimal' },
              { value: 'gradient', label: 'Gradient' },
              { value: 'neon', label: 'Neon' },
            ]}
            value={config.theme}
            onChange={(theme) => setConfig({ ...config, theme })}
            columns={3}
          />

          {/* Preview */}
          <div className={`p-8 rounded-lg ${theme.bg}`}>
            <div className="text-center">
              <h2 className={`text-lg font-serif mb-2 ${theme.text}`}>{config.label}</h2>
              <div className={`w-full h-2 rounded-full ${theme.track} overflow-hidden`}>
                <div
                  className={`h-full rounded-full ${theme.bar}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className={`text-xs mt-2 ${theme.subtext}`}>{progress.toFixed(1)}%</p>
            </div>
          </div>

          <ActionButtons generateUrl={generateUrl} disabled={!config.label} />
        </div>
      </CreatorCard>
    </CreatorContainer>
  );
}

export default function ProgressPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <ProgressContent />
    </Suspense>
  );
}
