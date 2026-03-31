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
import {
  calculateChartStats,
  ChartPoint,
  ChartTheme,
  ChartType,
  clampNumber,
  encodeChartDataForUrl,
  formatMetricValue,
  parseChartDataParam,
  parseLabelsAndValues,
  sanitizeChartPoints,
} from '@/lib/chart-utils';
import { generateShareableUrl, unpack } from '@/lib/url-utils';

interface ChartConfig {
  title: string;
  subtitle: string;
  chart: ChartType;
  theme: ChartTheme;
  metric: string;
  goal: string;
  showLabels: boolean;
  showValues: boolean;
  data: ChartPoint[];
}

interface HashPayload {
  data?: ChartPoint[];
}

interface ThemeStyle {
  background: string;
  panel: string;
  card: string;
  text: string;
  subtext: string;
  muted: string;
  gradientStart: string;
  gradientEnd: string;
  solid: string;
  fill: string;
  grid: string;
  goal: string;
}

const DEFAULT_POINTS: ChartPoint[] = [
  { label: 'Mon', value: 28 },
  { label: 'Tue', value: 42 },
  { label: 'Wed', value: 36 },
  { label: 'Thu', value: 54 },
  { label: 'Fri', value: 61 },
  { label: 'Sat', value: 44 },
];

const DEFAULT_CONFIG: ChartConfig = {
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

const THEME_STYLES: Record<ChartTheme, ThemeStyle> = {
  aurora: {
    background:
      'radial-gradient(circle at top left, #1d4ed8 0%, #0f172a 42%, #020617 100%)',
    panel: 'border-white/10 bg-white/10 backdrop-blur-xl',
    card: 'border-white/10 bg-white/5',
    text: 'text-white',
    subtext: 'text-slate-300',
    muted: 'text-slate-400',
    gradientStart: '#8b5cf6',
    gradientEnd: '#22d3ee',
    solid: '#38bdf8',
    fill: 'rgba(56, 189, 248, 0.16)',
    grid: 'rgba(255,255,255,0.12)',
    goal: '#fbbf24',
  },
  sunset: {
    background:
      'radial-gradient(circle at top right, #7c2d12 0%, #2a0f1c 45%, #12070e 100%)',
    panel: 'border-white/10 bg-white/10 backdrop-blur-xl',
    card: 'border-white/10 bg-white/5',
    text: 'text-white',
    subtext: 'text-rose-100/90',
    muted: 'text-rose-100/60',
    gradientStart: '#fb7185',
    gradientEnd: '#f59e0b',
    solid: '#fb7185',
    fill: 'rgba(251, 113, 133, 0.18)',
    grid: 'rgba(255,255,255,0.1)',
    goal: '#fde68a',
  },
  mint: {
    background:
      'radial-gradient(circle at top center, #14532d 0%, #052e16 30%, #022c22 100%)',
    panel: 'border-emerald-200/15 bg-emerald-50/10 backdrop-blur-xl',
    card: 'border-emerald-200/10 bg-emerald-50/5',
    text: 'text-emerald-50',
    subtext: 'text-emerald-100/80',
    muted: 'text-emerald-100/60',
    gradientStart: '#34d399',
    gradientEnd: '#2dd4bf',
    solid: '#34d399',
    fill: 'rgba(52, 211, 153, 0.18)',
    grid: 'rgba(167,243,208,0.12)',
    goal: '#facc15',
  },
  mono: {
    background:
      'radial-gradient(circle at top left, #262626 0%, #111111 45%, #050505 100%)',
    panel: 'border-white/10 bg-white/5 backdrop-blur-xl',
    card: 'border-white/10 bg-white/[0.03]',
    text: 'text-zinc-50',
    subtext: 'text-zinc-300',
    muted: 'text-zinc-500',
    gradientStart: '#f4f4f5',
    gradientEnd: '#71717a',
    solid: '#fafafa',
    fill: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.12)',
    goal: '#f59e0b',
  },
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

function parseGoalValue(value: string): number | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const numericValue = Number(trimmedValue);
  if (Number.isNaN(numericValue) || numericValue < 0) return null;

  return numericValue;
}

function buildLinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midpoint = (current.x + next.x) / 2;
    path += ` C ${midpoint} ${current.y}, ${midpoint} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function ChartSvg({
  config,
  theme,
  animate,
}: {
  config: ChartConfig;
  theme: ThemeStyle;
  animate: boolean;
}) {
  const width = 720;
  const height = 360;
  const paddingLeft = 58;
  const paddingRight = 24;
  const paddingTop = 28;
  const paddingBottom = 58;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const goalValue = parseGoalValue(config.goal);
  const maxInputValue = Math.max(
    ...config.data.map((point) => point.value),
    goalValue ?? 0,
    1,
  );
  const maxValue = maxInputValue * 1.1;
  const ticks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const value = maxValue * (1 - ratio);
    const y = paddingTop + chartHeight * ratio;
    return { value, y };
  });

  const points = config.data.map((point, index) => {
    const x =
      config.data.length === 1
        ? paddingLeft + chartWidth / 2
        : paddingLeft + (chartWidth / (config.data.length - 1)) * index;
    const y =
      paddingTop +
      chartHeight -
      (point.value / maxValue) * chartHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const linePath = buildLinePath(points);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

  const goalY =
    goalValue === null
      ? null
      : paddingTop + chartHeight - (goalValue / maxValue) * chartHeight;

  const barSlotWidth = chartWidth / Math.max(config.data.length, 1);
  const barWidth = clampNumber(barSlotWidth * 0.58, 26, 64);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
      <defs>
        <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={theme.gradientStart} />
          <stop offset="100%" stopColor={theme.gradientEnd} />
        </linearGradient>
        <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.gradientStart} stopOpacity="0.42" />
          <stop offset="100%" stopColor={theme.gradientEnd} stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((tick) => (
        <g key={tick.y}>
          <line
            x1={paddingLeft}
            x2={width - paddingRight}
            y1={tick.y}
            y2={tick.y}
            stroke={theme.grid}
            strokeDasharray="4 6"
          />
          <text
            x={paddingLeft - 12}
            y={tick.y + 4}
            textAnchor="end"
            fontSize="11"
            fill={theme.gradientEnd}
            opacity="0.72"
          >
            {formatMetricValue(tick.value, config.metric)}
          </text>
        </g>
      ))}

      {goalY !== null && (
        <g>
          <line
            x1={paddingLeft}
            x2={width - paddingRight}
            y1={goalY}
            y2={goalY}
            stroke={theme.goal}
            strokeDasharray="10 8"
            strokeWidth="2"
            opacity="0.9"
          />
          <text
            x={width - paddingRight}
            y={goalY - 8}
            textAnchor="end"
            fontSize="11"
            fill={theme.goal}
          >
            Goal {formatMetricValue(goalValue ?? 0, config.metric)}
          </text>
        </g>
      )}

      {config.chart === 'bar' &&
        points.map((point, index) => {
          const barHeight = (point.value / maxValue) * chartHeight;
          const x = paddingLeft + barSlotWidth * index + (barSlotWidth - barWidth) / 2;
          const y = paddingTop + chartHeight - barHeight;

          return (
            <g key={point.label}>
              <rect
                x={x}
                y={animate ? y : paddingTop + chartHeight}
                width={barWidth}
                height={animate ? barHeight : 0}
                rx="14"
                fill="url(#chart-gradient)"
                opacity="0.96"
                style={{
                  transition:
                    `y 700ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 70}ms, ` +
                    `height 700ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 70}ms`,
                }}
              />
              {config.showValues && (
                <text
                  x={x + barWidth / 2}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fill={theme.gradientEnd}
                  style={{
                    opacity: animate ? 1 : 0,
                    transition: `opacity 450ms ease ${200 + index * 70}ms`,
                  }}
                >
                  {formatMetricValue(point.value, config.metric)}
                </text>
              )}
            </g>
          );
        })}

      {config.chart === 'area' && areaPath && (
        <path
          d={areaPath}
          fill="url(#area-gradient)"
          opacity={animate ? 1 : 0}
          style={{
            transition: 'opacity 900ms ease 180ms',
          }}
        />
      )}

      {(config.chart === 'line' || config.chart === 'area') && linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="url(#chart-gradient)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={animate ? 0 : 100}
          style={{
            transition: 'stroke-dashoffset 1200ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      )}

      {(config.chart === 'line' || config.chart === 'area') &&
        points.map((point, index) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={animate ? point.y : paddingTop + chartHeight}
              r={animate ? 5.5 : 0}
              fill={theme.solid}
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="2"
              style={{
                transition:
                  `cy 650ms cubic-bezier(0.22, 1, 0.36, 1) ${120 + index * 70}ms, ` +
                  `r 500ms ease ${120 + index * 70}ms`,
              }}
            />
            {config.showValues && (
              <text
                x={point.x}
                y={point.y - 16}
                textAnchor="middle"
                fontSize="12"
                fill={theme.gradientEnd}
                style={{
                  opacity: animate ? 1 : 0,
                  transition: `opacity 400ms ease ${260 + index * 70}ms`,
                }}
              >
                {formatMetricValue(point.value, config.metric)}
              </text>
            )}
          </g>
        ))}

      {config.showLabels &&
        points.map((point) => (
          <text
            key={point.label}
            x={point.x}
            y={height - 18}
            textAnchor="middle"
            fontSize="12"
            fill={theme.gradientEnd}
            opacity="0.9"
          >
            {point.label}
          </text>
        ))}
    </svg>
  );
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

function ChartView({ config }: { config: ChartConfig }) {
  const [animate, setAnimate] = useState(false);
  const theme = THEME_STYLES[config.theme];
  const stats = useMemo(() => calculateChartStats(config.data), [config.data]);

  useEffect(() => {
    setAnimate(false);
    const frame = window.requestAnimationFrame(() => {
      setAnimate(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [config.chart, config.data, config.goal, config.metric, config.theme]);

  return (
    <ViewContainer createHref="/chart" className="flex items-center justify-center px-4 py-10" style={{ backgroundImage: theme.background }}>
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
            <ChartSvg config={config} theme={theme} animate={animate} />
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
  const [config, setConfig] = useState<ChartConfig>(DEFAULT_CONFIG);
  const [dataInput, setDataInput] = useState(pointsToTextarea(DEFAULT_CONFIG.data));

  useEffect(() => {
    const hashValue = typeof window !== 'undefined' ? window.location.hash : '';
    const hashData = hashValue ? unpack<HashPayload>(hashValue.slice(1)) : null;
    const inlineData = parseChartDataParam(searchParams.get('data'));
    const splitData = parseLabelsAndValues(
      searchParams.get('labels'),
      searchParams.get('values'),
    );
    const paramData = inlineData.length > 0 ? inlineData : splitData;
    const resolvedData =
      hashData?.data && hashData.data.length > 0 ? sanitizeChartPoints(hashData.data) : paramData;

    const hasUrlConfig =
      hashValue.length > 1 ||
      Array.from(searchParams.keys()).length > 0;

    if (!hasUrlConfig) {
      setIsCreating(true);
      setConfig(DEFAULT_CONFIG);
      setDataInput(pointsToTextarea(DEFAULT_CONFIG.data));
      return;
    }

    setIsCreating(false);
    const nextConfig: ChartConfig = {
      title: searchParams.get('title') || 'URL Chart',
      subtitle: searchParams.get('subtitle') || '',
      chart:
        searchParams.get('chart') === 'line' || searchParams.get('chart') === 'area'
          ? (searchParams.get('chart') as ChartType)
          : 'bar',
      theme:
        searchParams.get('theme') === 'sunset' ||
        searchParams.get('theme') === 'mint' ||
        searchParams.get('theme') === 'mono'
          ? (searchParams.get('theme') as ChartTheme)
          : 'aurora',
      metric: searchParams.get('metric') || '',
      goal: searchParams.get('goal') || '',
      showLabels: parseBooleanParam(searchParams.get('showLabels'), true),
      showValues: parseBooleanParam(searchParams.get('showValues'), true),
      data: resolvedData.length > 0 ? resolvedData : DEFAULT_CONFIG.data,
    };

    setConfig(nextConfig);
    setDataInput(pointsToTextarea(nextConfig.data));
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
      body: 'Best for scripts and automation. It is easy to generate from spreadsheets, shell scripts, or no-code tools.',
    },
    hash: {
      title: 'Compressed hash payload',
      body: 'Best for bigger datasets or labels with reserved separators. The URL stays shareable without dropping fidelity.',
    },
  } as const;

  const generateUrl = () => {
    const queryParams: Record<string, string> = {
      chart: config.chart,
      title: config.title,
      theme: config.theme,
      ...encodedData.queryParams,
    };

    if (config.subtitle.trim()) {
      queryParams.subtitle = config.subtitle.trim();
    }

    if (config.metric.trim()) {
      queryParams.metric = config.metric.trim();
    }

    if (config.goal.trim()) {
      queryParams.goal = config.goal.trim();
    }

    if (!config.showLabels) {
      queryParams.showLabels = '0';
    }

    if (!config.showValues) {
      queryParams.showValues = '0';
    }

    return generateShareableUrl('/chart', queryParams, encodedData.hashData);
  };

  if (!isCreating) {
    return <ChartView config={config} />;
  }

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
        description="Define your chart once, then share it as a self-contained link."
      >
        <div className="space-y-6">
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
              <ChartSvg config={previewConfig} theme={previewTheme} animate />
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
                Use `data=` when the link is meant to be hand-edited in docs, Notion, or chat threads.
              </p>
              <p>
                Use `labels=` and `values=` when another tool is assembling the URL from structured fields.
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
