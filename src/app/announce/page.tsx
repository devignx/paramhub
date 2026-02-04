'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { copyToClipboard } from '@/lib/url-utils';

interface AnnounceConfig {
  text: string;
  bg: string;
  color: string;
  font: 'sans' | 'serif' | 'mono';
  animate: boolean;
}

const presetThemes = [
  { name: 'Classic', bg: '#000000', color: '#ffffff' },
  { name: 'Apple', bg: '#ffffff', color: '#1d1d1f' },
  { name: 'Neon', bg: '#0a0a0a', color: '#00ff88' },
  { name: 'Sunset', bg: '#ff6b6b', color: '#ffffff' },
  { name: 'Ocean', bg: '#0077b6', color: '#ffffff' },
  { name: 'Forest', bg: '#1a472a', color: '#f0f0f0' },
  { name: 'Royal', bg: '#4a0e4e', color: '#ffd700' },
  { name: 'Minimal', bg: '#f5f5f5', color: '#333333' },
];

function AnnounceContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<AnnounceConfig>({
    text: 'WE ARE LIVE',
    bg: '#000000',
    color: '#ffffff',
    font: 'sans',
    animate: true,
  });
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const textRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const text = searchParams.get('text');
    const bg = searchParams.get('bg');
    const color = searchParams.get('color');
    const font = searchParams.get('font') as AnnounceConfig['font'];
    const animate = searchParams.get('animate');

    if (text) {
      setIsCreating(false);
      setConfig({
        text: text,
        bg: bg || '#000000',
        color: color || '#ffffff',
        font: font || 'sans',
        animate: animate !== 'false',
      });
    }
  }, [searchParams]);

  // Auto-fit text to screen
  useEffect(() => {
    const fitText = () => {
      if (!textRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth * 0.9;
      const containerHeight = container.clientHeight * 0.8;

      let low = 10;
      let high = 500;
      let optimalSize = low;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        textRef.current.style.fontSize = `${mid}px`;

        const textWidth = textRef.current.scrollWidth;
        const textHeight = textRef.current.scrollHeight;

        if (textWidth <= containerWidth && textHeight <= containerHeight) {
          optimalSize = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      setFontSize(optimalSize);
    };

    fitText();
    window.addEventListener('resize', fitText);
    return () => window.removeEventListener('resize', fitText);
  }, [config.text, isCreating]);

  const generateUrl = () => {
    const params = new URLSearchParams({
      text: config.text,
      bg: config.bg,
      color: config.color,
      font: config.font,
    });
    if (!config.animate) params.set('animate', 'false');
    return `${window.location.origin}/announce?${params.toString()}`;
  };

  const handleCopy = async () => {
    const url = generateUrl();
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fontFamily = {
    sans: 'ui-sans-serif, system-ui, sans-serif',
    serif: 'ui-serif, Georgia, serif',
    mono: 'ui-monospace, monospace',
  };

  if (!isCreating) {
    return (
      <div
        ref={containerRef}
        className="min-h-screen flex items-center justify-center p-4 overflow-hidden"
        style={{ backgroundColor: config.bg }}
      >
        <div
          ref={textRef}
          className={`font-bold text-center leading-none ${
            config.animate ? 'animate-pulse-slow' : ''
          }`}
          style={{
            color: config.color,
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily[config.font],
            textShadow: config.bg === '#ffffff' || config.bg === '#f5f5f5'
              ? 'none'
              : '0 0 30px rgba(255,255,255,0.1)',
          }}
        >
          {config.text}
        </div>
        <Link
          href="/announce"
          className="fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium bg-black/20 hover:bg-black/40 transition-colors backdrop-blur-sm"
          style={{ color: config.color }}
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
            📢 Create an Announcement
          </h1>
          <p className="text-slate-400 mb-8">
            Big, bold typography that auto-scales to fill any screen.
          </p>

          {/* Preview */}
          <div
            ref={containerRef}
            className="w-full h-48 rounded-lg mb-8 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: config.bg }}
          >
            <div
              ref={textRef}
              className={`font-bold text-center px-4 ${config.animate ? 'animate-pulse-slow' : ''}`}
              style={{
                color: config.color,
                fontSize: `${Math.min(fontSize, 48)}px`,
                fontFamily: fontFamily[config.font],
              }}
            >
              {config.text || 'Your Text Here'}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Your Message *
              </label>
              <input
                type="text"
                value={config.text}
                onChange={(e) => setConfig({ ...config, text: e.target.value })}
                placeholder="WE ARE LIVE"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Theme Presets
              </label>
              <div className="grid grid-cols-4 gap-2">
                {presetThemes.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => setConfig({ ...config, bg: theme.bg, color: theme.color })}
                    className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                      config.bg === theme.bg && config.color === theme.color
                        ? 'border-purple-500 ring-2 ring-purple-500/50'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    style={{ backgroundColor: theme.bg, color: theme.color }}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Background Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.bg}
                    onChange={(e) => setConfig({ ...config, bg: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={config.bg}
                    onChange={(e) => setConfig({ ...config, bg: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Text Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.color}
                    onChange={(e) => setConfig({ ...config, color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={config.color}
                    onChange={(e) => setConfig({ ...config, color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Font Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['sans', 'serif', 'mono'] as const).map((font) => (
                  <button
                    key={font}
                    onClick={() => setConfig({ ...config, font })}
                    className={`p-3 rounded-lg border text-sm transition-all capitalize ${
                      config.font === font
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-slate-600 hover:border-slate-500 text-slate-300'
                    }`}
                    style={{ fontFamily: fontFamily[font] }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="animate"
                checked={config.animate}
                onChange={(e) => setConfig({ ...config, animate: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-purple-500"
              />
              <label htmlFor="animate" className="text-sm text-slate-300">
                Enable subtle pulse animation
              </label>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={handleCopy}
                disabled={!config.text}
                className={`w-full py-4 rounded-lg font-semibold transition-all ${
                  config.text
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {copied ? '✓ Copied to Clipboard!' : 'Copy Shareable Link'}
              </button>

              {config.text && (
                <a
                  href={generateUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 rounded-lg font-semibold text-center border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-all"
                >
                  Preview Fullscreen →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    }>
      <AnnounceContent />
    </Suspense>
  );
}
