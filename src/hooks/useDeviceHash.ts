import { useEffect, useState } from 'react';

const STORAGE_KEY = 'elakhujan_device_id';

async function generateHash(): Promise<string> {
  const raw = [
    navigator.userAgent,
    screen.width,
    screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join('|');

  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useDeviceHash(): string | null {
  const [hash, setHash] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    if (hash) return;
    generateHash().then((h) => {
      localStorage.setItem(STORAGE_KEY, h);
      setHash(h);
    });
  }, [hash]);

  return hash;
}
