import { pack, unpack } from '@/lib/url-utils';

export interface ChartPoint {
  label: string;
  value: number;
}

export type ChartType = 'bar' | 'line' | 'area';
export type ChartTheme = 'aurora' | 'sunset' | 'mint' | 'mono';
export type ChartAsset = 'svg' | 'page';

export interface ChartRenderConfig {
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

export interface ChartStats {
  total: number;
  average: number;
  peak: ChartPoint | null;
  change: number;
}

export interface EncodedChartData {
  strategy: 'data' | 'labels-values' | 'payload';
  queryParams: Record<string, string>;
}

const MAX_INLINE_DATA_LENGTH = 220;

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function sanitizeChartPoints(points: ChartPoint[]): ChartPoint[] {
  return points
    .map((point) => ({
      label: point.label.trim(),
      value: Number.isFinite(point.value) ? Math.max(0, point.value) : 0,
    }))
    .filter((point) => point.label.length > 0);
}

export function serializeChartData(points: ChartPoint[]): string {
  return sanitizeChartPoints(points)
    .map((point) => `${point.label}:${trimNumber(point.value)}`)
    .join('|');
}

export function parseChartDataParam(value: string | null): ChartPoint[] {
  if (!value) return [];

  return sanitizeChartPoints(
    value
      .split('|')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => {
        const separatorIndex = Math.max(segment.lastIndexOf(':'), segment.lastIndexOf('='));
        if (separatorIndex <= 0) {
          return null;
        }

        const label = segment.slice(0, separatorIndex).trim();
        const rawValue = segment.slice(separatorIndex + 1).trim();
        const numericValue = Number(rawValue);

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

export function parseLabelsAndValues(
  labelsValue: string | null,
  valuesValue: string | null,
): ChartPoint[] {
  if (!labelsValue || !valuesValue) return [];

  const labels = labelsValue
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean);
  const values = valuesValue
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value));

  const length = Math.min(labels.length, values.length);

  return sanitizeChartPoints(
    Array.from({ length }, (_, index) => ({
      label: labels[index],
      value: values[index],
    })),
  );
}

export function parsePayloadData(payloadValue: string | null): ChartPoint[] {
  if (!payloadValue) return [];

  const payload = unpack<{ data?: ChartPoint[] }>(payloadValue);
  if (!payload?.data || payload.data.length === 0) {
    return [];
  }

  return sanitizeChartPoints(payload.data);
}

export function encodeChartDataForUrl(points: ChartPoint[]): EncodedChartData {
  const cleanPoints = sanitizeChartPoints(points);
  if (cleanPoints.length === 0) {
    return {
      strategy: 'data',
      queryParams: {},
    };
  }

  const serializedData = serializeChartData(cleanPoints);
  const serializedLabels = cleanPoints.map((point) => point.label).join(',');
  const serializedValues = cleanPoints.map((point) => trimNumber(point.value)).join(',');

  const canUseDataParam = cleanPoints.every(
    (point) => !/[|:=]/.test(point.label),
  );
  const canUseSplitParams = cleanPoints.every(
    (point) => !/,/.test(point.label),
  );

  const dataParamLength = serializedData.length;
  const splitParamsLength = serializedLabels.length + serializedValues.length;

  if (
    canUseDataParam &&
    dataParamLength <= MAX_INLINE_DATA_LENGTH &&
    (!canUseSplitParams || dataParamLength <= splitParamsLength)
  ) {
    return {
      strategy: 'data',
      queryParams: {
        data: serializedData,
      },
    };
  }

  if (canUseSplitParams && splitParamsLength <= MAX_INLINE_DATA_LENGTH) {
    return {
      strategy: 'labels-values',
      queryParams: {
        labels: serializedLabels,
        values: serializedValues,
      },
    };
  }

  return {
    strategy: 'payload',
    queryParams: {
      payload: pack({ data: cleanPoints }),
    },
  };
}

export function calculateChartStats(points: ChartPoint[]): ChartStats {
  const cleanPoints = sanitizeChartPoints(points);
  const total = cleanPoints.reduce((sum, point) => sum + point.value, 0);
  const average = cleanPoints.length > 0 ? total / cleanPoints.length : 0;
  const peak =
    cleanPoints.length > 0
      ? cleanPoints.reduce((maxPoint, point) =>
          point.value > maxPoint.value ? point : maxPoint,
        )
      : null;
  const change =
    cleanPoints.length > 1
      ? cleanPoints[cleanPoints.length - 1].value - cleanPoints[0].value
      : 0;

  return {
    total,
    average,
    peak,
    change,
  };
}

export function formatMetricValue(value: number, metric: string): string {
  const formattedNumber = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value);
  const trimmedMetric = metric.trim();

  if (!trimmedMetric) {
    return formattedNumber;
  }

  if (/^[\$€£¥₹]/.test(trimmedMetric)) {
    return `${trimmedMetric}${formattedNumber}`;
  }

  return `${formattedNumber}${trimmedMetric}`;
}

function trimNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}
