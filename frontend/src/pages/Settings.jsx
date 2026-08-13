import React from 'react';
import { Box, Container, Typography, Paper, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../contexts/ThemeContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import SegmentedControl from '../components/SegmentedControl';

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
            <SegmentedControl
              options={THEME_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey), emoji: opt.emoji }))}
              value={mode}
              onChange={setMode}
              renderLabel={(opt) => (
                <>
                  {opt.emoji} {opt.label}
                  {mode === 'system' && opt.value === 'system' && (
                    <Box component="span" sx={{ ml: 0.5, fontSize: '0.7rem', opacity: 0.85 }}>
                      ({resolvedMode === 'dark' ? t('settings.themeDark') : t('settings.themeLight')})
                    </Box>
                  )}
                </>
              )}
            />
          </Tooltip>
        </Paper>
      </Container>
    </Box>
  );
};

export default Settings;
