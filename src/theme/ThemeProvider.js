import React, { createContext, useContext, useMemo } from 'react';
import { THEMES } from './palettes';
import createStyles from './styles';
const ThemeContext = createContext(null);
export function ThemeProvider({
  theme,
  children
}) {
  const colors = THEMES[theme] || THEMES.menta;
  const value = useMemo(() => ({
    colors,
    styles: createStyles(colors)
  }), [colors]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('ThemeProvider is required');
  return theme;
}
