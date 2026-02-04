'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { PageHeader, CreatorCard, ActionButtons, TextInput, OptionGrid, TextAreaInput } from '@/components/shared';
import { ViewContainer, CreatorContainer } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Github, Twitter, Linkedin, Globe, Mail, ArrowUpRight } from 'lucide-react';

interface CardConfig {
  name: string;
  title: string;
  bio: string;
  links: { type: string; handle: string }[];
  theme: 'minimal' | 'dark' | 'gradient';
}

const themeStyles = {
  minimal: {
    bg: 'bg-white',
    card: 'bg-white border border-gray-200',
    text: 'text-gray-900',
    subtext: 'text-gray-500',
    link: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  },
  dark: {
    bg: 'bg-zinc-950',
    card: 'bg-zinc-900 border border-zinc-800',
    text: 'text-white',
    subtext: 'text-zinc-400',
    link: 'bg-zinc-800 hover:bg-zinc-700 text-white',
  },
  gradient: {
    bg: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500',
    card: 'bg-white/95 backdrop-blur-sm',
    text: 'text-gray-900',
    subtext: 'text-gray-600',
    link: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  },
};

const linkIcons: Record<string, React.ElementType> = {
  gh: Github,
  github: Github,
  tw: Twitter,
  twitter: Twitter,
  li: Linkedin,
  linkedin: Linkedin,
  web: Globe,
  website: Globe,
  email: Mail,
};

const linkUrls: Record<string, (handle: string) => string> = {
  gh: (h) => `https://github.com/${h}`,
  github: (h) => `https://github.com/${h}`,
  tw: (h) => `https://twitter.com/${h}`,
  twitter: (h) => `https://twitter.com/${h}`,
  li: (h) => `https://linkedin.com/in/${h}`,
  linkedin: (h) => `https://linkedin.com/in/${h}`,
  web: (h) => h.startsWith('http') ? h : `https://${h}`,
  website: (h) => h.startsWith('http') ? h : `https://${h}`,
  email: (h) => `mailto:${h}`,
};

function parseLinks(linksStr: string): { type: string; handle: string }[] {
  return linksStr.split(',').map((l) => {
    const [type, handle] = l.trim().split(':');
    return { type: type?.toLowerCase() || '', handle: handle || '' };
  }).filter((l) => l.type && l.handle);
}

function CardContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<CardConfig>({
    name: '',
    title: '',
    bio: '',
    links: [],
    theme: 'minimal',
  });
  const [linksInput, setLinksInput] = useState('gh:username,tw:username');

  useEffect(() => {
    const name = searchParams.get('name');
    const title = searchParams.get('title');
    const bio = searchParams.get('bio');
    const links = searchParams.get('links');
    const theme = searchParams.get('theme') as CardConfig['theme'];

    if (name) {
      setIsCreating(false);
      setConfig({
        name: name || '',
        title: title || '',
        bio: bio || '',
        links: links ? parseLinks(links) : [],
        theme: theme || 'minimal',
      });
    }
  }, [searchParams]);

  const handleLinksChange = (value: string) => {
    setLinksInput(value);
    setConfig({ ...config, links: parseLinks(value) });
  };

  const generateUrl = () => {
    const params = new URLSearchParams({
      name: config.name,
      theme: config.theme,
    });
    if (config.title) params.set('title', config.title);
    if (config.bio) params.set('bio', config.bio);
    if (config.links.length > 0) {
      params.set('links', config.links.map((l) => `${l.type}:${l.handle}`).join(','));
    }
    return `${window.location.origin}/card?${params.toString()}`;
  };

  const theme = themeStyles[config.theme];

  if (!isCreating) {
    return (
      <ViewContainer createHref="/card" className={`${theme.bg} flex items-center justify-center p-8 min-h-screen`}>
        <div className={`${theme.card} rounded-2xl p-8 max-w-sm w-full text-center shadow-xl`}>
          {/* Avatar placeholder */}
          <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl font-serif ${config.theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {config.name.charAt(0).toUpperCase()}
          </div>

          <h1 className={`text-2xl font-serif mb-1 ${theme.text}`}>{config.name}</h1>
          {config.title && (
            <p className={`text-sm mb-3 ${theme.subtext}`}>{config.title}</p>
          )}
          {config.bio && (
            <p className={`text-sm mb-6 ${theme.text} opacity-80`}>{config.bio}</p>
          )}

          {/* Links */}
          {config.links.length > 0 && (
            <div className="space-y-2">
              {config.links.map((link, i) => {
                const Icon = linkIcons[link.type] || Globe;
                const url = linkUrls[link.type]?.(link.handle) || '#';
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${theme.link}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium capitalize">{link.type}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 opacity-50" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </ViewContainer>
    );
  }

  return (
    <CreatorContainer>
      <PageHeader
        title="Portfolio Card"
        description="Digital business card with social links."
      />

      <CreatorCard title="Create Card" description="Zero-asset hosting for your digital identity.">
        <div className="space-y-6">
          <TextInput
            label="Name"
            value={config.name}
            onChange={(name) => setConfig({ ...config, name })}
            placeholder="Alex Smith"
            required
          />

          <TextInput
            label="Title/Role"
            value={config.title}
            onChange={(title) => setConfig({ ...config, title })}
            placeholder="Full Stack Developer"
          />

          <TextAreaInput
            label="Bio"
            value={config.bio}
            onChange={(bio) => setConfig({ ...config, bio })}
            placeholder="Building cool stuff on the web."
            rows={2}
          />

          <TextInput
            label="Links"
            value={linksInput}
            onChange={handleLinksChange}
            placeholder="gh:username,tw:handle,li:profile"
          />
          <p className="text-xs text-muted-foreground -mt-4">
            Format: type:handle (gh, tw, li, web, email)
          </p>

          <OptionGrid
            label="Theme"
            options={[
              { value: 'minimal', label: 'Minimal' },
              { value: 'dark', label: 'Dark' },
              { value: 'gradient', label: 'Gradient' },
            ]}
            value={config.theme}
            onChange={(theme) => setConfig({ ...config, theme })}
            columns={3}
          />

          {/* Preview */}
          <div className={`p-6 rounded-lg ${theme.bg}`}>
            <div className={`${theme.card} rounded-xl p-6 text-center mx-auto max-w-xs`}>
              <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-xl font-serif ${config.theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {config.name.charAt(0).toUpperCase() || '?'}
              </div>
              <h2 className={`text-lg font-serif ${theme.text}`}>{config.name || 'Your Name'}</h2>
              {config.title && (
                <p className={`text-xs ${theme.subtext}`}>{config.title}</p>
              )}
            </div>
          </div>

          <ActionButtons generateUrl={generateUrl} disabled={!config.name} />
        </div>
      </CreatorCard>
    </CreatorContainer>
  );
}

export default function CardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <CardContent />
    </Suspense>
  );
}
