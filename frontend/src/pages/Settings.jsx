import React from 'react';
import { Box, Container, Typography, Paper, Tooltip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../contexts/ThemeContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const THEME_OPTIONS = [
  { value: 'light', labelKey: 'settings.themeLight', emoji: '\u2600\uFE0F' },
  { value: 'dark', labelKey: 'settings.themeDark', emoji: '\uD83C\uDF19' },
  { value: 'system', labelKey: 'settings.themeSystem', emoji: '\uD83D\uDCBB' },
];

const Settings = () => {
  const { t } = useTranslation();
  const { mode, setMode, resolvedMode } = useThemeMode();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          {t('settings.title')}
        </Typography>

        {/* Language */}
        <Paper sx={{ p: 4, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            {t('settings.language')}
          </Typography>
          <LanguageSwitcher />
        </Paper>

        {/* Theme */}
        <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {t('settings.appearance')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('settings.appearanceDesc')}
          </Typography>
          <Tooltip title={t('settings.themeLabel')}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(event, newValue) => newValue && setMode(newValue)}
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#eef1f6',
                border: '1px solid',
                borderColor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : '#d4dae4',
                borderRadius: 999,
                p: 0.4,
                gap: 0.4,
                '& .MuiToggleButtonGroup-grouped': {
                  margin: 0,
                  border: 0,
                  borderRadius: 999,
                },
              }}
            >
              {THEME_OPTIONS.map((opt) => (
                <ToggleButton
                  key={opt.value}
                  value={opt.value}
                  disableRipple
                  sx={{
                    minWidth: 56,
                    px: 1.75,
                    py: 0.75,
                    borderRadius: 999,
                    textTransform: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    color: (theme) => theme.palette.text.primary,
                    border: '1px solid transparent',
                    '&.Mui-selected': {
                      color: '#ffffff',
                      bgcolor: 'primary.main',
                      borderColor: 'primary.main',
                      boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}55`,
                      '&:hover': { bgcolor: 'primary.main' },
                    },
                    '&:not(.Mui-selected)': {
                      '&:hover': {
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : '#e2e7ef',
                      },
                    },
                  }}
                >
                  {opt.emoji} {t(opt.labelKey)}
                  {mode === 'system' && opt.value === 'system' && (
                    <Box component="span" sx={{ ml: 0.5, fontSize: '0.7rem', opacity: 0.85 }}>
                      ({resolvedMode === 'dark' ? t('settings.themeDark') : t('settings.themeLight')})
                    </Box>
                  )}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Tooltip>
        </Paper>
      </Container>
    </Box>
  );
};

export default Settings;
