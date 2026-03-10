import * as cheerio from 'cheerio';

interface OGData {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  url: string;
}

export async function scrapeOpenGraph(url: string): Promise<OGData> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'HavenBot/1.0 (+https://haven.app)' },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    return { title: null, description: null, imageUrl: null, siteName: null, url };
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const getMeta = (property: string): string | null =>
    $(`meta[property="${property}"]`).attr('content') ||
    $(`meta[name="${property}"]`).attr('content') ||
    null;

  return {
    title: getMeta('og:title') || $('title').text() || null,
    description: getMeta('og:description') || getMeta('description'),
    imageUrl: getMeta('og:image'),
    siteName: getMeta('og:site_name'),
    url,
  };
}
