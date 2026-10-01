declare const __APP_VERSION__: string;
declare const __APP_BUILT__: string;

// Which build of the game this is. CI sets GIT_SHA when it builds the image (see the Dockerfile and the workflow);
// a local build says "dev".
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
export const APP_BUILT: string = typeof __APP_BUILT__ === 'string' ? __APP_BUILT__ : '';

export function formatBuilt(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

/** The version the server is running now (from /api/health), or undefined when it cannot be reached. */
export async function fetchServerVersion(): Promise<{ version: string; built?: string } | undefined> {
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    if (!response.ok) return undefined;
    const body = await response.json() as { version?: string; built?: string };
    return body.version ? { version: body.version, built: body.built } : undefined;
  } catch { return undefined; }
}
