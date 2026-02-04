'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader, CreatorCard, ActionButtons, TextInput, OptionGrid } from '@/components/shared';
import { ViewContainer, CreatorContainer } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Wifi } from 'lucide-react';

interface WifiConfig {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
  theme: 'light' | 'dark' | 'gradient';
}

const themeStyles = {
  light: {
    bg: 'bg-white',
    card: 'bg-white shadow-xl border border-gray-100',
    text: 'text-gray-900',
    subtext: 'text-gray-500',
    qrFg: '#18181b',
  },
  dark: {
    bg: 'bg-zinc-950',
    card: 'bg-zinc-900 border border-zinc-800',
    text: 'text-white',
    subtext: 'text-zinc-400',
    qrFg: '#ffffff',
  },
  gradient: {
    bg: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
    card: 'bg-white/95 backdrop-blur-sm shadow-2xl',
    text: 'text-gray-900',
    subtext: 'text-gray-600',
    qrFg: '#059669',
  },
};

function generateWifiString(config: WifiConfig): string {
  const enc = config.encryption === 'nopass' ? '' : config.encryption;
  const pass = config.encryption === 'nopass' ? '' : config.password;
  const hidden = config.hidden ? 'H:true' : '';
  return `WIFI:T:${enc};S:${config.ssid};P:${pass};${hidden};`;
}

function WifiContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<WifiConfig>({
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
    theme: 'gradient',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const ssid = searchParams.get('ssid');
    const pass = searchParams.get('pass');
    const enc = searchParams.get('enc') as WifiConfig['encryption'];
    const hidden = searchParams.get('hidden');
    const theme = searchParams.get('theme') as WifiConfig['theme'];

    if (ssid) {
      setIsCreating(false);
      setConfig({
        ssid,
        password: pass || '',
        encryption: enc || 'WPA',
        hidden: hidden === 'true',
        theme: theme || 'gradient',
      });
    }
  }, [searchParams]);

  const generateUrl = () => {
    const params = new URLSearchParams({
      ssid: config.ssid,
      enc: config.encryption,
      theme: config.theme,
    });
    if (config.password) params.set('pass', config.password);
    if (config.hidden) params.set('hidden', 'true');
    return `${window.location.origin}/wifi?${params.toString()}`;
  };

  const theme = themeStyles[config.theme];
  const isValid = config.ssid && (config.encryption === 'nopass' || config.password);

  if (!isCreating) {
    return (
      <ViewContainer createHref="/wifi" className={`${theme.bg} flex items-center justify-center p-8 min-h-screen`}>
        <div className={`${theme.card} rounded-2xl p-8 max-w-sm w-full text-center`}>
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
            <Wifi className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className={`text-xl font-serif mb-1 ${theme.text}`}>Connect to WiFi</h1>
          <p className={`text-sm mb-6 ${theme.subtext}`}>Scan the QR code with your camera</p>

          <div className="inline-block p-4 bg-white rounded-xl shadow-inner mb-6">
            <QRCodeSVG
              value={generateWifiString(config)}
              size={180}
              level="M"
              bgColor="#ffffff"
              fgColor={theme.qrFg}
            />
          </div>

          <div className={`text-left space-y-3 p-4 rounded-lg ${config.theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme.subtext}`}>Network</span>
              <span className={`font-medium ${theme.text}`}>{config.ssid}</span>
            </div>
            {config.encryption !== 'nopass' && (
              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme.subtext}`}>Password</span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className={`font-mono text-sm flex items-center gap-2 ${theme.text}`}
                >
                  {showPassword ? config.password : '••••••••'}
                  {showPassword ? <EyeOff className="w-4 h-4 opacity-50" /> : <Eye className="w-4 h-4 opacity-50" />}
                </button>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme.subtext}`}>Security</span>
              <span className={`font-medium ${theme.text}`}>{config.encryption === 'nopass' ? 'Open' : config.encryption}</span>
            </div>
          </div>
        </div>
      </ViewContainer>
    );
  }

  return (
    <CreatorContainer>
      <PageHeader
        title="WiFi Card"
        description="QR code for instant WiFi sharing with guests."
      />

      <CreatorCard title="Create WiFi Card" description="Guests scan to connect instantly — no more repeating passwords.">
        <div className="space-y-6">
          <TextInput
            label="Network Name (SSID)"
            value={config.ssid}
            onChange={(ssid) => setConfig({ ...config, ssid })}
            placeholder="MyHomeWiFi"
            required
          />

          <OptionGrid
            label="Security Type"
            options={[
              { value: 'WPA', label: 'WPA/WPA2' },
              { value: 'WEP', label: 'WEP' },
              { value: 'nopass', label: 'Open' },
            ]}
            value={config.encryption}
            onChange={(encryption) => setConfig({ ...config, encryption })}
            columns={3}
          />

          {config.encryption !== 'nopass' && (
            <div className="space-y-2">
              <Label>Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder="Enter WiFi password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <OptionGrid
            label="Card Theme"
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'gradient', label: 'Gradient' },
            ]}
            value={config.theme}
            onChange={(theme) => setConfig({ ...config, theme })}
            columns={3}
          />

          <div className="flex items-center gap-2">
            <Checkbox
              id="hidden"
              checked={config.hidden}
              onCheckedChange={(checked) => setConfig({ ...config, hidden: !!checked })}
            />
            <Label htmlFor="hidden" className="font-normal">Hidden network</Label>
          </div>

          {/* Preview */}
          {config.ssid && (
            <div className={`p-6 rounded-lg ${theme.bg} flex justify-center`}>
              <div className="p-3 bg-white rounded-lg shadow">
                <QRCodeSVG
                  value={generateWifiString(config)}
                  size={120}
                  level="M"
                  bgColor="#ffffff"
                  fgColor={theme.qrFg}
                />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Note: Password will be visible in the URL. Only share with trusted people.
          </p>

          <ActionButtons generateUrl={generateUrl} disabled={!isValid} />
        </div>
      </CreatorCard>
    </CreatorContainer>
  );
}

export default function WifiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <WifiContent />
    </Suspense>
  );
}
