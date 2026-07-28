import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Синхронізує вибрану в налаштуваннях тему (light / dark / system) з
 * атрибутом data-theme на <html>, на якому побудована вся дизайн-система
 * (див. src/styles/tokens.css). Раніше тема ніяк не застосовувалась —
 * весь застосунок був жорстко закодований на темну "ink"-палітру.
 */
/**
 * Синхронізує вибрану в налаштуваннях тему (light / dark / amoled) з
 * атрибутом data-theme на <html>, на якому побудована вся дизайн-система
 * (див. src/styles/tokens.css). Усі 3 теми — це реальні, візуально різні
 * палітри (а не "авто", що просто підлаштовувалось під light/dark).
 */
export function useThemeSync() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
  }, [theme]);
}
