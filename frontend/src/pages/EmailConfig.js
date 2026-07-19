import React, { useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Avatar, Tooltip, Card, CardContent, Chip, Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as TestIcon,
  Notifications as NotificationsIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  OpenInNew as LinkIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { isChineseLanguage } from '../utils/i18n';

const EXAMPLE_URLS = {
  zh: [
    { label: 'Email', url: 'mailto://user:pass@example.com', desc: 'SMTP email' },
    { label: 'Telegram', url: 'tgram://bottoken/ChatID', desc: 'Telegram Bot' },
    { label: 'Slack', url: 'slack://TokenA/TokenB/TokenC/Channel', desc: 'Slack Webhook' },
    { label: 'Discord', url: 'discord://WebhookID/WebhookToken', desc: 'Discord Webhook' },
    { label: 'Bark', url: 'bark://key@push.example.com', desc: 'Bark 推送' },
    { label: 'Pushover', url: 'pover://user@token', desc: 'Pushover' },
    { label: 'Gotify', url: 'gotify://hostname/token', desc: 'Gotify' },
  ],
  en: [
    { label: 'Email', url: 'mailto://user:pass@example.com', desc: 'SMTP email' },
    { label: 'Telegram', url: 'tgram://bottoken/ChatID', desc: 'Telegram Bot' },
    { label: 'Slack', url: 'slack://TokenA/TokenB/TokenC/Channel', desc: 'Slack Webhook' },
    { label: 'Discord', url: 'discord://WebhookID/WebhookToken', desc: 'Discord Webhook' },
    { label: 'Bark', url: 'bark://key@push.example.com', desc: 'Bark Push' },
    { label: 'Pushover', url: 'pover://user@token', desc: 'Pushover' },
    { label: 'Gotify', url: 'gotify://hostname/token', desc: 'Gotify' },
  ],
};

const NotificationConfig = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({ name: '', apprise_urls: '' });
  const [testResult, setTestResult] = useState(null);
  const { t, i18n } = useTranslation();
  const isChinese = isChineseLanguage(i18n.language);

  const content = isChinese ? {
    title: '通知配置',
    subtitle: '配置多渠道通知，监控到变化时自动推送',
    addConfig: '添加配置',
    configs: '通知配置',
    count: '配置数量',
    testOk: '测试成功',
    noConfigs: '暂无通知配置',
    noConfigsSubtitle: '添加第一个通知配置开始使用',
    createFirst: '创建第一个配置',
    createTitle: '创建通知配置',
    editTitle: '编辑通知配置',
    name: '配置名称',
    nameHelper: '例如：Telegram 推送、通知',
    urls: '通知 URL',
    urlsHelper: '每行一个 URL，支持 apprise 所有渠道',
    supportedChannels: '支持的渠道',
    cancel: '取消',
    save: '保存',
    test: '测试',
    delete: '删除',
    edit: '编辑',
    actions: '操作',
    testSent: '测试通知已发送',
    testFailed: '测试失败',
    deleteConfirm: '确定删除此配置？',
  } : {
    title: 'Notification Config',
    subtitle: 'Configure multi-channel notifications for content changes',
    addConfig: 'Add config',
    configs: 'Notification configs',
    count: 'Configs',
    testOk: 'Test passed',
    noConfigs: 'No notification configs yet',
    noConfigsSubtitle: 'Add your first config to start receiving notifications',
    createFirst: 'Create first config',
    createTitle: 'Create notification config',
    editTitle: 'Edit notification config',
    name: 'Config name',
    nameHelper: 'e.g. Telegram push, Email notification',
    urls: 'Notification URLs',
    urlsHelper: 'One URL per line, supports all apprise channels',
    supportedChannels: 'Supported channels',
    cancel: 'Cancel',
    save: 'Save',
    test: 'Test',
    delete: 'Delete',
    edit: 'Edit',
    actions: 'Actions',
    testSent: 'Test notification sent',
    testFailed: 'Test failed',
    deleteConfirm: 'Delete this config?',
  };

  const queryClient = useQueryClient();

  const { data: configs = [] } = useQuery('emailConfigs', async () => {
    const res = await axios.get('/api/notify-configs');
    return res.data;
  });

  const createMutation = useMutation(
    async (data) => axios.post('/api/notify-configs', data),
    { onSuccess: () => { queryClient.invalidateQueries('emailConfigs'); setOpenDialog(false); resetForm(); } }
  );

  const updateMutation = useMutation(
    async ({ id, ...data }) => axios.put(`/api/notify-configs/${id}`, data),
    { onSuccess: () => { queryClient.invalidateQueries('emailConfigs'); setOpenDialog(false); resetForm(); } }
  );

  const deleteMutation = useMutation(
    async (id) => axios.delete(`/api/notify-configs/${id}`),
    { onSuccess: () => queryClient.invalidateQueries('emailConfigs') }
  );

  const testMutation = useMutation(
    async (id) => axios.post(`/api/notify-configs/${id}/test`),
    {
      onSuccess: (res) => setTestResult({ ok: res.data.success, msg: res.data.message || res.data.error }),
      onError: () => setTestResult({ ok: false, msg: content.testFailed }),
    }
  );

  const resetForm = () => { setFormData({ name: '', apprise_urls: '' }); setEditingConfig(null); };

  const handleOpen = (config = null) => {
    if (config) {
      setEditingConfig(config);
      setFormData({ name: config.name, apprise_urls: config.apprise_urls || '' });
    } else {
      resetForm();
    }
    setTestResult(null);
    setOpenDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleTest = (id) => {
    setTestResult(null);
    testMutation.mutate(id);
  };

  const handleDelete = (id) => {
    if (window.confirm(content.deleteConfirm)) {
      deleteMutation.mutate(id);
    }
  };

  const urlCount = (config) => {
    if (!config.apprise_urls) return 0;
    return config.apprise_urls.split('\n').filter(u => u.trim()).length;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            {content.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">{content.subtitle}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}
          sx={{ background: 'linear-gradient(45deg, #2563eb 30%, #1d4ed8 90%)', py: 1.5, px: 3, borderRadius: 2, textTransform: 'none', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)', '&:hover': { background: 'linear-gradient(45deg, #1d4ed8 30%, #1e40af 90%)' } }}>
          {content.addConfig}
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, minHeight: 120, background: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', mr: 2, width: 48, height: 48 }}>
                  <NotificationsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{configs.length}</Typography>
                  <Typography variant="body2" color="text.secondary">{content.count}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Config table */}
      {configs.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>{content.noConfigs}</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>{content.noConfigsSubtitle}</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ textTransform: 'none' }}>
            {content.createFirst}
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>{content.name}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{content.urls}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{content.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{config.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${urlCount(config)} URL`} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={content.test}>
                      <IconButton size="small" onClick={() => handleTest(config.id)} color="primary">
                        <TestIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={content.edit}>
                      <IconButton size="small" onClick={() => handleOpen(config)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={content.delete}>
                      <IconButton size="small" onClick={() => handleDelete(config.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Supported channels info */}
      <Paper sx={{ mt: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InfoIcon sx={{ mr: 1, color: '#2563eb' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{content.supportedChannels}</Typography>
        </Box>
        <Grid container spacing={1}>
          {(isChinese ? EXAMPLE_URLS.zh : EXAMPLE_URLS.en).map((ch) => (
            <Grid item key={ch.label}>
              <Chip label={`${ch.label}: ${ch.desc}`} variant="outlined" size="small" />
            </Grid>
          ))}
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {isChinese ? '完整列表见' : 'Full list at'}{' '}
          <Link href="https://github.com/caronc/apprise/wiki" target="_blank" rel="noopener" sx={{ display: 'inline-flex', alignItems: 'center' }}>
            apprise wiki <LinkIcon sx={{ fontSize: 12, ml: 0.5 }} />
          </Link>
        </Typography>
      </Paper>

      {/* Create/Edit dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingConfig ? content.editTitle : content.createTitle}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label={content.name} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} helperText={content.nameHelper} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth multiline rows={6} label={content.urls} value={formData.apprise_urls} onChange={(e) => setFormData({ ...formData, apprise_urls: e.target.value })} helperText={content.urlsHelper} placeholder="mailto://user:pass@example.com&#10;tgram://bottoken/ChatID" sx={{ mb: 2 }} />
          {testResult && (
            <Alert severity={testResult.ok ? 'success' : 'error'} sx={{ mt: 1 }}>
              {testResult.msg}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none' }}>{content.cancel}</Button>
          <Button type="submit" variant="contained" onClick={handleSubmit} disabled={!formData.name.trim()} sx={{ textTransform: 'none' }}>
            {content.save}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationConfig;
