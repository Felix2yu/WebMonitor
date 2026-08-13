import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  CssBaseline,
  Avatar,
  Tooltip,
  Chip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as TaskIcon,
  History as LogIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  NotificationsActive as NotificationsIcon,
  Notifications as NotifyIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { isChineseLanguage } from '../utils/i18n';

const drawerWidth = 232;

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const faviconSrc = '/favicon.svg';

  const isChinese = isChineseLanguage(i18n.language);

  const baseMenuItems = useMemo(() => ([
    {
      text: isChinese ? '仪表板' : 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      description: isChinese ? '监控概览' : 'Monitoring overview',
    },
    {
      text: isChinese ? '监控任务' : 'Monitor tasks',
      icon: <TaskIcon />,
      path: '/tasks',
      description: isChinese ? '管理任务' : 'Manage tasks',
    },

    {
      text: isChinese ? '监控日志' : 'Monitor logs',
      icon: <LogIcon />,
      path: '/logs',
      description: isChinese ? '查看日志' : 'View logs',
    },
    {
      text: isChinese ? '通知配置' : 'Notifications',
      icon: <NotifyIcon />,
      path: '/notification-config',
      description: isChinese ? '通知设置' : 'Notification settings',
    },
  ]), [isChinese]);

  const dynamicMenuItems = useMemo(() => {
    if (!isAdmin()) {
      return baseMenuItems;
    }

    return [
      ...baseMenuItems,
      {
        text: isChinese ? '黑名单管理' : 'Blacklist management',
        icon: <SecurityIcon />,
        path: '/blacklist-management',
        description: isChinese ? '域名黑名单' : 'Blocked domains',
      },
      {
        text: isChinese ? '用户管理' : 'User management',
        icon: <PeopleIcon />,
        path: '/user-management',
        description: isChinese ? '用户管理' : 'Manage users',
      },
    ];
  }, [baseMenuItems, isAdmin, isChinese]);

  const currentMenuItem =
    dynamicMenuItems.find((item) => item.path === location.pathname) ||
    (location.pathname === '/settings'
      ? {
          text: t('settings.title') || (isChinese ? '设置' : 'Settings'),
          description: isChinese ? '偏好与账户' : 'Preferences & account',
        }
      : null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            component="img"
            src={faviconSrc}
            alt="WebMonitor"
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              display: 'block',
              objectFit: 'contain',
            }}
          />
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                color: 'text.primary',
              }}
            >
              WebMonitor
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isChinese ? '网页监控系统' : 'Web monitoring platform'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, py: 2 }}>
        <List sx={{ p: 0 }}>
          {dynamicMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleMenuItemClick(item.path)}
                  sx={{
                    borderRadius: 1.5,
                    px: 2,
                    py: 1.5,
                    minHeight: 'auto',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateX(4px)',
                    },
                    '&.Mui-selected': {
                      background: 'action.selected',
                      borderLeft: '3px solid #10b981',
                      '&:hover': {
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        transform: 'translateX(0)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'text.primary',
                        fontWeight: 600,
                      },
                      '& .MuiListItemText-secondary': {
                        color: 'rgba(16, 185, 129, 0.8)',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 34,
                      color: isActive ? 'primary.main' : 'text.secondary',
                      '& svg': {
                        fontSize: 22,
                      },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    secondary={item.description}
                    primaryTypographyProps={{
                      fontSize: '0.95rem',
                      fontWeight: isActive ? 600 : 500,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.72rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
          <ListItem disablePadding sx={{ px: 1.5, mt: 1.5 }}>
            <ListItemButton
              onClick={() => handleMenuItemClick('/settings')}
              sx={{
                borderRadius: 1.5,
                px: 2,
                py: 1.5,
                minHeight: 'auto',
                opacity: 0.85,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: 'text.secondary', '& svg': { fontSize: 22 } }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText
                primary={t('settings.title') || (isChinese ? '设置' : 'Settings')}
                secondary={isChinese ? '偏好与账户' : 'Preferences & account'}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                }}
                secondaryTypographyProps={{ fontSize: '0.72rem' }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 2, backgroundColor: 'action.hover' }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              background: 'linear-gradient(45deg, #2563eb 30%, #1d4ed8 90%)',
              fontSize: '1rem',
              flexShrink: 0,
            }}
          >
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.username || t('common.user')}
              </Typography>
              {isAdmin() && (
                <Chip
                  size="small"
                  label={t('common.admin')}
                  sx={{
                    backgroundColor: 'action.selected',
                    color: 'primary.main',
                    fontWeight: 'bold',
                    fontSize: '0.65rem',
                    height: 18,
                    flexShrink: 0,
                  }}
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || ''}
            </Typography>
          </Box>
          <Tooltip title={t('common.logout')}>
            <IconButton
              size="small"
              onClick={handleLogout}
              sx={{ ml: 1, color: 'text.secondary', flexShrink: 0, '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'error.main' } }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid', borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: 'primary.main' }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  {currentMenuItem?.text || 'WebMonitor'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {currentMenuItem?.description || ''}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={t('common.notifications')}>
              <IconButton
                sx={{
                  color: 'text.secondary',
                  '&:hover': { backgroundColor: 'action.hover', color: 'primary.main' },
                }}
              >
                <Badge badgeContent={0} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid', borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid', borderColor: 'divider',
              backgroundColor: 'background.paper',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          backgroundColor: 'background.default',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;
