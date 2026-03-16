 'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import {
  PageHeader,
  CreatorCard,
  ActionButtons,
  TextInput,
  OptionGrid,
  ColorInput,
} from '@/components/shared';
import { ViewContainer, CreatorContainer } from '@/components/shared';
import { FormField } from '@/components/shared/form-field';
import { Textarea } from '@/components/ui/textarea';

type ErrorLevel = 'L' | 'M' | 'Q' | 'H';
type QrFormat = 'svg' | 'png';
type OutputMode = 'image' | 'json';

interface QrConfig {
  data: string;
  size: number;
  level: ErrorLevel;
  fg: string;
  bg: string;
  includeMargin: boolean;
  format: QrFormat;
  output: OutputMode;
}

function parseNumber(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function QrView({ config }: { config: QrConfig }) {
  const jsonPayload = useMemo(
    () => ({
      data: config.data,
      size: config.size,
      level: config.level,
      fg: config.fg,
      bg: config.bg,
      includeMargin: config.includeMargin,
      format: config.format,
    }),
    [config],
  );

  if (config.output === 'json') {
    return (
      <ViewContainer createHref="/qr" className="bg-background flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-3">
              This is a JSON representation of your QR configuration. You can treat it like an API-style
              response.
            </p>
            <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
              {JSON.stringify(jsonPayload, null, 2)}
            </pre>
          </div>
        </div>
      </ViewContainer>
    );
  }

  // Image output
  const Wrapper = config.format === 'svg' ? QRCodeSVG : QRCodeCanvas;

  return (
    <ViewContainer
      createHref="/qr"
      className="bg-background flex items-center justify-center p-6 min-h-screen"
    >
      <div className="max-w-sm w-full">
        <div className="rounded-2xl border border-border bg-card shadow-xl p-6 flex flex-col items-center gap-4">
          <div className="inline-block p-3 bg-background rounded-xl">
            <Wrapper
              value={config.data}
              size={config.size}
              level={config.level}
              bgColor={config.bg}
              fgColor={config.fg}
              includeMargin={config.includeMargin}
            />
          </div>
          <div className="w-full text-center space-y-1">
            <p className="text-sm font-medium text-foreground truncate">{config.data}</p>
            {/*<p className="text-xs text-muted-foreground">
              Format: {config.format.toUpperCase()} · Error level: {config.level} · Size: {config.size}px
            </p>*/}
          </div>
        </div>
      </div>
    </ViewContainer>
  );
}

function QrContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<QrConfig>({
    data: '',
    size: 256,
    level: 'M',
    fg: '#020617',
    bg: '#ffffff',
    includeMargin: false,
    format: 'svg',
    output: 'image',
  });

  useEffect(() => {
    const data = searchParams.get('d') ?? searchParams.get('data');
    const size = parseNumber(searchParams.get('size'), 256, 64, 1024);
    const level = (searchParams.get('lvl') ?? searchParams.get('level')) as ErrorLevel | null;
    const fg = searchParams.get('fg');
    const bg = searchParams.get('bg');
    const margin = searchParams.get('margin');
    const format = searchParams.get('fmt') as QrFormat | null;
    const output = searchParams.get('out') as OutputMode | null;

    if (data) {
      setIsCreating(false);
      setConfig({
        data,
        size,
        level: level && ['L', 'M', 'Q', 'H'].includes(level) ? level : 'M',
        fg: fg || '#020617',
        bg: bg || '#ffffff',
        includeMargin: margin === '1' || margin === 'true',
        format: format && (format === 'svg' || format === 'png') ? format : 'svg',
        output: output && (output === 'image' || output === 'json') ? output : 'image',
      });
    }
  }, [searchParams]);

  const generateUrl = () => {
    const params = new URLSearchParams({
      d: config.data,
      size: String(config.size),
      lvl: config.level,
      fg: config.fg,
      bg: config.bg,
      fmt: config.format,
    });
    if (config.includeMargin) {
      params.set('margin', '1');
    }
    // Always point copied URL at the API image endpoint for seamless Postman / programmatic use
    return `${window.location.origin}/api/qr?${params.toString()}`;
  };

  const isValid = config.data.trim().length > 0;

  if (!isCreating) {
    return <QrView config={config} />;
  }

  return (
    <CreatorContainer>
      <PageHeader
        title="QR Generator"
        description="Generate highly configurable QR codes fully driven by URL parameters."
      />

      <CreatorCard
        title="Create QR Code"
        description="All customization is encoded in the URL, so you can share or embed it anywhere."
      >
        <div className="space-y-6">
          <FormField label="QR Content" required>
            <Textarea
              value={config.data}
              onChange={(e) => setConfig({ ...config, data: e.target.value })}
              placeholder="Any text, URL, or payload that should be encoded into the QR code."
              rows={3}
              className="bg-background resize-none"
            />
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Size (px)"
              type="number"
              value={String(config.size)}
              onChange={(value) =>
                setConfig({
                  ...config,
                  size: parseNumber(value, 256, 64, 1024),
                })
              }
              placeholder="256"
            />

            <OptionGrid<ErrorLevel>
              label="Error Correction"
              options={[
                { value: 'L', label: 'L (Low)' },
                { value: 'M', label: 'M (Medium)' },
                { value: 'Q', label: 'Q (Quartile)' },
                { value: 'H', label: 'H (High)' },
              ]}
              value={config.level}
              onChange={(level) => setConfig({ ...config, level })}
              columns={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ColorInput
              label="Foreground Color"
              value={config.fg}
              onChange={(fg) => setConfig({ ...config, fg })}
            />
            <ColorInput
              label="Background Color"
              value={config.bg}
              onChange={(bg) => setConfig({ ...config, bg })}
            />
          </div>

          <OptionGrid<QrFormat>
            label="Image Format"
            options={[
              { value: 'svg', label: 'SVG' },
              { value: 'png', label: 'PNG (Canvas)' },
            ]}
            value={config.format}
            onChange={(format) => setConfig({ ...config, format })}
            columns={2}
          />

          <OptionGrid<OutputMode>
            label="Output Type"
            options={[
              { value: 'image', label: 'Image View' },
              { value: 'json', label: 'JSON Payload' },
            ]}
            value={config.output}
            onChange={(output) => setConfig({ ...config, output })}
            columns={2}
          />

          <FormField label="Include Quiet Zone (Margin)">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeMargin}
                onChange={(e) => setConfig({ ...config, includeMargin: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-muted-foreground">
                Add extra white margin around the QR for better scanning.
              </span>
            </label>
          </FormField>

          {/* Live preview */}
          {isValid && (
            <div className="p-6 rounded-lg bg-muted flex justify-center">
              <div className="p-3 bg-background rounded-xl">
                {(config.format === 'svg' ? (
                  <QRCodeSVG
                    value={config.data}
                    size={192}
                    level={config.level}
                    bgColor={config.bg}
                    fgColor={config.fg}
                    includeMargin={config.includeMargin}
                  />
                ) : (
                  <QRCodeCanvas
                    value={config.data}
                    size={192}
                    level={config.level}
                    bgColor={config.bg}
                    fgColor={config.fg}
                    includeMargin={config.includeMargin}
                  />
                ))}
              </div>
            </div>
          )}

          <ActionButtons generateUrl={generateUrl} disabled={!isValid} />

          <p className="text-xs text-muted-foreground mt-2 space-y-1">
            <span className="block">
              Copied link / preview target:{' '}
              <code className="font-mono">/api/qr?d=...&amp;size=...&amp;lvl=...&amp;fg=...&amp;bg=...&amp;fmt=svg|png&amp;margin=1</code>
            </span>
            <span className="block">
              For page view instead, open:{' '}
              <code className="font-mono">/qr?d=...&amp;size=...&amp;lvl=...&amp;fg=...&amp;bg=...&amp;fmt=svg|png&amp;out=image|json&amp;margin=1</code>
            </span>
          </p>
        </div>
      </CreatorCard>
    </CreatorContainer>
  );
}

export default function QrPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-foreground border-t-transparent" />
        </div>
      }
    >
      <QrContent />
    </Suspense>
  );
}

