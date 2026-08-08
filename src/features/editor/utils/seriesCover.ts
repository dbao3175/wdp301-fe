const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] || character);

export function createSeriesCoverFallback(title: string): string {
  const safeTitle = escapeXml(title || 'Manga Series');
  const initials = escapeXml(
    (title || 'Manga Series')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase())
      .join(''),
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
    <rect width="800" height="520" fill="#171717"/>
    <path d="M0 390L270 120L430 280L610 70L800 260V520H0Z" fill="#242424"/>
    <circle cx="690" cy="95" r="94" fill="#E63946"/>
    <text x="54" y="94" fill="#E63946" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="5">MANGAFLOW CATALOGUE</text>
    <text x="54" y="290" fill="#F6F0E4" font-family="Arial, sans-serif" font-size="72" font-weight="900">${initials}</text>
    <foreignObject x="54" y="326" width="680" height="142">
      <div xmlns="http://www.w3.org/1999/xhtml" style="color:#F6F0E4;font:900 34px Arial,sans-serif;line-height:1.1;text-transform:uppercase">${safeTitle}</div>
    </foreignObject>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function resolveSeriesCover(title: string, source?: string): string {
  if (source && !/cdn\.myanimelist\.net|placehold\.co/i.test(source)) {
    return source;
  }

  return createSeriesCoverFallback(title);
}

export function useSeriesCoverFallback(
  image: HTMLImageElement,
  title: string,
): void {
  const fallback = createSeriesCoverFallback(title);
  if (image.src !== fallback) image.src = fallback;
}
