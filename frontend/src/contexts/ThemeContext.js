import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

export const useThemeMode = () => useContext(ThemeContext);

const getStoredMode = () => {
  try { return localStorage.getItem('webmonitor-theme') || 'system'; } catch { return 'system'; }
};

const getSystemMode = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getStoredMode);

  const resolvedMode = mode === 'system' ? getSystemMode() : mode;

  useEffect(() => {
    localStorage.setItem('webmonitor-theme', mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setMode('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const theme = useMemo(() => createTheme({
    palette: {
      mode: resolvedMode,
      primary: { main: resolvedMode === 'dark' ? '#90caf9' : '#1976d2' },
      secondary: { main: resolvedMode === 'dark' ? '#f48fb1' : '#dc004e' },
      ...(resolvedMode === 'dark' ? {
        background: { default: '#121212', paper: '#1e1e1e' },
      } : {}),
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "PingFang SC", "Microsoft YaHei", sans-serif',
    },
  }), [resolvedMode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolvedMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
