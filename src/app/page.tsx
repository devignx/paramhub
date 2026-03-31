'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Timer,
  Wifi,
  Tag,
  MessageCircle,
  CheckSquare,
  User,
  Cake,
  Megaphone,
  Hourglass,
  Code,
  Terminal,
  FileText,
  CircleDot,
  ArrowRight,
  QrCode,
  BarChart3,
} from 'lucide-react';

const categories = [
  {
    title: 'Dashboard Widgets',
    description: 'Embeddable widgets for Notion, Obsidian, and more',
    items: [
      {
        name: 'Progress Bar',
        description: 'Auto-updating progress for workday or year',
        href: '/progress',
        icon: Clock,
        badge: 'New',
      },
      {
        name: 'Focus Timer',
        description: 'Pomodoro-style countdown timer',
        href: '/timer',
        icon: Timer,
        badge: 'New',
      },
      {
        name: 'SVG Charts',
        description: 'Animated charts driven by URL params',
        href: '/chart',
        icon: BarChart3,
        badge: 'New',
      },
    ],
  },
  {
    title: 'Quick-Share Utilities',
    description: 'Send via DM without downloads or logins',
    items: [
      {
        name: 'WiFi Card',
        description: 'QR code for instant WiFi sharing',
        href: '/wifi',
        icon: Wifi,
      },
      {
        name: 'QR Generator',
        description: 'Customizable QR codes from URL params',
        href: '/qr',
        icon: QrCode,
      },
      {
        name: 'Price Tag',
        description: 'Professional "For Sale" signs',
        href: '/price',
        icon: Tag,
        badge: 'New',
      },
    ],
  },
  {
    title: 'Interaction Tools',
    description: 'Bypass annoying steps in digital life',
    items: [
      {
        name: 'WhatsApp Link',
        description: 'Click to chat without saving contact',
        href: '/whatsapp',
        icon: MessageCircle,
        badge: 'New',
      },
      {
        name: 'Checklist',
        description: 'Interactive list with state in URL',
        href: '/checklist',
        icon: CheckSquare,
        badge: 'New',
      },
    ],
  },
  {
    title: 'Professional Tools',
    description: 'Zero-asset hosting for your identity',
    items: [
      {
        name: 'Portfolio Card',
        description: 'Digital business card',
        href: '/card',
        icon: User,
        badge: 'New',
      },
      {
        name: 'Invoice',
        description: 'Clean, printable invoices',
        href: '/invoice',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Visual Suite',
    description: 'Beautiful animated experiences',
    items: [
      {
        name: 'Wish',
        description: 'Animated greeting cards with confetti',
        href: '/wish',
        icon: Cake,
      },
      {
        name: 'Announce',
        description: 'Big auto-scaling typography',
        href: '/announce',
        icon: Megaphone,
      },
      {
        name: 'Countdown',
        description: 'Timer to any date',
        href: '/countdown',
        icon: Hourglass,
      },
      {
        name: 'Decision Wheel',
        description: 'Spin to decide anything',
        href: '/decision',
        icon: CircleDot,
      },
    ],
  },
  {
    title: 'Developer Tools',
    description: 'Code snippets and terminal mockups',
    items: [
      {
        name: 'Code Snap',
        description: 'Beautiful syntax-highlighted code',
        href: '/code',
        icon: Code,
      },
      {
        name: 'Mock Terminal',
        description: 'Fake terminal with typing animation',
        href: '/terminal',
        icon: Terminal,
      },
    ],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-32">
          <div className="flex flex-col items-center text-center">
            <Badge variant="secondary" className="mb-6">
              No database. No login. Just URLs.
            </Badge>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 tracking-tight">
              ParamHub
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8 text-balance">
              URL-powered micro tools for the modern web.
              All data lives in your link — share anywhere, works forever.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Embeddable
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Social Previews
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Unlimited Use
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        {categories.map((category, categoryIndex) => (
          <div key={category.title} className="mb-16">
            <div className="mb-6">
              <h2 className="text-2xl font-serif mb-1">{category.title}</h2>
              <p className="text-muted-foreground">{category.description}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {category.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group relative flex items-start gap-4 p-5 rounded-xl border border-border bg-card hover:border-foreground/20 hover:bg-accent/50 transition-all duration-200"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground group-hover:text-foreground">
                        {item.name}
                      </h3>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
            {categoryIndex < categories.length - 1 && (
              <Separator className="mt-16" />
            )}
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Built with Next.js & Vercel OG. All data lives in your URL.
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="https://github.com" className="hover:text-foreground transition-colors">
                GitHub
              </a>
              <a href="https://twitter.com" className="hover:text-foreground transition-colors">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
