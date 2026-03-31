'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ActionButtons,
  CreatorCard,
  CreatorContainer,
  OptionGrid,
  PageHeader,
  TextAreaInput,
  TextInput,
  ViewContainer,
} from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChartSvg, THEME_STYLES, ThemeStyle } from '@/components/chart/chart-svg';
import {
  calculateChartStats,
  ChartAsset,
  ChartPoint,
  ChartRenderConfig,
  ChartTheme,
  ChartType,
  encodeChartDataForUrl,
  formatMetricValue,
  parseChartDataParam,
  parseLabelsAndValues,
  parsePayloadData,
  sanitizeChartPoints,
} from '@/lib/chart-utils';

const DEFAULT_POINTS: ChartPoint[] = [
  { label: 'Mon', value: 28 },
  { label: 'Tue', value: 42 },
  { label: 'Wed', value: 36 },
  { label: 'Thu', value: 54 },
  { label: 'Fri', value: 61 },
  { label: 'Sat', value: 44 },
];

const DEFAULT_CONFIG: ChartRenderConfig = {
  title: 'Weekly Momentum',
  subtitle: 'Animated SVG charts powered entirely by your URL.',
  chart: 'bar',
  theme: 'aurora',
  metric: '%',
  goal: '60',
  showLabels: true,
  showValues: true,
  data: DEFAULT_POINTS,
};

function pointsToTextarea(points: ChartPoint[]): string {
  return points.map((point) => `${point.label}, ${point.value}`).join('\n');
}

function textareaToPoints(value: string): ChartPoint[] {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return sanitizeChartPoints(
    lines
      .map((line) => {
        const commaIndex = line.lastIndexOf(',');
        const colonIndex = line.lastIndexOf(':');
        const separatorIndex = Math.max(commaIndex, colonIndex);

        if (separatorIndex <= 0) {
          return null;
        }

        const label = line.slice(0, separatorIndex).trim();
        const numericValue = Number(line.slice(separatorIndex + 1).trim());

        if (!label || Number.isNaN(numericValue)) {
          return null;
        }

        return {
          label,
          value: numericValue,
        };
      })
      .filter((point): point is ChartPoint => point !== null),
  );
}

function parseBooleanParam(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  return value !== '0' && value !== 'false';
}

function buildChartUrl(pathname: string, config: ChartRenderConfig): string {
  const encodedData = encodeChartDataForUrl(config.data);
  const params = new URLSearchParams({
    chart: config.chart,
    title: config.title,
    theme: config.theme,
    ...encodedData.queryParams,
  });

  if (config.subtitle.trim()) params.set('subtitle', config.subtitle.trim());
  if (config.metric.trim()) params.set('metric', config.metric.trim());
  if (config.goal.trim()) params.set('goal', config.goal.trim());
  if (!config.showLabels) params.set('showLabels', '0');
  if (!config.showValues) params.set('showValues', '0');

  return `${window.location.origin}${pathname}?${params.toString()}`;
}

function InsightCard({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ThemeStyle;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${theme.card}`}>
      <p className={`text-xs uppercase tracking-[0.2em] ${theme.muted}`}>{label}</p>
      <p className={`mt-2 text-xl font-semibold ${theme.text}`}>{value}</p>
    </div>
  );
}

function ChartView({ config }: { config: ChartRenderConfig }) {
  const theme = THEME_STYLES[config.theme];
  const stats = useMemo(() => calculateChartStats(config.data), [config.data]);

  return (
    <ViewContainer
      createHref="/chart"
      className="flex items-center justify-center px-4 py-10"
      style={{ backgroundImage: theme.background }}
    >
      <div className={`w-full max-w-6xl rounded-[32px] border p-6 shadow-2xl md:p-8 ${theme.panel}`}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-3 bg-white/10 text-white/80">
                URL-native SVG chart
              </Badge>
              <h1 className={`text-4xl md:text-5xl ${theme.text}`}>{config.title}</h1>
              {config.subtitle && (
                <p className={`mt-3 max-w-2xl text-base md:text-lg ${theme.subtext}`}>
                  {config.subtitle}
                </p>
              )}
            </div>

            <div className={`rounded-2xl border px-4 py-3 text-sm ${theme.card}`}>
              <p className={theme.muted}>Mode</p>
              <p className={`capitalize ${theme.text}`}>
                {config.chart} chart
                {config.metric ? ` • ${config.metric} metric` : ''}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <InsightCard
              label="Total"
              value={formatMetricValue(stats.total, config.metric)}
              theme={theme}
            />
            <InsightCard
              label="Average"
              value={formatMetricValue(stats.average, config.metric)}
              theme={theme}
            />
            <InsightCard
              label="Peak"
              value={
                stats.peak
                  ? `${stats.peak.label} • ${formatMetricValue(stats.peak.value, config.metric)}`
                  : 'n/a'
              }
              theme={theme}
            />
            <InsightCard
              label="Change"
              value={`${stats.change >= 0 ? '+' : ''}${formatMetricValue(stats.change, config.metric)}`}
              theme={theme}
            />
          </div>

          <div className={`rounded-[28px] border p-4 md:p-6 ${theme.card}`}>
            <ChartSvg config={config} theme={theme} animateMode="page" className="w-full h-auto overflow-visible" />
          </div>

          <div className="flex flex-wrap gap-3">
            {config.data.map((point) => (
              <div
                key={point.label}
                className={`rounded-full border px-4 py-2 text-sm ${theme.card} ${theme.subtext}`}
              >
                <span className="font-medium">{point.label}</span>
                <span className="mx-2 opacity-50">/</span>
                <span>{formatMetricValue(point.value, config.metric)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ViewContainer>
  );
}

function ChartContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<ChartRenderConfig>(DEFAULT_CONFIG);
  const [dataInput, setDataInput] = useState(pointsToTextarea(DEFAULT_CONFIG.data));
  const [asset, setAsset] = useState<ChartAsset>('svg');

  useEffect(() => {
    const inlineData = parseChartDataParam(searchParams.get('data'));
    const splitData = parseLabelsAndValues(
      searchParams.get('labels'),
      searchParams.get('values'),
    );
    const payloadData = parsePayloadData(searchParams.get('payload'));
    const resolvedData =
      inlineData.length > 0
        ? inlineData
        : splitData.length > 0
          ? splitData
          : payloadData;

    const hasUrlConfig = Array.from(searchParams.keys()).length > 0;

    if (!hasUrlConfig) {
      setIsCreating(true);
      setConfig(DEFAULT_CONFIG);
      setDataInput(pointsToTextarea(DEFAULT_CONFIG.data));
      setAsset('svg');
      return;
    }

    const chartParam = searchParams.get('chart');
    const themeParam = searchParams.get('theme');
    const assetParam = searchParams.get('asset');

    const nextConfig: ChartRenderConfig = {
      title: searchParams.get('title') || 'URL Chart',
      subtitle: searchParams.get('subtitle') || '',
      chart:
        chartParam === 'line' || chartParam === 'area'
          ? (chartParam as ChartType)
          : 'bar',
      theme:
        themeParam === 'sunset' || themeParam === 'mint' || themeParam === 'mono'
          ? (themeParam as ChartTheme)
          : 'aurora',
      metric: searchParams.get('metric') || '',
      goal: searchParams.get('goal') || '',
      showLabels: parseBooleanParam(searchParams.get('showLabels'), true),
      showValues: parseBooleanParam(searchParams.get('showValues'), true),
      data: resolvedData.length > 0 ? resolvedData : DEFAULT_CONFIG.data,
    };

    setIsCreating(false);
    setConfig(nextConfig);
    setDataInput(pointsToTextarea(nextConfig.data));
    setAsset(assetParam === 'page' ? 'page' : 'svg');
  }, [searchParams]);

  const dataPoints = useMemo(() => textareaToPoints(dataInput), [dataInput]);
  const previewConfig = useMemo(
    () => ({
      ...config,
      data: dataPoints.length > 0 ? dataPoints : [],
    }),
    [config, dataPoints],
  );
  const encodedData = useMemo(() => encodeChartDataForUrl(dataPoints), [dataPoints]);

  const strategyCopy = {
    data: {
      title: 'Readable `data=` param',
      body: 'Best when labels are simple. Humans can tweak the chart directly in the URL, like `data=Mon:28|Tue:42`.',
    },
    'labels-values': {
      title: 'Split `labels=` + `values=` params',
      body: 'Best for scripts and automation. It maps cleanly from spreadsheets, forms, and CMS fields.',
    },
    payload: {
      title: 'Compressed `payload=` param',
      body: 'Best for larger datasets and raw SVG asset URLs, because the server can resolve it without relying on hash fragments.',
    },
  } as const;

  const generateUrl = () => {
    const nextConfig = {
      ...config,
      data: dataPoints,
    };

    return asset === 'svg'
      ? buildChartUrl('/api/chart', nextConfig)
      : buildChartUrl('/chart', nextConfig);
  };

  const previewTheme = THEME_STYLES[config.theme];
  const isValid = dataPoints.length >= 2 && config.title.trim().length > 0;

  return (
    <CreatorContainer>
      <PageHeader
        title="Animated SVG Charts"
        description="Turn plain URL params into bar, line, or area charts with motion, insights, and zero backend."
      />

      <CreatorCard
        title="Create Chart"
        description="Choose whether the shared output should be a raw SVG asset or an HTML page that wraps the SVG."
      >
        <div className="space-y-6">
          <OptionGrid<ChartAsset>
            label="Output Asset"
            options={[
              { value: 'svg', label: 'SVG File' },
              { value: 'page', label: 'HTML Page' },
            ]}
            value={asset}
            onChange={setAsset}
            columns={2}
          />

          <TextInput
            label="Chart Title"
            value={config.title}
            onChange={(title) => setConfig((current) => ({ ...current, title }))}
            placeholder="Weekly Momentum"
            required
          />

          <TextInput
            label="Subtitle"
            value={config.subtitle}
            onChange={(subtitle) => setConfig((current) => ({ ...current, subtitle }))}
            placeholder="Optional context for what this dataset means"
          />

          <TextAreaInput
            label="Data Points"
            value={dataInput}
            onChange={setDataInput}
            placeholder={'Mon, 28\nTue, 42\nWed, 36\nThu, 54'}
            required
            rows={7}
          />
          <p className="text-xs text-muted-foreground -mt-4">
            Enter one point per line in `label, value` format. The chart works best with 2 to 12 points.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <OptionGrid<ChartType>
              label="Chart Type"
              options={[
                { value: 'bar', label: 'Bar' },
                { value: 'line', label: 'Line' },
                { value: 'area', label: 'Area' },
              ]}
              value={config.chart}
              onChange={(chart) => setConfig((current) => ({ ...current, chart }))}
              columns={3}
            />

            <OptionGrid<ChartTheme>
              label="Theme"
              options={[
                { value: 'aurora', label: 'Aurora' },
                { value: 'sunset', label: 'Sunset' },
                { value: 'mint', label: 'Mint' },
                { value: 'mono', label: 'Mono' },
              ]}
              value={config.theme}
              onChange={(theme) => setConfig((current) => ({ ...current, theme }))}
              columns={4}
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Metric Suffix or Prefix</Label>
                <Input
                  value={config.metric}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, metric: event.target.value }))
                  }
                  placeholder="%, ms, $, users"
                />
              </div>
              <div className="space-y-2">
                <Label>Goal Line (Optional)</Label>
                <Input
                  type="number"
                  min="0"
                  value={config.goal}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, goal: event.target.value }))
                  }
                  placeholder="60"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setConfig((current) => ({ ...current, showLabels: !current.showLabels }))}
              className={`rounded-xl border p-4 text-left transition-colors ${
                config.showLabels
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/50'
              }`}
            >
              <p className="font-medium">Axis Labels</p>
              <p className="mt-1 text-sm opacity-80">Show each point label under the chart.</p>
            </button>
            <button
              type="button"
              onClick={() => setConfig((current) => ({ ...current, showValues: !current.showValues }))}
              className={`rounded-xl border p-4 text-left transition-colors ${
                config.showValues
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/50'
              }`}
            >
              <p className="font-medium">Value Callouts</p>
              <p className="mt-1 text-sm opacity-80">Render numeric values directly on the chart.</p>
            </button>
          </div>

          {previewConfig.data.length > 0 && (
            <div
              className="rounded-[28px] border p-5 md:p-6"
              style={{ backgroundImage: previewTheme.background }}
            >
              <ChartSvg
                config={previewConfig}
                theme={previewTheme}
                animateMode="page"
                className="w-full h-auto overflow-visible"
              />
            </div>
          )}

          <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
            <p className="text-sm font-medium">{strategyCopy[encodedData.strategy].title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {strategyCopy[encodedData.strategy].body}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 p-4">
            <p className="text-sm font-medium">Param ideas that get the most out of charts</p>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                Choose `SVG File` when another website, CMS, or MDX page needs a direct asset URL.
              </p>
              <p>
                Choose `HTML Page` when you want the richer ParamHub presentation with stats and the surrounding layout.
              </p>
              <p>
                Add `metric=` and `goal=` to turn raw numbers into something interpretable at a glance.
              </p>
            </div>
          </div>

          <ActionButtons generateUrl={generateUrl} disabled={!isValid} />
        </div>
      </CreatorCard>
    </CreatorContainer>
  );
}

export default function ChartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ChartContent />
    </Suspense>
  );
}
