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

  useEffect(() => { localStorage.setItem('webmonitor-theme', mode); }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setMode('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const theme = useMemo(() => {
    const isDark = resolvedMode === 'dark';
    return createTheme({
      palette: {
        mode: resolvedMode,
        primary: { main: isDark ? '#90caf9' : '#1976d2' },
        secondary: { main: isDark ? '#f48fb1' : '#dc004e' },
        background: isDark
          ? { default: '#0f172a', paper: '#1e293b' }
          : { default: '#f8fafc', paper: '#ffffff' },
        text: isDark
          ? { primary: '#e2e8f0', secondary: '#94a3b8' }
          : { primary: '#1a1a1a', secondary: '#64748b' },
        divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "PingFang SC", "Microsoft YaHei", sans-serif',
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              color: isDark ? '#e2e8f0' : '#1a1a1a',
              boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderRight: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
            },
          },
        },
      },
    });
  }, [resolvedMode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolvedMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
