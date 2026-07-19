import React from 'react';
import { Box, Container, Typography, Paper, Button, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../contexts/ThemeContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { isChineseLanguage } from '../utils/i18n';

const THEME_OPTIONS = [
  { value: 'light', labelKey: 'settings.themeLight', emoji: '\u2600\uFE0F' },
  { value: 'dark', labelKey: 'settings.themeDark', emoji: '\uD83C\uDF19' },
  { value: 'system', labelKey: 'settings.themeSystem', emoji: '\uD83D\uDCBB' },
];

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { mode, setMode, resolvedMode } = useThemeMode();
  const isChinese = isChineseLanguage(i18n.language);

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
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                p: 0.5,
                borderRadius: 999,
                backgroundColor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {THEME_OPTIONS.map((opt) => {
                const isActive = mode === opt.value;
                return (
                  <Button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    disableElevation
                    sx={{
                      minWidth: 56,
                      px: 1.75,
                      py: 0.75,
                      borderRadius: 999,
                      textTransform: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      lineHeight: 1,
                      color: isActive ? '#ffffff' : 'text.secondary',
                      background: isActive ? 'primary.main' : 'transparent',
                      boxShadow: isActive ? (theme) => `0 6px 18px ${theme.palette.primary.main}44` : 'none',
                      '&:hover': {
                        background: isActive ? 'primary.main' : 'action.hover',
                      },
                    }}
                  >
                    {opt.emoji} {t(opt.labelKey)}
                    {isActive && opt.value === 'system' && (
                      <Box component="span" sx={{ ml: 0.5, fontSize: '0.7rem', opacity: 0.8 }}>
                        ({resolvedMode === 'dark' ? t('settings.themeDark') : t('settings.themeLight')})
                      </Box>
                    )}
                  </Button>
                );
              })}
            </Box>
          </Tooltip>
        </Paper>
      </Container>
    </Box>
  );
};

export default Settings;
