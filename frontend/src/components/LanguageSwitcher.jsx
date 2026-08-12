import React from 'react';
import { Box, Button, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

const LANGUAGE_OPTIONS = [
  { value: 'en', labelKey: 'language.en' },
  { value: 'zh-CN', labelKey: 'language.zhCN' },
];

const LanguageSwitcher = ({ sx = {} }) => {
  const { t, i18n } = useTranslation();

  return (
    <Tooltip title={t('language.label')}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          p: 0.5,
          borderRadius: 999,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.18)',
          ...sx,
        }}
      >
        {LANGUAGE_OPTIONS.map((option) => {
          const isActive = i18n.language === option.value;

          return (
            <Button
              key={option.value}
              onClick={() => i18n.changeLanguage(option.value)}
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
                color: isActive ? '#ffffff' : (theme) => theme.palette.text.primary,
                background: isActive ? 'primary.main' : 'transparent',
                boxShadow: isActive ? (theme) => `0 6px 18px ${theme.palette.primary.main}66` : 'none',
                '&:hover': {
                  background: isActive ? 'primary.main' : (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
                  color: isActive ? '#ffffff' : (theme) => theme.palette.text.primary,
                },
              }}
            >
              {t(option.labelKey)}
            </Button>
          );
        })}
      </Box>
    </Tooltip>
  );
};

export default LanguageSwitcher;
