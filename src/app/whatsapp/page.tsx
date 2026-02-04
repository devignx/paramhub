'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { PageHeader, CreatorCard, ActionButtons, TextInput, OptionGrid } from '@/components/shared';
import { ViewContainer, CreatorContainer } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle } from 'lucide-react';

interface WhatsAppConfig {
  num: string;
  msg: string;
  theme: 'green' | 'minimal' | 'dark';
}

const themeStyles = {
  green: {
    bg: 'bg-green-500',
    button: 'bg-white text-green-600 hover:bg-green-50',
    text: 'text-white',
    subtext: 'text-white/80',
  },
  minimal: {
    bg: 'bg-white',
    button: 'bg-green-500 text-white hover:bg-green-600',
    text: 'text-gray-900',
    subtext: 'text-gray-500',
  },
  dark: {
    bg: 'bg-zinc-900',
    button: 'bg-green-500 text-white hover:bg-green-600',
    text: 'text-white',
    subtext: 'text-zinc-400',
  },
};

function WhatsAppContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<WhatsAppConfig>({
    num: '',
    msg: '',
    theme: 'green',
  });

  useEffect(() => {
    const num = searchParams.get('num');
    const msg = searchParams.get('msg');
    const theme = searchParams.get('theme') as WhatsAppConfig['theme'];

    if (num) {
      setIsCreating(false);
      setConfig({
        num: num || '',
        msg: msg || '',
        theme: theme || 'green',
      });
    }
  }, [searchParams]);

  const generateWhatsAppUrl = () => {
    const cleanNum = config.num.replace(/\D/g, '');
    const url = new URL('https://wa.me/' + cleanNum);
    if (config.msg) {
      url.searchParams.set('text', config.msg);
    }
    return url.toString();
  };

  const generateUrl = () => {
    const params = new URLSearchParams({
      num: config.num,
      theme: config.theme,
    });
    if (config.msg) params.set('msg', config.msg);
    return `${window.location.origin}/whatsapp?${params.toString()}`;
  };

  const theme = themeStyles[config.theme];

  if (!isCreating) {
    return (
      <ViewContainer createHref="/whatsapp" className={`${theme.bg} flex items-center justify-center p-8 min-h-screen`}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
            <MessageCircle className={`w-10 h-10 ${config.theme === 'minimal' ? 'text-green-500' : 'text-white'}`} />
          </div>
          <h1 className={`text-2xl font-serif mb-2 ${theme.text}`}>
            Start a Conversation
          </h1>
          <p className={`text-sm mb-6 ${theme.subtext}`}>
            Click below to chat on WhatsApp
          </p>
          {config.msg && (
            <div className={`p-4 rounded-lg mb-6 text-left ${config.theme === 'minimal' ? 'bg-gray-100' : 'bg-white/10'}`}>
              <p className={`text-sm ${theme.subtext}`}>Pre-filled message:</p>
              <p className={`text-sm font-medium ${theme.text}`}>{config.msg}</p>
            </div>
          )}
          <a href={generateWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className={`${theme.button} px-8`}>
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat on WhatsApp
            </Button>
          </a>
          <p className={`text-xs mt-4 ${theme.subtext}`}>
            No need to save this contact first
          </p>
        </div>
      </ViewContainer>
    );
  }

  return (
    <CreatorContainer>
      <PageHeader
        title="WhatsApp Link"
        description="Click to chat without saving contact first."
      />

      <CreatorCard title="Create WhatsApp Link" description="Generate a direct chat link for any number.">
        <div className="space-y-6">
          <TextInput
            label="Phone Number"
            value={config.num}
            onChange={(num) => setConfig({ ...config, num })}
            placeholder="+1 234 567 8900"
            required
          />
          <p className="text-xs text-muted-foreground -mt-4">
            Include country code (e.g., +1 for US, +91 for India)
          </p>

          <div className="space-y-2">
            <Label>Pre-filled Message (optional)</Label>
            <Textarea
              value={config.msg}
              onChange={(e) => setConfig({ ...config, msg: e.target.value })}
              placeholder="Hey! I saw your listing and I'm interested..."
              rows={3}
            />
          </div>

          <OptionGrid
            label="Button Style"
            options={[
              { value: 'green', label: 'WhatsApp' },
              { value: 'minimal', label: 'Minimal' },
              { value: 'dark', label: 'Dark' },
            ]}
            value={config.theme}
            onChange={(theme) => setConfig({ ...config, theme })}
            columns={3}
          />

          {/* Preview */}
          <div className={`p-8 rounded-lg ${theme.bg} text-center`}>
            <MessageCircle className={`w-8 h-8 mx-auto mb-3 ${config.theme === 'minimal' ? 'text-green-500' : 'text-white'}`} />
            <p className={`text-sm ${theme.text}`}>Chat on WhatsApp</p>
          </div>

          <ActionButtons generateUrl={generateUrl} disabled={!config.num} />
        </div>
      </CreatorCard>
    </CreatorContainer>
  );
}

export default function WhatsAppPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <WhatsAppContent />
    </Suspense>
  );
}
