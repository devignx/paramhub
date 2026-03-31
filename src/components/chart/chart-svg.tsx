import {
  calculateChartStats,
  ChartRenderConfig,
  ChartTheme,
  clampNumber,
  formatMetricValue,
} from '@/lib/chart-utils';

export interface ThemeStyle {
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
  assetStart: string;
  assetEnd: string;
  assetFrame: string;
}

export const THEME_STYLES: Record<ChartTheme, ThemeStyle> = {
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
    assetStart: '#1d4ed8',
    assetEnd: '#020617',
    assetFrame: 'rgba(255,255,255,0.1)',
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
    assetStart: '#7c2d12',
    assetEnd: '#12070e',
    assetFrame: 'rgba(255,255,255,0.1)',
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
    assetStart: '#14532d',
    assetEnd: '#022c22',
    assetFrame: 'rgba(167,243,208,0.14)',
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
    assetStart: '#262626',
    assetEnd: '#050505',
    assetFrame: 'rgba(255,255,255,0.1)',
  },
};

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

export function ChartSvg({
  config,
  theme,
  animateMode = 'page',
  className,
}: {
  config: ChartRenderConfig;
  theme: ThemeStyle;
  animateMode?: 'page' | 'svg';
  className?: string;
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
    const y = paddingTop + chartHeight - (point.value / maxValue) * chartHeight;

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
  const isSvgAsset = animateMode === 'svg';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className}>
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
                y={isSvgAsset ? paddingTop + chartHeight : y}
                width={barWidth}
                height={isSvgAsset ? 0 : barHeight}
                rx="14"
                fill="url(#chart-gradient)"
                opacity="0.96"
                style={
                  isSvgAsset
                    ? undefined
                    : {
                        transition:
                          `y 700ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 70}ms, ` +
                          `height 700ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 70}ms`,
                      }
                }
              >
                {isSvgAsset && (
                  <>
                    <animate attributeName="y" from={paddingTop + chartHeight} to={y} dur="0.7s" begin={`${index * 0.07}s`} fill="freeze" />
                    <animate attributeName="height" from="0" to={barHeight} dur="0.7s" begin={`${index * 0.07}s`} fill="freeze" />
                  </>
                )}
              </rect>
              {config.showValues && (
                <text
                  x={x + barWidth / 2}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fill={theme.gradientEnd}
                  opacity={isSvgAsset ? 0 : 1}
                  style={
                    isSvgAsset
                      ? undefined
                      : {
                          transition: `opacity 450ms ease ${200 + index * 70}ms`,
                        }
                  }
                >
                  {formatMetricValue(point.value, config.metric)}
                  {isSvgAsset && (
                    <animate attributeName="opacity" from="0" to="1" dur="0.35s" begin={`${0.2 + index * 0.07}s`} fill="freeze" />
                  )}
                </text>
              )}
            </g>
          );
        })}

      {config.chart === 'area' && areaPath && (
        <path
          d={areaPath}
          fill="url(#area-gradient)"
          opacity={isSvgAsset ? 0 : 1}
          style={
            isSvgAsset
              ? undefined
              : {
                  transition: 'opacity 900ms ease 180ms',
                }
          }
        >
          {isSvgAsset && (
            <animate attributeName="opacity" from="0" to="1" dur="0.9s" begin="0.18s" fill="freeze" />
          )}
        </path>
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
          strokeDashoffset={isSvgAsset ? 100 : 0}
          style={
            isSvgAsset
              ? undefined
              : {
                  transition: 'stroke-dashoffset 1200ms cubic-bezier(0.22, 1, 0.36, 1)',
                }
          }
        >
          {isSvgAsset && (
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.2s" begin="0s" fill="freeze" />
          )}
        </path>
      )}

      {(config.chart === 'line' || config.chart === 'area') &&
        points.map((point, index) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={isSvgAsset ? paddingTop + chartHeight : point.y}
              r={isSvgAsset ? 0 : 5.5}
              fill={theme.solid}
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="2"
              style={
                isSvgAsset
                  ? undefined
                  : {
                      transition:
                        `cy 650ms cubic-bezier(0.22, 1, 0.36, 1) ${120 + index * 70}ms, ` +
                        `r 500ms ease ${120 + index * 70}ms`,
                    }
              }
            >
              {isSvgAsset && (
                <>
                  <animate attributeName="cy" from={paddingTop + chartHeight} to={point.y} dur="0.65s" begin={`${0.12 + index * 0.07}s`} fill="freeze" />
                  <animate attributeName="r" from="0" to="5.5" dur="0.5s" begin={`${0.12 + index * 0.07}s`} fill="freeze" />
                </>
              )}
            </circle>
            {config.showValues && (
              <text
                x={point.x}
                y={point.y - 16}
                textAnchor="middle"
                fontSize="12"
                fill={theme.gradientEnd}
                opacity={isSvgAsset ? 0 : 1}
                style={
                  isSvgAsset
                    ? undefined
                    : {
                        transition: `opacity 400ms ease ${260 + index * 70}ms`,
                      }
                }
              >
                {formatMetricValue(point.value, config.metric)}
                {isSvgAsset && (
                  <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${0.26 + index * 0.07}s`} fill="freeze" />
                )}
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

export function StandaloneChartSvgDocument({ config }: { config: ChartRenderConfig }) {
  const theme = THEME_STYLES[config.theme];
  const stats = calculateChartStats(config.data);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" fill="none">
      <defs>
        <linearGradient id="asset-bg" x1="0" y1="0" x2="1200" y2="720" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.assetStart} />
          <stop offset="100%" stopColor={theme.assetEnd} />
        </linearGradient>
      </defs>

      <rect width="1200" height="720" rx="36" fill="url(#asset-bg)" />
      <rect x="36" y="36" width="1128" height="648" rx="28" fill={theme.assetFrame} stroke="rgba(255,255,255,0.12)" />

      <text x="72" y="110" fill="rgba(255,255,255,0.72)" fontSize="20" fontFamily="Inter, Arial, sans-serif" letterSpacing="3">
        PARAMHUB SVG CHART
      </text>
      <text x="72" y="164" fill="#ffffff" fontSize="42" fontWeight="700" fontFamily="Inter, Arial, sans-serif">
        {config.title}
      </text>
      {config.subtitle ? (
        <text x="72" y="204" fill="rgba(255,255,255,0.72)" fontSize="22" fontFamily="Inter, Arial, sans-serif">
          {config.subtitle}
        </text>
      ) : null}

      <g transform="translate(72 238)">
        <ChartSvg config={config} theme={theme} animateMode="svg" />
      </g>

      <g transform="translate(72 628)">
        <text fill="rgba(255,255,255,0.64)" fontSize="18" fontFamily="Inter, Arial, sans-serif">
          Total: {formatMetricValue(stats.total, config.metric)}
        </text>
        <text x="290" fill="rgba(255,255,255,0.64)" fontSize="18" fontFamily="Inter, Arial, sans-serif">
          Average: {formatMetricValue(stats.average, config.metric)}
        </text>
        <text x="620" fill="rgba(255,255,255,0.64)" fontSize="18" fontFamily="Inter, Arial, sans-serif">
          Peak: {stats.peak ? `${stats.peak.label} ${formatMetricValue(stats.peak.value, config.metric)}` : 'n/a'}
        </text>
      </g>
    </svg>
  );
}
