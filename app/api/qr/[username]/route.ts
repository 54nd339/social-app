import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://haven.social';
  const profileUrl = `${baseUrl}/${username}`;

  try {
    const svg = await QRCode.toString(profileUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
