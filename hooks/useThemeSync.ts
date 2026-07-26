import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Синхронізує вибрану в налаштуваннях тему (light / dark / system) з
 * атрибутом data-theme на <html>, на якому побудована вся дизайн-система
 * (див. src/styles/tokens.css). Раніше тема ніяк не застосовувалась —
 * весь застосунок був жорстко закодований на темну "ink"-палітру.
 */
export function useThemeSync() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      root.setAttribute('data-theme', resolved);
      root.style.colorScheme = resolved;
    };

    apply();

    if (theme === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [theme]);
}
