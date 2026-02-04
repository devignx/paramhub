import { Metadata } from 'next';

interface GenerateMetadataOptions {
  title: string;
  description: string;
  type: string;
  theme?: string;
}

export function generateModuleMetadata({
  title,
  description,
  type,
  theme = 'dark',
}: GenerateMetadataOptions): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://paramhub.vercel.app';
  const ogImageUrl = `${baseUrl}/api/og?type=${type}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(description)}&theme=${theme}`;

  return {
    title: `${title} | ParamHub`,
    description,
    openGraph: {
      title: `${title} | ParamHub`,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ParamHub`,
      description,
      images: [ogImageUrl],
    },
  };
}
