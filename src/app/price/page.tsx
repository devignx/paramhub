'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { PageHeader, CreatorCard, ActionButtons, TextInput, OptionGrid } from '@/components/shared';
import { ViewContainer, CreatorContainer } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PriceConfig {
  item: string;
  price: string;
  contact: string;
  description: string;
  theme: 'classic' | 'modern' | 'bold';
}

const themeStyles = {
  classic: {
    bg: 'bg-white',
    border: 'border-2 border-black',
    title: 'text-black font-serif',
    price: 'text-black',
    contact: 'text-gray-600',
  },
  modern: {
    bg: 'bg-zinc-900',
    border: 'border border-zinc-700',
    title: 'text-white font-sans',
    price: 'text-green-400',
    contact: 'text-zinc-400',
  },
  bold: {
    bg: 'bg-yellow-400',
    border: 'border-4 border-black',
    title: 'text-black font-bold',
    price: 'text-black',
    contact: 'text-black/70',
  },
};

function PriceContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<PriceConfig>({
    item: '',
    price: '',
    contact: '',
    description: '',
    theme: 'classic',
  });

  useEffect(() => {
    const item = searchParams.get('item');
    const price = searchParams.get('price');
    const contact = searchParams.get('contact');
    const description = searchParams.get('desc');
    const theme = searchParams.get('theme') as PriceConfig['theme'];

    if (item) {
      setIsCreating(false);
      setConfig({
        item: item || '',
        price: price || '',
        contact: contact || '',
        description: description || '',
        theme: theme || 'classic',
      });
    }
  }, [searchParams]);

  const generateUrl = () => {
    const params = new URLSearchParams({
      item: config.item,
      price: config.price,
      theme: config.theme,
    });
    if (config.contact) params.set('contact', config.contact);
    if (config.description) params.set('desc', config.description);
    return `${window.location.origin}/price?${params.toString()}`;
  };

  const theme = themeStyles[config.theme];

  if (!isCreating) {
    return (
      <ViewContainer createHref="/price" className="bg-gray-100 flex items-center justify-center p-8 min-h-screen">
        <div className={`${theme.bg} ${theme.border} rounded-lg p-8 max-w-md w-full text-center shadow-xl`}>
          <div className="mb-2 text-sm font-medium tracking-widest text-gray-500 uppercase">
            For Sale
          </div>
          <h1 className={`text-3xl mb-4 ${theme.title}`}>{config.item}</h1>
          {config.description && (
            <p className={`mb-4 text-sm ${theme.contact}`}>{config.description}</p>
          )}
          <div className={`text-5xl font-bold mb-6 ${theme.price}`}>{config.price}</div>
          {config.contact && (
            <div className={`text-sm ${theme.contact}`}>
              <span className="font-medium">Contact:</span> {config.contact}
            </div>
          )}
        </div>
      </ViewContainer>
    );
  }

  return (
    <CreatorContainer>
      <PageHeader
        title="Price Tag"
        description="Professional 'For Sale' signs for marketplace listings."
      />

      <CreatorCard title="Create Price Tag" description="Generate a clean, printable sale flyer.">
        <div className="space-y-6">
          <TextInput
            label="Item Name"
            value={config.item}
            onChange={(item) => setConfig({ ...config, item })}
            placeholder="Old Bike"
            required
          />

          <TextInput
            label="Price"
            value={config.price}
            onChange={(price) => setConfig({ ...config, price })}
            placeholder="$50"
            required
          />

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              placeholder="Good condition, barely used..."
              rows={2}
            />
          </div>

          <TextInput
            label="Contact Info"
            value={config.contact}
            onChange={(contact) => setConfig({ ...config, contact })}
            placeholder="555-123-4567"
          />

          <OptionGrid
            label="Style"
            options={[
              { value: 'classic', label: 'Classic' },
              { value: 'modern', label: 'Modern' },
              { value: 'bold', label: 'Bold' },
            ]}
            value={config.theme}
            onChange={(theme) => setConfig({ ...config, theme })}
            columns={3}
          />

          {/* Preview */}
          <div className="p-6 bg-gray-100 rounded-lg">
            <div className={`${theme.bg} ${theme.border} rounded-lg p-6 text-center mx-auto max-w-xs`}>
              <div className="mb-1 text-xs tracking-widest text-gray-500 uppercase">For Sale</div>
              <h2 className={`text-xl mb-2 ${theme.title}`}>{config.item || 'Item Name'}</h2>
              <div className={`text-3xl font-bold ${theme.price}`}>{config.price || '$0'}</div>
            </div>
          </div>

          <ActionButtons generateUrl={generateUrl} disabled={!config.item || !config.price} />
        </div>
      </CreatorCard>
    </CreatorContainer>
  );
}

export default function PricePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <PriceContent />
    </Suspense>
  );
}
