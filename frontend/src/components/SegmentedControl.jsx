import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';

const SegmentedControl = ({ options, value, onChange, renderLabel, sx = {} }) => {
  const handleChange = (event, newValue) => {
    if (newValue !== null) onChange(newValue);
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        p: 0.5,
        borderRadius: 999,
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : '#e2e8f0',
        border: '1px solid',
        borderColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : '#cbd5e1',
        '& .MuiToggleButtonGroup-grouped': {
          margin: 0,
          border: 0,
          borderRadius: 999,
        },
        ...sx,
      }}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.value}
          value={option.value}
          disableRipple
          sx={{
            px: 2.25,
            py: 0.8,
            minWidth: 60,
            borderRadius: 999,
            textTransform: 'none',
            fontSize: '0.8125rem',
            fontWeight: 700,
            lineHeight: 1,
            color: (theme) => theme.palette.text.primary,
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? '#ffffff' : 'primary.main',
              color: (theme) =>
                theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 2px 10px rgba(0,0,0,0.45)'
                  : `0 4px 14px ${theme.palette.primary.main}55`,
              '&:hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? '#ffffff' : 'primary.main',
              },
            },
            '&:not(.Mui-selected)': {
              '&:hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.12)'
                    : '#d1d5db',
              },
            },
          }}
        >
          {renderLabel ? renderLabel(option) : option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default SegmentedControl;
