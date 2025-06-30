'use client';
import { useEffect } from 'react';

const FAVICONS = [
  '/browsericons/f1car.svg',
  '/browsericons/baseball.svg',
  '/browsericons/boxing.svg',
  '/browsericons/rugbyball.svg',
  '/browsericons/basketball.svg',
  '/browsericons/gaaball.svg',
];

function pickNonRepeatingRandomIcon(): string {
  if (typeof window === 'undefined') return FAVICONS[0];
  const lastIcon = sessionStorage.getItem('lastFavicon');
  let available = FAVICONS;
  if (lastIcon && FAVICONS.length > 1) {
    available = FAVICONS.filter(icon => icon !== lastIcon);
  }
  const icon = available[Math.floor(Math.random() * available.length)];
  sessionStorage.setItem('lastFavicon', icon);
  return icon;
}

export default function FaviconRandomizer() {
  useEffect(() => {
    const icon = pickNonRepeatingRandomIcon();
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = icon;
  }, []);
  return null;
} 