'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { PageHeader, CreatorCard, ActionButtons, TextInput, OptionGrid } from '@/components/shared';
import { ViewContainer, CreatorContainer } from '@/components/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckSquare } from 'lucide-react';

interface ChecklistConfig {
  items: string[];
  checked: boolean[];
  title: string;
  theme: 'minimal' | 'paper' | 'dark';
}

const themeStyles = {
  minimal: {
    bg: 'bg-background',
    card: 'bg-card border border-border',
    text: 'text-foreground',
    subtext: 'text-muted-foreground',
    item: 'border-border',
  },
  paper: {
    bg: 'bg-amber-50',
    card: 'bg-white shadow-lg',
    text: 'text-amber-900',
    subtext: 'text-amber-700',
    item: 'border-amber-200',
  },
  dark: {
    bg: 'bg-zinc-950',
    card: 'bg-zinc-900 border border-zinc-800',
    text: 'text-white',
    subtext: 'text-zinc-400',
    item: 'border-zinc-700',
  },
};

function ChecklistContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<ChecklistConfig>({
    items: ['Milk', 'Eggs', 'Bread'],
    checked: [],
    title: 'Shopping List',
    theme: 'minimal',
  });

  useEffect(() => {
    const items = searchParams.get('items');
    const title = searchParams.get('title');
    const checked = searchParams.get('checked');
    const theme = searchParams.get('theme') as ChecklistConfig['theme'];

    if (items) {
      setIsCreating(false);
      const itemList = items.split(',').map((i) => i.trim());
      const checkedList = checked ? checked.split(',').map((c) => c === '1') : new Array(itemList.length).fill(false);
      setConfig({
        items: itemList,
        checked: checkedList,
        title: title || 'Checklist',
        theme: theme || 'minimal',
      });
    }
  }, [searchParams]);

  // Update URL when checked state changes (the magic!)
  const updateCheckedState = useCallback((index: number) => {
    setConfig((prev) => {
      const newChecked = [...prev.checked];
      newChecked[index] = !newChecked[index];

      // Update URL without reload using replaceState
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        params.set('checked', newChecked.map((c) => (c ? '1' : '0')).join(','));
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
      }

      return { ...prev, checked: newChecked };
    });
  }, []);

  const generateUrl = () => {
    const params = new URLSearchParams({
      items: config.items.join(','),
      title: config.title,
      theme: config.theme,
    });
    return `${window.location.origin}/checklist?${params.toString()}`;
  };

  const handleItemsChange = (value: string) => {
    const items = value.split('\n').filter((i) => i.trim());
    setConfig({ ...config, items, checked: new Array(items.length).fill(false) });
  };

  const theme = themeStyles[config.theme];
  const completedCount = config.checked.filter(Boolean).length;
  const progress = config.items.length > 0 ? (completedCount / config.items.length) * 100 : 0;

  if (!isCreating) {
    return (
      <ViewContainer createHref="/checklist" className={`${theme.bg} flex items-center justify-center p-8 min-h-screen`}>
        <div className={`${theme.card} rounded-xl p-6 max-w-md w-full`}>
          <div className="flex items-center gap-3 mb-4">
            <CheckSquare className={`w-5 h-5 ${theme.text}`} />
            <h1 className={`text-xl font-serif ${theme.text}`}>{config.title}</h1>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-1">
              <span className={theme.subtext}>{completedCount} of {config.items.length} complete</span>
              <span className={theme.subtext}>{Math.round(progress)}%</span>
            </div>
            <div className={`h-1.5 rounded-full ${config.theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'}`}>
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            {config.items.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border ${theme.item} cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
                onClick={() => updateCheckedState(index)}
              >
                <Checkbox
                  checked={config.checked[index] || false}
                  onCheckedChange={() => updateCheckedState(index)}
                />
                <span className={`flex-1 ${config.checked[index] ? 'line-through opacity-50' : ''} ${theme.text}`}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          <p className={`text-xs mt-6 text-center ${theme.subtext}`}>
            Check items off — your progress is saved in the URL!
          </p>
        </div>
      </ViewContainer>
    );
  }

  return (
    <CreatorContainer>
      <PageHeader
        title="Checklist"
        description="Interactive checklist with state persistence in URL."
      />

      <CreatorCard title="Create Checklist" description="Share a list that saves checked state in the URL.">
        <div className="space-y-6">
          <TextInput
            label="List Title"
            value={config.title}
            onChange={(title) => setConfig({ ...config, title })}
            placeholder="Shopping List"
          />

          <div className="space-y-2">
            <Label>Items (one per line)</Label>
            <Textarea
              value={config.items.join('\n')}
              onChange={(e) => handleItemsChange(e.target.value)}
              placeholder="Milk&#10;Eggs&#10;Bread&#10;Coffee"
              rows={6}
            />
            <p className="text-xs text-muted-foreground">{config.items.length} items</p>
          </div>

          <OptionGrid
            label="Theme"
            options={[
              { value: 'minimal', label: 'Minimal' },
              { value: 'paper', label: 'Paper' },
              { value: 'dark', label: 'Dark' },
            ]}
            value={config.theme}
            onChange={(theme) => setConfig({ ...config, theme })}
            columns={3}
          />

          {/* Preview */}
          <div className={`p-6 rounded-lg ${theme.bg}`}>
            <div className={`${theme.card} rounded-lg p-4`}>
              <h2 className={`text-lg font-serif mb-3 ${theme.text}`}>{config.title || 'Checklist'}</h2>
              <div className="space-y-2">
                {config.items.slice(0, 3).map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded border ${theme.item}`}>
                    <Checkbox disabled />
                    <span className={`text-sm ${theme.text}`}>{item}</span>
                  </div>
                ))}
                {config.items.length > 3 && (
                  <p className={`text-xs ${theme.subtext}`}>...and {config.items.length - 3} more</p>
                )}
              </div>
            </div>
          </div>

          <ActionButtons generateUrl={generateUrl} disabled={config.items.length === 0} />
        </div>
      </CreatorCard>
    </CreatorContainer>
  );
}

export default function ChecklistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <ChecklistContent />
    </Suspense>
  );
}
