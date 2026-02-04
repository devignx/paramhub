'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { pack, unpack, copyToClipboard } from '@/lib/url-utils';

interface TerminalConfig {
  commands: { cmd: string; output: string }[];
  theme: 'dark' | 'green' | 'ubuntu' | 'powershell';
  title: string;
  prompt: string;
}

const themeStyles = {
  dark: {
    bg: '#1e1e1e',
    text: '#d4d4d4',
    prompt: '#569cd6',
    output: '#9cdcfe',
    header: '#323232',
  },
  green: {
    bg: '#0c0c0c',
    text: '#00ff00',
    prompt: '#00ff00',
    output: '#00cc00',
    header: '#1a1a1a',
  },
  ubuntu: {
    bg: '#300a24',
    text: '#ffffff',
    prompt: '#8ae234',
    output: '#d3d7cf',
    header: '#2d0922',
  },
  powershell: {
    bg: '#012456',
    text: '#ffffff',
    prompt: '#ffff00',
    output: '#ffffff',
    header: '#001830',
  },
};

function TerminalContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<TerminalConfig>({
    commands: [
      { cmd: 'npm install', output: 'added 142 packages in 3.2s' },
      { cmd: 'npm run build', output: '✓ Compiled successfully!' },
    ],
    theme: 'dark',
    title: 'Terminal',
    prompt: '$ ',
  });
  const [copied, setCopied] = useState(false);
  const [displayedLines, setDisplayedLines] = useState<{ type: 'cmd' | 'output'; text: string; visible: boolean }[]>([]);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const theme = searchParams.get('theme') as TerminalConfig['theme'];
    const title = searchParams.get('title');
    const prompt = searchParams.get('prompt');
    const hash = window.location.hash;

    if (hash) {
      const data = unpack<{ commands: TerminalConfig['commands'] }>(hash.slice(1));
      if (data) {
        setIsCreating(false);
        setConfig({
          commands: data.commands,
          theme: theme || 'dark',
          title: title || 'Terminal',
          prompt: prompt || '$ ',
        });
      }
    }
  }, [searchParams]);

  // Typing animation
  useEffect(() => {
    if (isCreating || animationComplete) return;

    const allLines: { type: 'cmd' | 'output'; text: string }[] = [];
    config.commands.forEach((c) => {
      allLines.push({ type: 'cmd', text: c.cmd });
      if (c.output) {
        c.output.split('\n').forEach((line) => {
          allLines.push({ type: 'output', text: line });
        });
      }
    });

    if (currentLineIndex >= allLines.length) {
      setAnimationComplete(true);
      return;
    }

    const currentLine = allLines[currentLineIndex];

    if (currentLine.type === 'cmd') {
      // Type command character by character
      if (currentCharIndex <= currentLine.text.length) {
        const timer = setTimeout(() => {
          setDisplayedLines((prev) => {
            const newLines = [...prev];
            if (newLines.length <= currentLineIndex) {
              newLines.push({ ...currentLine, text: currentLine.text.slice(0, currentCharIndex), visible: true });
            } else {
              newLines[currentLineIndex] = { ...currentLine, text: currentLine.text.slice(0, currentCharIndex), visible: true };
            }
            return newLines;
          });
          setCurrentCharIndex((prev) => prev + 1);
        }, 50);
        return () => clearTimeout(timer);
      } else {
        // Command typing complete, move to next line
        setTimeout(() => {
          setCurrentLineIndex((prev) => prev + 1);
          setCurrentCharIndex(0);
        }, 200);
      }
    } else {
      // Output appears instantly
      setDisplayedLines((prev) => [
        ...prev,
        { ...currentLine, visible: true },
      ]);
      setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
        setCurrentCharIndex(0);
      }, 100);
    }
  }, [isCreating, config.commands, currentLineIndex, currentCharIndex, animationComplete]);

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayedLines]);

  const generateUrl = () => {
    const params = new URLSearchParams({
      theme: config.theme,
      title: config.title,
      prompt: config.prompt,
    });
    const hash = pack({ commands: config.commands });
    return `${window.location.origin}/terminal?${params.toString()}#${hash}`;
  };

  const handleCopy = async () => {
    const url = generateUrl();
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const addCommand = () => {
    setConfig({
      ...config,
      commands: [...config.commands, { cmd: '', output: '' }],
    });
  };

  const updateCommand = (index: number, field: 'cmd' | 'output', value: string) => {
    const newCommands = [...config.commands];
    newCommands[index] = { ...newCommands[index], [field]: value };
    setConfig({ ...config, commands: newCommands });
  };

  const removeCommand = (index: number) => {
    setConfig({
      ...config,
      commands: config.commands.filter((_, i) => i !== index),
    });
  };

  const theme = themeStyles[config.theme];

  if (!isCreating) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-3xl">
          <div
            className="rounded-xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: theme.bg }}
          >
            {/* Window header */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ backgroundColor: theme.header }}
            >
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="ml-4 text-sm opacity-60" style={{ color: theme.text }}>
                {config.title}
              </span>
            </div>

            {/* Terminal content */}
            <div
              ref={terminalRef}
              className="p-4 font-mono text-sm min-h-[300px] max-h-[500px] overflow-y-auto"
              style={{ color: theme.text }}
            >
              {displayedLines.map((line, i) => (
                <div key={i} className="leading-relaxed">
                  {line.type === 'cmd' ? (
                    <div className="flex">
                      <span style={{ color: theme.prompt }}>{config.prompt}</span>
                      <span>{line.text}</span>
                      {i === currentLineIndex - 1 || (i === displayedLines.length - 1 && !animationComplete && line.type === 'cmd') ? (
                        <span className="terminal-cursor ml-0.5 border-r-2" style={{ borderColor: theme.text }}>
                          &nbsp;
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div style={{ color: theme.output }}>{line.text}</div>
                  )}
                </div>
              ))}
              {animationComplete && (
                <div className="flex">
                  <span style={{ color: theme.prompt }}>{config.prompt}</span>
                  <span className="terminal-cursor border-r-2" style={{ borderColor: theme.text }}>
                    &nbsp;
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <Link
          href="/terminal"
          className="fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          Create Your Own
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
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
            ⌨️ Create a Mock Terminal
          </h1>
          <p className="text-slate-400 mb-8">
            A fake terminal window with typing animation for demos and tutorials.
          </p>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Window Title
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  placeholder="Terminal"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Prompt
                </label>
                <input
                  type="text"
                  value={config.prompt}
                  onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                  placeholder="$ "
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono"
                />
              </div>
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
                        ? 'border-slate-400 ring-2 ring-slate-400/50'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    style={{ backgroundColor: themeStyles[t].bg, color: themeStyles[t].text }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Commands & Output
              </label>
              <div className="space-y-4">
                {config.commands.map((cmd, index) => (
                  <div key={index} className="p-4 bg-slate-700/30 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono">{config.prompt}</span>
                      <input
                        type="text"
                        value={cmd.cmd}
                        onChange={(e) => updateCommand(index, 'cmd', e.target.value)}
                        placeholder="npm install"
                        className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono text-sm"
                      />
                      <button
                        onClick={() => removeCommand(index)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <textarea
                      value={cmd.output}
                      onChange={(e) => updateCommand(index, 'output', e.target.value)}
                      placeholder="Command output (optional)..."
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono text-sm resize-none"
                    />
                  </div>
                ))}
                <button
                  onClick={addCommand}
                  className="w-full py-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors"
                >
                  + Add Command
                </button>
              </div>
            </div>

            {/* Preview */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: theme.bg }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ backgroundColor: theme.header }}
              >
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="ml-4 text-sm opacity-60" style={{ color: theme.text }}>
                  {config.title}
                </span>
              </div>
              <div className="p-4 font-mono text-sm max-h-48 overflow-y-auto" style={{ color: theme.text }}>
                {config.commands.slice(0, 3).map((cmd, i) => (
                  <div key={i}>
                    <div>
                      <span style={{ color: theme.prompt }}>{config.prompt}</span>
                      {cmd.cmd}
                    </div>
                    {cmd.output && (
                      <div style={{ color: theme.output }}>{cmd.output}</div>
                    )}
                  </div>
                ))}
                {config.commands.length > 3 && (
                  <div className="opacity-40">... {config.commands.length - 3} more commands</div>
                )}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={handleCopy}
                disabled={config.commands.every((c) => !c.cmd)}
                className={`w-full py-4 rounded-lg font-semibold transition-all ${
                  config.commands.some((c) => c.cmd)
                    ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-500 hover:to-slate-600'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {copied ? '✓ Copied to Clipboard!' : 'Copy Shareable Link'}
              </button>

              {config.commands.some((c) => c.cmd) && (
                <a
                  href={generateUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 rounded-lg font-semibold text-center border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-all"
                >
                  Preview with Animation →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TerminalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-500 border-t-transparent"></div>
      </div>
    }>
      <TerminalContent />
    </Suspense>
  );
}
