import { NextRequest } from 'next/server';
import QRCode from 'qrcode';

type ErrorLevel = 'L' | 'M' | 'Q' | 'H';
type QrFormat = 'svg' | 'png';

function parseNumber(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const data = searchParams.get('d') ?? searchParams.get('data') ?? '';
  if (!data) {
    return new Response(
      JSON.stringify({ error: 'Missing "d" or "data" query parameter for QR content.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const size = parseNumber(searchParams.get('size'), 256, 64, 1024);
  const level = (searchParams.get('lvl') ?? searchParams.get('level')) as ErrorLevel | null;
  const fg = searchParams.get('fg') || '#020617';
  const bg = searchParams.get('bg') || '#ffffff';
  const marginParam = searchParams.get('margin');
  const includeMargin = marginParam === '1' || marginParam === 'true';
  const fmt = (searchParams.get('fmt') as QrFormat | null) || 'png';

  const errorCorrectionLevel: ErrorLevel = level && ['L', 'M', 'Q', 'H'].includes(level) ? level : 'M';

  try {
    if (fmt === 'svg') {
      const svg = await QRCode.toString(data, {
        type: 'svg',
        errorCorrectionLevel,
        color: {
          dark: fg,
          light: bg,
        },
        margin: includeMargin ? 4 : 0,
        width: size,
      });

      return new Response(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': 'inline; filename="qr.svg"',
        },
      });
    }

    const buffer = await QRCode.toBuffer(data, {
      type: 'png',
      errorCorrectionLevel,
      color: {
        dark: fg,
        light: bg,
      },
      margin: includeMargin ? 4 : 0,
      width: size,
    });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="qr.png"',
      },
    });
  } catch (err) {
    console.error('QR generation failed', err);
    return new Response(
      JSON.stringify({ error: 'Failed to generate QR code.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

