import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type') || 'default';
  const title = searchParams.get('title') || 'ParamHub';
  const subtitle = searchParams.get('subtitle') || 'URL-Powered Micro Tools';
  const theme = searchParams.get('theme') || 'dark';

  // Theme configurations
  const themes: Record<string, { bg: string; text: string; accent: string }> = {
    dark: { bg: '#0f172a', text: '#ffffff', accent: '#6366f1' },
    light: { bg: '#ffffff', text: '#1e293b', accent: '#6366f1' },
    pink: { bg: '#831843', text: '#ffffff', accent: '#f9a8d4' },
    blue: { bg: '#1e3a8a', text: '#ffffff', accent: '#93c5fd' },
    green: { bg: '#14532d', text: '#ffffff', accent: '#86efac' },
    neon: { bg: '#0a0a0a', text: '#00ff88', accent: '#00ff88' },
  };

  const currentTheme = themes[theme] || themes.dark;

  // Type-specific icons
  const icons: Record<string, string> = {
    wish: '🎂',
    announce: '📢',
    countdown: '⏱️',
    wifi: '📶',
    code: '💻',
    terminal: '⌨️',
    invoice: '📄',
    decision: '🎡',
    default: '⚡',
  };

  const icon = icons[type] || icons.default;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: currentTheme.bg,
          padding: '60px',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 25% 25%, ${currentTheme.accent}20 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${currentTheme.accent}15 0%, transparent 50%)`,
          }}
        />

        {/* Icon */}
        <div
          style={{
            fontSize: '100px',
            marginBottom: '30px',
          }}
        >
          {icon}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            color: currentTheme.text,
            textAlign: 'center',
            marginBottom: '20px',
            maxWidth: '900px',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '32px',
            color: currentTheme.text,
            opacity: 0.7,
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          {subtitle}
        </div>

        {/* Brand footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${currentTheme.accent}, #8b5cf6)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            ⚡
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: currentTheme.text,
              opacity: 0.6,
            }}
          >
            ParamHub
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
