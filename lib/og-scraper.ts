import * as cheerio from 'cheerio';

export interface OgData {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

export async function scrapeOgData(url: string): Promise<OgData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HavenBot/1.0 (+https://haven.social)',
        Accept: 'text/html',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const getMeta = (property: string): string | null => {
      return (
        $(`meta[property="${property}"]`).attr('content') ??
        $(`meta[name="${property}"]`).attr('content') ??
        null
      );
    };

    const title = getMeta('og:title') ?? $('title').text() ?? null;
    const description = getMeta('og:description') ?? getMeta('description');
    let imageUrl = getMeta('og:image');
    const siteName = getMeta('og:site_name');

    if (imageUrl && !imageUrl.startsWith('http')) {
      const base = new URL(url);
      imageUrl = new URL(imageUrl, base.origin).toString();
    }

    return {
      url,
      title: title?.slice(0, 200) ?? null,
      description: description?.slice(0, 500) ?? null,
      imageUrl,
      siteName: siteName?.slice(0, 100) ?? null,
    };
  } catch {
    return null;
  }
}
