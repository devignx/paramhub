'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { PageHeader, CreatorCard, ActionButtons, TextInput, OptionGrid } from '@/components/shared';
import { ViewContainer, CreatorContainer } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TimerConfig {
  mins: number;
  mode: 'pomodoro' | 'custom';
  theme: 'minimal' | 'dark' | 'focus';
}

const themeStyles = {
  minimal: {
    bg: 'bg-background',
    text: 'text-foreground',
    subtext: 'text-muted-foreground',
    button: 'bg-foreground text-background hover:bg-foreground/90',
  },
  dark: {
    bg: 'bg-zinc-950',
    text: 'text-white',
    subtext: 'text-zinc-400',
    button: 'bg-white text-black hover:bg-zinc-200',
  },
  focus: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    subtext: 'text-amber-700',
    button: 'bg-amber-900 text-amber-50 hover:bg-amber-800',
  },
};

function TimerContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<TimerConfig>({
    mins: 25,
    mode: 'pomodoro',
    theme: 'minimal',
  });
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    const mins = searchParams.get('mins');
    const mode = searchParams.get('mode') as TimerConfig['mode'];
    const theme = searchParams.get('theme') as TimerConfig['theme'];

    if (mins || mode) {
      setIsCreating(false);
      const minutes = parseInt(mins || '25');
      setConfig({
        mins: minutes,
        mode: mode || 'pomodoro',
        theme: theme || 'minimal',
      });
      setSecondsLeft(minutes * 60);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          // Play notification sound
          if (typeof window !== 'undefined' && 'Notification' in window) {
            new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU').play().catch(() => {});
          }
          // Switch between work and break in pomodoro mode
          if (config.mode === 'pomodoro') {
            setIsBreak(!isBreak);
            return isBreak ? config.mins * 60 : 5 * 60; // 5 min break
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, config.mode, config.mins, isBreak]);

  const reset = useCallback(() => {
    setSecondsLeft(config.mins * 60);
    setIsRunning(false);
    setIsBreak(false);
  }, [config.mins]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateUrl = () => {
    const params = new URLSearchParams({
      mins: config.mins.toString(),
      mode: config.mode,
      theme: config.theme,
    });
    return `${window.location.origin}/timer?${params.toString()}`;
  };

  const theme = themeStyles[config.theme];
  const progress = ((config.mins * 60 - secondsLeft) / (config.mins * 60)) * 100;

  if (!isCreating) {
    return (
      <ViewContainer createHref="/timer" className={`${theme.bg} flex items-center justify-center p-8`}>
        <div className="text-center">
          <p className={`text-sm mb-4 ${theme.subtext}`}>
            {isBreak ? 'Break Time' : config.mode === 'pomodoro' ? 'Focus Time' : 'Timer'}
          </p>
          <div className="relative inline-flex items-center justify-center mb-8">
            <svg className="w-64 h-64 transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className={theme.subtext}
                opacity={0.2}
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className={theme.text}
                strokeDasharray={2 * Math.PI * 120}
                strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-6xl font-mono font-light ${theme.text}`}>
                {formatTime(secondsLeft)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => setIsRunning(!isRunning)}
              className={theme.button}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={reset}
              className={`border-current ${theme.text}`}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </ViewContainer>
    );
  }

  return (
    <CreatorContainer>
      <PageHeader
        title="Focus Timer"
        description="Minimalist Pomodoro timer for deep work sessions."
      />

      <CreatorCard title="Create Timer" description="Embeddable countdown timer for your workspace.">
        <div className="space-y-6">
          <OptionGrid
            label="Mode"
            options={[
              { value: 'pomodoro', label: 'Pomodoro' },
              { value: 'custom', label: 'Custom' },
            ]}
            value={config.mode}
            onChange={(mode) => setConfig({ ...config, mode })}
            columns={2}
          />

          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={config.mins}
              onChange={(e) => setConfig({ ...config, mins: parseInt(e.target.value) || 25 })}
              min={1}
              max={120}
            />
          </div>

          <OptionGrid
            label="Theme"
            options={[
              { value: 'minimal', label: 'Minimal' },
              { value: 'dark', label: 'Dark' },
              { value: 'focus', label: 'Focus' },
            ]}
            value={config.theme}
            onChange={(theme) => setConfig({ ...config, theme })}
            columns={3}
          />

          {/* Preview */}
          <div className={`p-8 rounded-lg ${theme.bg} text-center`}>
            <p className={`text-xs mb-2 ${theme.subtext}`}>
              {config.mode === 'pomodoro' ? 'Focus Time' : 'Timer'}
            </p>
            <p className={`text-4xl font-mono ${theme.text}`}>
              {config.mins.toString().padStart(2, '0')}:00
            </p>
          </div>

          <ActionButtons generateUrl={generateUrl} disabled={config.mins < 1} />
        </div>
      </CreatorCard>
    </CreatorContainer>
  );
}

export default function TimerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <TimerContent />
    </Suspense>
  );
}
