import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Settings = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 4 }}>
          {t('settings.title') || '设置'}
        </Typography>

        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            {t('settings.language') || '语言设置'}
          </Typography>
          <LanguageSwitcher />
        </Paper>
      </Container>
    </Box>
  );
};

export default Settings;
