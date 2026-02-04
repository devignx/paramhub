'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { pack, unpack, copyToClipboard } from '@/lib/url-utils';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-java';

interface CodeConfig {
  code: string;
  lang: string;
  theme: 'dracula' | 'github' | 'monokai' | 'nord';
  showLineNumbers: boolean;
  title?: string;
}

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
];

const themeStyles = {
  dracula: {
    bg: '#282a36',
    text: '#f8f8f2',
    comment: '#6272a4',
    keyword: '#ff79c6',
    string: '#f1fa8c',
    function: '#50fa7b',
    number: '#bd93f9',
  },
  github: {
    bg: '#ffffff',
    text: '#24292e',
    comment: '#6a737d',
    keyword: '#d73a49',
    string: '#032f62',
    function: '#6f42c1',
    number: '#005cc5',
  },
  monokai: {
    bg: '#272822',
    text: '#f8f8f2',
    comment: '#75715e',
    keyword: '#f92672',
    string: '#e6db74',
    function: '#a6e22e',
    number: '#ae81ff',
  },
  nord: {
    bg: '#2e3440',
    text: '#d8dee9',
    comment: '#616e88',
    keyword: '#81a1c1',
    string: '#a3be8c',
    function: '#88c0d0',
    number: '#b48ead',
  },
};

function CodeContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<CodeConfig>({
    code: `function greet(name) {\n  console.log(\`Hello, \${name}!\`);\n}\n\ngreet('World');`,
    lang: 'javascript',
    theme: 'dracula',
    showLineNumbers: true,
    title: '',
  });
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');

  useEffect(() => {
    const lang = searchParams.get('lang');
    const theme = searchParams.get('theme') as CodeConfig['theme'];
    const lines = searchParams.get('lines');
    const title = searchParams.get('title');
    const hash = window.location.hash;

    if (hash) {
      const codeData = unpack<{ code: string }>(hash.slice(1));
      if (codeData) {
        setIsCreating(false);
        setConfig({
          code: codeData.code,
          lang: lang || 'javascript',
          theme: theme || 'dracula',
          showLineNumbers: lines !== 'false',
          title: title || undefined,
        });
      }
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const grammar = Prism.languages[config.lang] || Prism.languages.javascript;
      const highlighted = Prism.highlight(config.code, grammar, config.lang);
      setHighlightedCode(highlighted);
    } catch {
      setHighlightedCode(config.code);
    }
  }, [config.code, config.lang]);

  const generateUrl = () => {
    const params = new URLSearchParams({
      lang: config.lang,
      theme: config.theme,
    });
    if (!config.showLineNumbers) params.set('lines', 'false');
    if (config.title) params.set('title', config.title);
    const hash = pack({ code: config.code });
    return `${window.location.origin}/code?${params.toString()}#${hash}`;
  };

  const handleCopy = async () => {
    const url = generateUrl();
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(config.code);
    if (success) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const theme = themeStyles[config.theme];
  const lines = config.code.split('\n');

  if (!isCreating) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl">
          <div
            className="rounded-xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: theme.bg }}
          >
            {/* Window header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-black/20">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              {config.title && (
                <span className="ml-4 text-sm opacity-60" style={{ color: theme.text }}>
                  {config.title}
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs opacity-40 uppercase" style={{ color: theme.text }}>
                  {config.lang}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded hover:bg-white/10 transition-colors"
                  title="Copy code"
                >
                  {copiedCode ? (
                    <svg className="w-4 h-4" style={{ color: theme.function }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 opacity-60" style={{ color: theme.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Code content */}
            <div className="p-4 overflow-x-auto">
              <pre className="font-mono text-sm leading-relaxed">
                <code>
                  {lines.map((line, i) => (
                    <div key={i} className="flex">
                      {config.showLineNumbers && (
                        <span
                          className="select-none pr-4 text-right w-8 opacity-40"
                          style={{ color: theme.comment }}
                        >
                          {i + 1}
                        </span>
                      )}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: Prism.highlight(
                            line || ' ',
                            Prism.languages[config.lang] || Prism.languages.javascript,
                            config.lang
                          ),
                        }}
                        style={{ color: theme.text }}
                      />
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </div>
        <Link
          href="/code"
          className="fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          Create Your Own
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
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
            💻 Create a Code Snap
          </h1>
          <p className="text-slate-400 mb-8">
            Beautiful syntax-highlighted code blocks, perfect for embedding in blogs or sharing.
          </p>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Language
                </label>
                <select
                  value={config.lang}
                  onChange={(e) => setConfig({ ...config, lang: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Theme
                </label>
                <select
                  value={config.theme}
                  onChange={(e) => setConfig({ ...config, theme: e.target.value as CodeConfig['theme'] })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="dracula">Dracula</option>
                  <option value="github">GitHub Light</option>
                  <option value="monokai">Monokai</option>
                  <option value="nord">Nord</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Title (Optional)
              </label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="my-component.tsx"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Code *
              </label>
              <textarea
                value={config.code}
                onChange={(e) => setConfig({ ...config, code: e.target.value })}
                rows={12}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm resize-none"
                placeholder="Paste your code here..."
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="lineNumbers"
                checked={config.showLineNumbers}
                onChange={(e) => setConfig({ ...config, showLineNumbers: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="lineNumbers" className="text-sm text-slate-300">
                Show line numbers
              </label>
            </div>

            {/* Preview */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: theme.bg }}
            >
              <div className="flex items-center gap-2 px-4 py-3 bg-black/20">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                {config.title && (
                  <span className="ml-4 text-sm opacity-60" style={{ color: theme.text }}>
                    {config.title}
                  </span>
                )}
              </div>
              <div className="p-4 overflow-x-auto max-h-64">
                <pre className="font-mono text-sm leading-relaxed">
                  <code>
                    {lines.slice(0, 10).map((line, i) => (
                      <div key={i} className="flex">
                        {config.showLineNumbers && (
                          <span
                            className="select-none pr-4 text-right w-8 opacity-40"
                            style={{ color: theme.comment }}
                          >
                            {i + 1}
                          </span>
                        )}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: Prism.highlight(
                              line || ' ',
                              Prism.languages[config.lang] || Prism.languages.javascript,
                              config.lang
                            ),
                          }}
                          style={{ color: theme.text }}
                        />
                      </div>
                    ))}
                    {lines.length > 10 && (
                      <div className="opacity-40" style={{ color: theme.comment }}>
                        ... {lines.length - 10} more lines
                      </div>
                    )}
                  </code>
                </pre>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={handleCopy}
                disabled={!config.code}
                className={`w-full py-4 rounded-lg font-semibold transition-all ${
                  config.code
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {copied ? '✓ Copied to Clipboard!' : 'Copy Shareable Link'}
              </button>

              {config.code && (
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

      <style jsx global>{`
        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
          color: ${theme.comment};
        }
        .token.punctuation {
          color: ${theme.text};
        }
        .token.property,
        .token.tag,
        .token.boolean,
        .token.number,
        .token.constant,
        .token.symbol,
        .token.deleted {
          color: ${theme.number};
        }
        .token.selector,
        .token.attr-name,
        .token.string,
        .token.char,
        .token.builtin,
        .token.inserted {
          color: ${theme.string};
        }
        .token.operator,
        .token.entity,
        .token.url,
        .language-css .token.string,
        .style .token.string {
          color: ${theme.text};
        }
        .token.atrule,
        .token.attr-value,
        .token.keyword {
          color: ${theme.keyword};
        }
        .token.function,
        .token.class-name {
          color: ${theme.function};
        }
        .token.regex,
        .token.important,
        .token.variable {
          color: ${theme.string};
        }
      `}</style>
    </div>
  );
}

export default function CodePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    }>
      <CodeContent />
    </Suspense>
  );
}
