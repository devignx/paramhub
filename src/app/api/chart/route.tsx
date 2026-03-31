import { NextRequest } from 'next/server';
import { THEME_STYLES } from '@/components/chart/chart-svg';
import {
  calculateChartStats,
  ChartRenderConfig,
  ChartTheme,
  ChartType,
  formatMetricValue,
  parseChartDataParam,
  parseLabelsAndValues,
  parsePayloadData,
} from '@/lib/chart-utils';

function parseBooleanParam(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  return value !== '0' && value !== 'false';
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const inlineData = parseChartDataParam(searchParams.get('data'));
  const splitData = parseLabelsAndValues(
    searchParams.get('labels'),
    searchParams.get('values'),
  );
  const payloadData = parsePayloadData(searchParams.get('payload'));

  const data =
    inlineData.length > 0
      ? inlineData
      : splitData.length > 0
        ? splitData
        : payloadData;

  if (data.length < 2) {
    return new Response(
      JSON.stringify({
        error:
          'Missing chart data. Provide `data=Label:10|Label:20`, or `labels=` + `values=`, or a compressed `payload=`.',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const chartParam = searchParams.get('chart');
  const themeParam = searchParams.get('theme');

  const config: ChartRenderConfig = {
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
    data,
  };

  const svg = buildStandaloneSvgMarkup(config);

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>${svg}`, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': 'inline; filename="chart.svg"',
      'Cache-Control': 'public, max-age=0, s-maxage=86400',
    },
  });
}

function buildStandaloneSvgMarkup(config: ChartRenderConfig): string {
  const theme = THEME_STYLES[config.theme];
  const stats = calculateChartStats(config.data);
  const width = 1200;
  const height = 720;
  const chartWidth = 720;
  const chartHeight = 360;
  const chartOffsetX = 72;
  const chartOffsetY = 238;
  const paddingLeft = 58;
  const paddingRight = 24;
  const paddingTop = 28;
  const paddingBottom = 58;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const goalValue = parseGoalValue(config.goal);
  const maxInputValue = Math.max(
    ...config.data.map((point) => point.value),
    goalValue ?? 0,
    1,
  );
  const maxValue = maxInputValue * 1.1;
  const ticks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    return {
      value: maxValue * (1 - ratio),
      y: paddingTop + innerHeight * ratio,
    };
  });
  const points = config.data.map((point, index) => {
    const x =
      config.data.length === 1
        ? paddingLeft + innerWidth / 2
        : paddingLeft + (innerWidth / (config.data.length - 1)) * index;
    const y = paddingTop + innerHeight - (point.value / maxValue) * innerHeight;
    return { ...point, x, y };
  });
  const linePath = buildLinePath(points);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + innerHeight} L ${points[0].x} ${paddingTop + innerHeight} Z`
      : '';
  const goalY =
    goalValue === null
      ? null
      : paddingTop + innerHeight - (goalValue / maxValue) * innerHeight;
  const barSlotWidth = innerWidth / Math.max(config.data.length, 1);
  const barWidth = Math.min(64, Math.max(26, barSlotWidth * 0.58));

  const tickMarkup = ticks
    .map(
      (tick) => `
        <g>
          <line x1="${paddingLeft}" x2="${chartWidth - paddingRight}" y1="${tick.y}" y2="${tick.y}" stroke="${theme.grid}" stroke-dasharray="4 6" />
          <text x="${paddingLeft - 12}" y="${tick.y + 4}" text-anchor="end" font-size="11" fill="${theme.gradientEnd}" opacity="0.72" font-family="Inter, Arial, sans-serif">${escapeXml(formatMetricValue(tick.value, config.metric))}</text>
        </g>`,
    )
    .join('');

  const goalMarkup =
    goalY === null
      ? ''
      : `
        <g>
          <line x1="${paddingLeft}" x2="${chartWidth - paddingRight}" y1="${goalY}" y2="${goalY}" stroke="${theme.goal}" stroke-dasharray="10 8" stroke-width="2" opacity="0.9" />
          <text x="${chartWidth - paddingRight}" y="${goalY - 8}" text-anchor="end" font-size="11" fill="${theme.goal}" font-family="Inter, Arial, sans-serif">Goal ${escapeXml(formatMetricValue(goalValue ?? 0, config.metric))}</text>
        </g>`;

  const barMarkup =
    config.chart !== 'bar'
      ? ''
      : points
          .map((point, index) => {
            const barHeight = (point.value / maxValue) * innerHeight;
            const x = paddingLeft + barSlotWidth * index + (barSlotWidth - barWidth) / 2;
            const y = paddingTop + innerHeight - barHeight;

            return `
              <g>
                <rect x="${x}" y="${paddingTop + innerHeight}" width="${barWidth}" height="0" rx="14" fill="url(#chart-gradient)" opacity="0.96">
                  <animate attributeName="y" from="${paddingTop + innerHeight}" to="${y}" dur="0.7s" begin="${index * 0.07}s" fill="freeze" />
                  <animate attributeName="height" from="0" to="${barHeight}" dur="0.7s" begin="${index * 0.07}s" fill="freeze" />
                </rect>
                ${
                  config.showValues
                    ? `<text x="${x + barWidth / 2}" y="${y - 10}" text-anchor="middle" font-size="12" fill="${theme.gradientEnd}" opacity="0" font-family="Inter, Arial, sans-serif">${escapeXml(formatMetricValue(point.value, config.metric))}<animate attributeName="opacity" from="0" to="1" dur="0.35s" begin="${0.2 + index * 0.07}s" fill="freeze" /></text>`
                    : ''
                }
              </g>`
          })
          .join('');

  const lineMarkup =
    config.chart === 'line' || config.chart === 'area'
      ? `
        ${config.chart === 'area' && areaPath
          ? `<path d="${areaPath}" fill="url(#area-gradient)" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.9s" begin="0.18s" fill="freeze" /></path>`
          : ''}
        ${
          linePath
            ? `<path d="${linePath}" fill="none" stroke="url(#chart-gradient)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.2s" begin="0s" fill="freeze" /></path>`
            : ''
        }
        ${points
          .map(
            (point, index) => `
              <g>
                <circle cx="${point.x}" cy="${paddingTop + innerHeight}" r="0" fill="${theme.solid}" stroke="rgba(255,255,255,0.85)" stroke-width="2">
                  <animate attributeName="cy" from="${paddingTop + innerHeight}" to="${point.y}" dur="0.65s" begin="${0.12 + index * 0.07}s" fill="freeze" />
                  <animate attributeName="r" from="0" to="5.5" dur="0.5s" begin="${0.12 + index * 0.07}s" fill="freeze" />
                </circle>
                ${
                  config.showValues
                    ? `<text x="${point.x}" y="${point.y - 16}" text-anchor="middle" font-size="12" fill="${theme.gradientEnd}" opacity="0" font-family="Inter, Arial, sans-serif">${escapeXml(formatMetricValue(point.value, config.metric))}<animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="${0.26 + index * 0.07}s" fill="freeze" /></text>`
                    : ''
                }
              </g>`,
          )
          .join('')}
      `
      : '';

  const labelMarkup = !config.showLabels
    ? ''
    : points
        .map(
          (point) => `
            <text x="${point.x}" y="${chartHeight - 18}" text-anchor="middle" font-size="12" fill="${theme.gradientEnd}" opacity="0.9" font-family="Inter, Arial, sans-serif">${escapeXml(point.label)}</text>`,
        )
        .join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
      <defs>
        <linearGradient id="asset-bg" x1="0" y1="0" x2="${width}" y2="${height}" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${theme.assetStart}" />
          <stop offset="100%" stop-color="${theme.assetEnd}" />
        </linearGradient>
        <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${theme.gradientStart}" />
          <stop offset="100%" stop-color="${theme.gradientEnd}" />
        </linearGradient>
        <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${theme.gradientStart}" stop-opacity="0.42" />
          <stop offset="100%" stop-color="${theme.gradientEnd}" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="36" fill="url(#asset-bg)" />
      <rect x="36" y="36" width="1128" height="648" rx="28" fill="${theme.assetFrame}" stroke="rgba(255,255,255,0.12)" />
      <text x="72" y="110" fill="rgba(255,255,255,0.72)" font-size="20" font-family="Inter, Arial, sans-serif" letter-spacing="3">PARAMHUB SVG CHART</text>
      <text x="72" y="164" fill="#ffffff" font-size="42" font-weight="700" font-family="Inter, Arial, sans-serif">${escapeXml(config.title)}</text>
      ${
        config.subtitle
          ? `<text x="72" y="204" fill="rgba(255,255,255,0.72)" font-size="22" font-family="Inter, Arial, sans-serif">${escapeXml(config.subtitle)}</text>`
          : ''
      }
      <g transform="translate(${chartOffsetX} ${chartOffsetY})">
        ${tickMarkup}
        ${goalMarkup}
        ${barMarkup}
        ${lineMarkup}
        ${labelMarkup}
      </g>
      <g transform="translate(72 628)">
        <text fill="rgba(255,255,255,0.64)" font-size="18" font-family="Inter, Arial, sans-serif">Total: ${escapeXml(formatMetricValue(stats.total, config.metric))}</text>
        <text x="290" fill="rgba(255,255,255,0.64)" font-size="18" font-family="Inter, Arial, sans-serif">Average: ${escapeXml(formatMetricValue(stats.average, config.metric))}</text>
        <text x="620" fill="rgba(255,255,255,0.64)" font-size="18" font-family="Inter, Arial, sans-serif">Peak: ${escapeXml(stats.peak ? `${stats.peak.label} ${formatMetricValue(stats.peak.value, config.metric)}` : 'n/a')}</text>
      </g>
    </svg>
  `;
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

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
