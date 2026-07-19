import React from 'react';
import { Box, Container, Typography, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../contexts/ThemeContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { isChineseLanguage } from '../utils/i18n';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { mode, setMode, resolvedMode } = useThemeMode();
  const isChinese = isChineseLanguage(i18n.language);

  const themeOptions = [
    { value: 'light', label: isChinese ? '亮色' : 'Light', emoji: '☀️' },
    { value: 'dark', label: isChinese ? '暗色' : 'Dark', emoji: '🌙' },
    { value: 'system', label: isChinese ? '跟随系统' : 'System', emoji: '💻' },
  ];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          {t('settings.title') || (isChinese ? '设置' : 'Settings')}
        </Typography>

        {/* Language */}
        <Paper sx={{ p: 4, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            {t('settings.language') || (isChinese ? '语言设置' : 'Language')}
          </Typography>
          <LanguageSwitcher />
        </Paper>

        {/* Theme */}
        <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {isChinese ? '外观' : 'Appearance'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {isChinese ? '选择界面颜色主题' : 'Choose your color theme'}
          </Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => v && setMode(v)}
            fullWidth
            sx={{ '& .MuiToggleButton-root': { py: 2, textTransform: 'none', fontWeight: 600 } }}
          >
            {themeOptions.map((opt) => (
              <ToggleButton key={opt.value} value={opt.value}>
                {opt.emoji} {opt.label}
                {mode === opt.value && opt.value !== 'system' && (
                  <Box component="span" sx={{ ml: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
                    {isChinese ? '当前' : 'active'}
                  </Box>
                )}
                {mode === opt.value && opt.value === 'system' && (
                  <Box component="span" sx={{ ml: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
                    ({resolvedMode === 'dark' ? (isChinese ? '暗色' : 'Dark') : (isChinese ? '亮色' : 'Light')})
                  </Box>
                )}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Paper>
      </Container>
    </Box>
  );
};

export default Settings;
