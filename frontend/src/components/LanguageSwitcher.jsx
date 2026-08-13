import React from 'react';
import { Button, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

const LANGUAGE_OPTIONS = [
  { value: 'en', labelKey: 'language.en' },
  { value: 'zh-CN', labelKey: 'language.zhCN' },
];

const LanguageSwitcher = ({ sx = {} }) => {
  const { t, i18n } = useTranslation();

  const handleChange = (event, newValue) => {
    if (newValue) i18n.changeLanguage(newValue);
  };

  return (
    <Tooltip title={t('language.label')}>
      <ToggleButtonGroup
        value={i18n.language}
        exclusive
        onChange={handleChange}
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
          ...sx,
        }}
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <ToggleButton
            key={option.value}
            value={option.value}
            disableRipple
            sx={{
              px: 2,
              py: 0.75,
              minWidth: 64,
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
            {t(option.labelKey)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Tooltip>
  );
};

export default LanguageSwitcher;
