import React from 'react';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SegmentedControl from './SegmentedControl';

const LANGUAGE_OPTIONS = [
  { value: 'en', labelKey: 'language.en' },
  { value: 'zh-CN', labelKey: 'language.zhCN' },
];

const LanguageSwitcher = ({ sx = {} }) => {
  const { t, i18n } = useTranslation();

  const options = LANGUAGE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }));

  return (
    <Tooltip title={t('language.label')}>
      <SegmentedControl
        options={options}
        value={i18n.language}
        onChange={(value) => i18n.changeLanguage(value)}
        sx={sx}
      />
    </Tooltip>
  );
};

export default LanguageSwitcher;
