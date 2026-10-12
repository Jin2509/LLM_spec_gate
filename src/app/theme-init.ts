/**
 * src/app/theme-init.ts
 *
 * Anti-FOUC (Flash of Unstyled Content) theme initializer.
 *
 * This script is injected as an INLINE <script> BEFORE the body renders,
 * preventing any flash of wrong theme color on page load or F5 reload.
 *
 * Execution order:
 *   1. Read localStorage['adjlab-theme']
 *   2. If absent, read prefers-color-scheme media query
 *   3. Set data-theme attribute on <html> immediately
 *
 * Storage key: 'adjlab-theme'  values: 'light' | 'dark'
 *
 * IMPORTANT: This file exports a string — NOT a React component.
 * The string is injected via dangerouslySetInnerHTML in layout.tsx.
 * It must remain self-contained: no imports, no module syntax.
 */
export const themeInitScript = `(function(){
  try {
    var stored = localStorage.getItem('adjlab-theme');
    var theme = stored === 'dark' || stored === 'light'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch(e) {
    // localStorage may be unavailable (e.g., private browsing restrictions)
    // Fall back gracefully to light theme
  }
})();`;
