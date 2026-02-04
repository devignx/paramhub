'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { copyToClipboard, formatDateForUrl } from '@/lib/url-utils';

interface CountdownConfig {
  date: string;
  label: string;
  theme: 'dark' | 'light' | 'neon' | 'minimal';
  showSeconds: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const themeStyles = {
  dark: {
    bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    card: 'bg-slate-800/50 border-slate-700',
    text: 'text-white',
    subtext: 'text-slate-400',
    number: 'text-white',
    label: 'text-slate-500',
  },
  light: {
    bg: 'bg-gradient-to-br from-slate-100 via-white to-slate-100',
    card: 'bg-white border-slate-200 shadow-lg',
    text: 'text-slate-800',
    subtext: 'text-slate-500',
    number: 'text-slate-800',
    label: 'text-slate-400',
  },
  neon: {
    bg: 'bg-black',
    card: 'bg-black border-cyan-500/30',
    text: 'text-cyan-400',
    subtext: 'text-cyan-600',
    number: 'text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]',
    label: 'text-cyan-700',
  },
  minimal: {
    bg: 'bg-white',
    card: 'bg-transparent border-transparent',
    text: 'text-slate-900',
    subtext: 'text-slate-400',
    number: 'text-slate-900',
    label: 'text-slate-300',
  },
};

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    total: difference,
  };
}

function CountdownContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<CountdownConfig>({
    date: formatDateForUrl(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    label: 'The Big Day',
    theme: 'dark',
    showSeconds: true,
  });
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 1 });

  useEffect(() => {
    const date = searchParams.get('date');
    const label = searchParams.get('label');
    const theme = searchParams.get('theme') as CountdownConfig['theme'];
    const showSeconds = searchParams.get('seconds');

    if (date) {
      setIsCreating(false);
      setConfig({
        date,
        label: label || 'Countdown',
        theme: theme || 'dark',
        showSeconds: showSeconds !== 'false',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    const updateCountdown = () => {
      const targetDate = new Date(config.date);
      setTimeLeft(calculateTimeLeft(targetDate));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [config.date]);

  const generateUrl = () => {
    const params = new URLSearchParams({
      date: config.date,
      label: config.label,
      theme: config.theme,
    });
    if (!config.showSeconds) params.set('seconds', 'false');
    return `${window.location.origin}/countdown?${params.toString()}`;
  };

  const handleCopy = async () => {
    const url = generateUrl();
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const theme = themeStyles[config.theme];
  const isComplete = timeLeft.total <= 0;

  if (!isCreating) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4`}>
        <div className="text-center">
          <h1 className={`text-2xl md:text-4xl font-bold mb-8 ${theme.text}`}>
            {config.label}
          </h1>

          {isComplete ? (
            <div className={`text-6xl md:text-8xl font-bold ${theme.number} animate-pulse`}>
              🎉 Time&apos;s Up!
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {[
                { value: timeLeft.days, label: 'Days' },
                { value: timeLeft.hours, label: 'Hours' },
                { value: timeLeft.minutes, label: 'Minutes' },
                ...(config.showSeconds ? [{ value: timeLeft.seconds, label: 'Seconds' }] : []),
              ].map((item) => (
                <div
                  key={item.label}
                  className={`${theme.card} border rounded-xl p-4 md:p-8 min-w-[80px] md:min-w-[120px]`}
                >
                  <div className={`text-4xl md:text-7xl font-bold font-mono ${theme.number}`}>
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div className={`text-xs md:text-sm uppercase tracking-wider mt-2 ${theme.label}`}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className={`mt-8 text-sm ${theme.subtext}`}>
            {new Date(config.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <Link
          href="/countdown"
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium ${theme.card} border ${theme.text} hover:opacity-80 transition-opacity`}
        >
          Create Your Own
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            ⏱️ Create a Countdown
          </h1>
          <p className="text-slate-400 mb-8">
            A minimalist countdown timer that works anywhere, including Notion and Obsidian embeds.
          </p>

          {/* Preview */}
          <div className={`w-full p-8 rounded-lg mb-8 ${themeStyles[config.theme].bg}`}>
            <div className="text-center">
              <h2 className={`text-lg font-semibold mb-4 ${themeStyles[config.theme].text}`}>
                {config.label || 'Your Event'}
              </h2>
              <div className="flex justify-center gap-4">
                {[
                  { value: timeLeft.days, label: 'D' },
                  { value: timeLeft.hours, label: 'H' },
                  { value: timeLeft.minutes, label: 'M' },
                  ...(config.showSeconds ? [{ value: timeLeft.seconds, label: 'S' }] : []),
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className={`text-2xl font-bold font-mono ${themeStyles[config.theme].number}`}>
                      {String(item.value).padStart(2, '0')}
                    </div>
                    <div className={`text-xs ${themeStyles[config.theme].label}`}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Event Label *
              </label>
              <input
                type="text"
                value={config.label}
                onChange={(e) => setConfig({ ...config, label: e.target.value })}
                placeholder="New Year 2025"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Date & Time *
              </label>
              <input
                type="datetime-local"
                value={config.date}
                onChange={(e) => setConfig({ ...config, date: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(themeStyles) as Array<keyof typeof themeStyles>).map((t) => (
                  <button
                    key={t}
                    onClick={() => setConfig({ ...config, theme: t })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all capitalize ${
                      config.theme === t
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-slate-600 hover:border-slate-500 text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showSeconds"
                checked={config.showSeconds}
                onChange={(e) => setConfig({ ...config, showSeconds: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="showSeconds" className="text-sm text-slate-300">
                Show seconds
              </label>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={handleCopy}
                disabled={!config.label || !config.date}
                className={`w-full py-4 rounded-lg font-semibold transition-all ${
                  config.label && config.date
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {copied ? '✓ Copied to Clipboard!' : 'Copy Shareable Link'}
              </button>

              {config.label && config.date && (
                <a
                  href={generateUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 rounded-lg font-semibold text-center border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-all"
                >
                  Preview →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CountdownPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    }>
      <CountdownContent />
    </Suspense>
  );
}
