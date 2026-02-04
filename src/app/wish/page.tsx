'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import confetti from 'canvas-confetti';
import { PageHeader, CreatorCard, ActionButtons, TextInput, TextAreaInput, OptionGrid } from '@/components/shared';
import { ViewContainer, CreatorContainer } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

type WishType = 'bday' | 'congrats' | 'thanks' | 'love' | 'newyear' | 'custom';

interface WishConfig {
  to: string;
  from: string;
  type: WishType;
  message: string;
  theme: 'confetti' | 'fireworks' | 'hearts' | 'stars' | 'snow';
}

const defaultMessages: Record<WishType, string> = {
  bday: 'Wishing you a fantastic birthday filled with joy and happiness!',
  congrats: 'Congratulations on your amazing achievement!',
  thanks: 'Thank you so much for everything you do!',
  love: 'Sending you all my love and warmest wishes!',
  newyear: 'Happy New Year! May this year bring you success and happiness!',
  custom: 'Wishing you all the best!',
};

const themeConfigs = {
  confetti: {
    fire: () => {
      const count = 200;
      const defaults = { origin: { y: 0.7 }, zIndex: 1000 };
      confetti({ ...defaults, particleCount: count * 0.25, spread: 26, startVelocity: 55 });
      confetti({ ...defaults, particleCount: count * 0.2, spread: 60 });
      confetti({ ...defaults, particleCount: count * 0.35, spread: 100, decay: 0.91, scalar: 0.8 });
      confetti({ ...defaults, particleCount: count * 0.1, spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      confetti({ ...defaults, particleCount: count * 0.1, spread: 120, startVelocity: 45 });
    },
  },
  fireworks: {
    fire: () => {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
      const interval: ReturnType<typeof setInterval> = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() - 0.2 } });
      }, 250);
    },
  },
  hearts: {
    fire: () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff1461', '#ff4d6d', '#ff758f'],
        shapes: ['circle'],
        zIndex: 1000,
      });
    },
  },
  stars: {
    fire: () => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#ffd700', '#ffec8b', '#fff8dc'],
        shapes: ['star'],
        zIndex: 1000,
      });
    },
  },
  snow: {
    fire: () => {
      const duration = 5000;
      const animationEnd = Date.now() + duration;
      const frame = () => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return;
        confetti({
          particleCount: 1,
          startVelocity: 0,
          ticks: Math.max(200, 500 * (timeLeft / duration)),
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors: ['#ffffff'],
          shapes: ['circle'],
          gravity: 0.5,
          scalar: 0.8,
          drift: Math.random() - 0.5,
          zIndex: 1000,
        });
        requestAnimationFrame(frame);
      };
      frame();
    },
  },
};

const themeGradients: Record<string, string> = {
  confetti: 'from-purple-600 via-pink-500 to-orange-400',
  fireworks: 'from-slate-900 via-purple-900 to-slate-900',
  hearts: 'from-pink-400 via-rose-400 to-red-400',
  stars: 'from-indigo-900 via-purple-800 to-indigo-900',
  snow: 'from-blue-200 via-white to-blue-100',
};

const typeEmojis: Record<WishType, string> = {
  bday: '🎂',
  congrats: '🎉',
  thanks: '🙏',
  love: '❤️',
  newyear: '🎆',
  custom: '✨',
};

const typeLabels: Record<WishType, string> = {
  bday: 'Happy Birthday',
  congrats: 'Congratulations',
  thanks: 'Thank You',
  love: 'With Love',
  newyear: 'Happy New Year',
  custom: 'Special Wishes',
};

function WishContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<WishConfig>({
    to: '',
    from: '',
    type: 'bday',
    message: defaultMessages.bday,
    theme: 'confetti',
  });
  const [showCard, setShowCard] = useState(false);

  const fireEffect = useCallback(() => {
    themeConfigs[config.theme].fire();
  }, [config.theme]);

  useEffect(() => {
    const to = searchParams.get('to');
    const from = searchParams.get('from');
    const type = (searchParams.get('type') as WishType) || 'bday';
    const theme = (searchParams.get('theme') as WishConfig['theme']) || 'confetti';
    const msg = searchParams.get('msg');

    if (to) {
      setIsCreating(false);
      setConfig({
        to,
        from: from || '',
        type,
        message: msg || defaultMessages[type],
        theme,
      });
      setTimeout(() => setShowCard(true), 100);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isCreating && showCard) {
      const timer = setTimeout(fireEffect, 500);
      const interval = setInterval(fireEffect, 4000);
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isCreating, showCard, fireEffect]);

  const generateUrl = () => {
    const params = new URLSearchParams({
      to: config.to,
      type: config.type,
      theme: config.theme,
    });
    if (config.from) params.set('from', config.from);
    if (config.message !== defaultMessages[config.type]) {
      params.set('msg', config.message);
    }
    return `${window.location.origin}/wish?${params.toString()}`;
  };

  const handleTypeChange = (type: WishType) => {
    setConfig((prev) => ({
      ...prev,
      type,
      message: defaultMessages[type],
    }));
  };

  const isSnow = config.theme === 'snow';

  if (!isCreating) {
    return (
      <ViewContainer
        createHref="/wish"
        className={`bg-gradient-to-br ${themeGradients[config.theme]} flex items-center justify-center p-4 overflow-hidden min-h-screen`}
      >
        <div className={`transform transition-all duration-1000 ${showCard ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-8xl mb-8 animate-bounce">{typeEmojis[config.type]}</div>
            <h1 className={`text-4xl md:text-6xl font-serif mb-4 ${isSnow ? 'text-slate-800' : 'text-white'} drop-shadow-lg`}>
              {typeLabels[config.type]}
            </h1>
            <h2 className={`text-3xl md:text-5xl font-serif mb-8 ${isSnow ? 'text-slate-700' : 'text-white/90'}`}>
              {config.to}!
            </h2>
            <p className={`text-xl md:text-2xl mb-8 ${isSnow ? 'text-slate-600' : 'text-white/80'}`}>
              {config.message}
            </p>
            {config.from && (
              <p className={`text-lg ${isSnow ? 'text-slate-500' : 'text-white/60'}`}>
                — {config.from}
              </p>
            )}
            <Button
              onClick={fireEffect}
              size="lg"
              className={`mt-12 ${isSnow ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-white/20'}`}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Celebrate Again!
            </Button>
          </div>
        </div>
      </ViewContainer>
    );
  }

  return (
    <CreatorContainer>
      <PageHeader
        title="Wish"
        description="Animated greeting cards with confetti effects."
      />

      <CreatorCard title="Create a Wish" description="Generate a beautiful animated greeting card that lives in a URL.">
        <div className="space-y-6">
          <TextInput
            label="Recipient Name"
            value={config.to}
            onChange={(to) => setConfig({ ...config, to })}
            placeholder="Sarah"
            required
          />

          <TextInput
            label="Your Name"
            value={config.from}
            onChange={(from) => setConfig({ ...config, from })}
            placeholder="John"
          />

          <OptionGrid
            label="Occasion"
            options={[
              { value: 'bday', label: `${typeEmojis.bday} Birthday` },
              { value: 'congrats', label: `${typeEmojis.congrats} Congrats` },
              { value: 'thanks', label: `${typeEmojis.thanks} Thanks` },
              { value: 'love', label: `${typeEmojis.love} Love` },
              { value: 'newyear', label: `${typeEmojis.newyear} New Year` },
              { value: 'custom', label: `${typeEmojis.custom} Custom` },
            ]}
            value={config.type}
            onChange={handleTypeChange}
            columns={3}
          />

          <TextAreaInput
            label="Message"
            value={config.message}
            onChange={(message) => setConfig({ ...config, message })}
            rows={3}
          />

          <OptionGrid
            label="Effect Theme"
            options={[
              { value: 'confetti', label: 'Confetti' },
              { value: 'fireworks', label: 'Fireworks' },
              { value: 'hearts', label: 'Hearts' },
              { value: 'stars', label: 'Stars' },
              { value: 'snow', label: 'Snow' },
            ]}
            value={config.theme}
            onChange={(theme) => setConfig({ ...config, theme })}
            columns={5}
          />

          {/* Preview */}
          <div className={`p-8 rounded-lg bg-gradient-to-br ${themeGradients[config.theme]} text-center`}>
            <div className="text-4xl mb-2">{typeEmojis[config.type]}</div>
            <h2 className={`text-xl font-serif ${config.theme === 'snow' ? 'text-slate-800' : 'text-white'}`}>
              {typeLabels[config.type]}
            </h2>
            <p className={`text-lg font-serif ${config.theme === 'snow' ? 'text-slate-700' : 'text-white/90'}`}>
              {config.to || 'Recipient'}!
            </p>
          </div>

          <ActionButtons generateUrl={generateUrl} disabled={!config.to} />
        </div>
      </CreatorCard>
    </CreatorContainer>
  );
}

export default function WishPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <WishContent />
    </Suspense>
  );
}
