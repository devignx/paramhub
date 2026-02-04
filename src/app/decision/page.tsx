'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { copyToClipboard } from '@/lib/url-utils';

interface DecisionConfig {
  options: string[];
  title: string;
  theme: 'rainbow' | 'pastel' | 'neon' | 'earth';
}

const themeColors = {
  rainbow: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
  pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFD9BA', '#E0BBE4', '#D4F0F0', '#FCE4EC'],
  neon: ['#FF00FF', '#00FFFF', '#FF00AA', '#00FF00', '#FFFF00', '#FF6600', '#0066FF', '#FF0066'],
  earth: ['#8D6E63', '#A1887F', '#BCAAA4', '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723'],
};

function DecisionContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<DecisionConfig>({
    options: ['Pizza', 'Burger', 'Sushi', 'Tacos'],
    title: 'What should we eat?',
    theme: 'rainbow',
  });
  const [copied, setCopied] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const opts = searchParams.get('opts');
    const title = searchParams.get('title');
    const theme = searchParams.get('theme') as DecisionConfig['theme'];

    if (opts) {
      setIsCreating(false);
      setConfig({
        options: opts.split(',').map((o) => o.trim()).filter(Boolean),
        title: title || 'Spin to decide!',
        theme: theme || 'rainbow',
      });
    }
  }, [searchParams]);

  // Draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || config.options.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const numOptions = config.options.length;
    const anglePerOption = (2 * Math.PI) / numOptions;
    const colors = themeColors[config.theme];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // Draw segments
    for (let i = 0; i < numOptions; i++) {
      const startAngle = i * anglePerOption - Math.PI / 2;
      const endAngle = (i + 1) * anglePerOption - Math.PI / 2;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerOption / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = config.theme === 'neon' ? '#ffffff' : '#333333';
      ctx.font = `bold ${Math.max(12, Math.min(18, 200 / numOptions))}px system-ui`;
      ctx.fillText(
        config.options[i].length > 15 ? config.options[i].slice(0, 15) + '...' : config.options[i],
        radius - 20,
        5
      );
      ctx.restore();
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }, [config.options, config.theme, rotation]);

  const spin = () => {
    if (isSpinning || config.options.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    const numOptions = config.options.length;
    const anglePerOption = 360 / numOptions;
    const spins = 5 + Math.random() * 3; // 5-8 full rotations
    const extraAngle = Math.random() * 360;
    const totalRotation = spins * 360 + extraAngle;

    const startTime = Date.now();
    const duration = 4000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = easeOut * totalRotation;

      setRotation(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Calculate winner
        const finalAngle = (currentRotation % 360 + 360) % 360;
        const adjustedAngle = (360 - finalAngle + 90) % 360;
        const winnerIndex = Math.floor(adjustedAngle / anglePerOption) % numOptions;
        setWinner(config.options[winnerIndex]);
        setIsSpinning(false);
        setHasSpun(true);
      }
    };

    requestAnimationFrame(animate);
  };

  const generateUrl = () => {
    const params = new URLSearchParams({
      opts: config.options.join(','),
      title: config.title,
      theme: config.theme,
    });
    return `${window.location.origin}/decision?${params.toString()}`;
  };

  const handleCopy = async () => {
    const url = generateUrl();
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOptionsChange = (value: string) => {
    setConfig({
      ...config,
      options: value.split('\n').map((o) => o.trim()).filter(Boolean),
    });
  };

  if (!isCreating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-8">
            {config.title}
          </h1>

          <div className="relative inline-block mb-8">
            {/* Pointer */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg"></div>
            </div>

            <canvas
              ref={canvasRef}
              width={350}
              height={350}
              className="drop-shadow-2xl"
            />
          </div>

          {winner && (
            <div className="mb-8 animate-bounce">
              <p className="text-lg text-white/60 mb-2">The winner is...</p>
              <p className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
                🎉 {winner} 🎉
              </p>
            </div>
          )}

          <button
            onClick={spin}
            disabled={isSpinning}
            className={`px-12 py-4 rounded-full text-xl font-bold transition-all transform ${
              isSpinning
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:scale-105 hover:shadow-xl'
            }`}
          >
            {isSpinning ? 'Spinning...' : hasSpun ? 'Spin Again!' : 'SPIN!'}
          </button>
        </div>

        <Link
          href="/decision"
          className="fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
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
            🎡 Create a Decision Wheel
          </h1>
          <p className="text-slate-400 mb-8">
            Spin the wheel to make decisions. Great for choosing restaurants, activities, or settling debates!
          </p>

          {/* Preview */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-white drop-shadow"></div>
              </div>
              <canvas ref={canvasRef} width={250} height={250} />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Question / Title
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="What should we eat?"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Options (one per line, 2-12 options)
              </label>
              <textarea
                value={config.options.join('\n')}
                onChange={(e) => handleOptionsChange(e.target.value)}
                rows={6}
                placeholder="Pizza&#10;Burger&#10;Sushi&#10;Tacos"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                {config.options.length} option{config.options.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Color Theme
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(themeColors) as Array<keyof typeof themeColors>).map((t) => (
                  <button
                    key={t}
                    onClick={() => setConfig({ ...config, theme: t })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all capitalize ${
                      config.theme === t
                        ? 'border-pink-500 ring-2 ring-pink-500/50'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex gap-1 mb-1 justify-center">
                      {themeColors[t].slice(0, 4).map((color, i) => (
                        <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                      ))}
                    </div>
                    <span className="text-slate-300">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={handleCopy}
                disabled={config.options.length < 2}
                className={`w-full py-4 rounded-lg font-semibold transition-all ${
                  config.options.length >= 2
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {copied ? '✓ Copied to Clipboard!' : 'Copy Shareable Link'}
              </button>

              {config.options.length >= 2 && (
                <a
                  href={generateUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 rounded-lg font-semibold text-center border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-all"
                >
                  Preview & Spin →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DecisionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    }>
      <DecisionContent />
    </Suspense>
  );
}
