import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as TransactionsIcon,
  Category as CategoriesIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  TrendingUp as TrendingUpIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme as useCustomTheme } from '../../context/ThemeContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'temporary' | 'persistent' | 'permanent';
}

const DRAWER_WIDTH = 280;

const navigationItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    color: '#6366f1',
  },
  {
    text: 'Accounts',
    icon: <TransactionsIcon />,
    path: '/accounts',
    color: '#10b981',
  },
  {
    text: 'Transactions',
    icon: <TransactionsIcon />,
    path: '/transactions',
    color: '#8b5cf6',
  },
  {
    text: 'Categories',
    icon: <CategoriesIcon />,
    path: '/categories',
    color: '#f59e0b',
  },
  {
    text: 'Reports',
    icon: <TrendingUpIcon />,
    path: '/reports',
    color: '#9333ea',
  },
];

const bottomItems = [
  {
    text: 'Profile',
    icon: <PersonIcon />,
    path: '/profile',
    color: '#6b7280',
  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    color: '#6b7280',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant = 'temporary' }) => {
  const theme = useTheme();
  const { mode, toggleTheme } = useCustomTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (isMobile) {
      onClose();
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const sidebarContent = (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: mode === 'light' ? '#ffffff' : '#1a1a1a',
        borderRight: `1px solid ${mode === 'light' ? '#e2e8f0' : '#27272a'}`,
      }}
    >
      {/* App Header */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${mode === 'light' ? '#e2e8f0' : '#27272a'}`,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem',
          }}
        >
          FT
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: mode === 'light' ? '#1e293b' : '#ffffff',
              fontSize: '1.1rem',
            }}
          >
            Finance Tracker
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: mode === 'light' ? '#64748b' : '#a1a1aa',
              fontSize: '0.75rem',
            }}
          >
            Gestiona tus finanzas
          </Typography>
        </Box>
      </Box>

      {/* User Profile */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${mode === 'light' ? '#e2e8f0' : '#27272a'}`,
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: '#6366f1',
            fontSize: '0.9rem',
          }}
        >
          {user?.email?.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: mode === 'light' ? '#1e293b' : '#ffffff',
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Hola, {user?.email?.split('@')[0]}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: mode === 'light' ? '#64748b' : '#a1a1aa',
              fontSize: '0.75rem',
            }}
          >
            Bienvenido de vuelta
          </Typography>
        </Box>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, py: 1 }}>
        <List sx={{ px: 1 }}>
          {navigationItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    minHeight: 48,
                    backgroundColor: isActiveRoute(item.path)
                      ? mode === 'light'
                        ? 'rgba(99, 102, 241, 0.1)'
                        : 'rgba(99, 102, 241, 0.2)'
                      : 'transparent',
                    color: isActiveRoute(item.path)
                      ? '#6366f1'
                      : mode === 'light'
                      ? '#64748b'
                      : '#a1a1aa',
                    '&:hover': {
                      backgroundColor: mode === 'light'
                        ? 'rgba(99, 102, 241, 0.05)'
                        : 'rgba(99, 102, 241, 0.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: 'inherit',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: '0.875rem',
                        fontWeight: isActiveRoute(item.path) ? 600 : 500,
                      },
                    }}
                  />
                  {isActiveRoute(item.path) && (
                    <Box
                      sx={{
                        width: 4,
                        height: 20,
                        borderRadius: 2,
                        backgroundColor: '#6366f1',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </motion.div>
          ))}
        </List>

        <Divider sx={{ mx: 2, my: 2 }} />

        {/* Bottom Navigation */}
        <List sx={{ px: 1 }}>
          {bottomItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (navigationItems.length + index) * 0.1 }}
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    minHeight: 48,
                    backgroundColor: isActiveRoute(item.path)
                      ? mode === 'light'
                        ? 'rgba(99, 102, 241, 0.1)'
                        : 'rgba(99, 102, 241, 0.2)'
                      : 'transparent',
                    color: isActiveRoute(item.path)
                      ? '#6366f1'
                      : mode === 'light'
                      ? '#64748b'
                      : '#a1a1aa',
                    '&:hover': {
                      backgroundColor: mode === 'light'
                        ? 'rgba(99, 102, 241, 0.05)'
                        : 'rgba(99, 102, 241, 0.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: 'inherit',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: '0.875rem',
                        fontWeight: isActiveRoute(item.path) ? 600 : 500,
                      },
                    }}
                  />
                  {isActiveRoute(item.path) && (
                    <Box
                      sx={{
                        width: 4,
                        height: 20,
                        borderRadius: 2,
                        backgroundColor: '#6366f1',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </motion.div>
          ))}
        </List>
      </Box>

      {/* Theme Toggle and Logout */}
      <Box sx={{ p: 2, borderTop: `1px solid ${mode === 'light' ? '#e2e8f0' : '#27272a'}` }}>
        {/* Theme Toggle Button */}
        <ListItemButton
          onClick={toggleTheme}
          sx={{
            borderRadius: 2,
            minHeight: 48,
            mb: 1,
            color: mode === 'light' ? '#6b7280' : '#a1a1aa',
            '&:hover': {
              backgroundColor: mode === 'light'
                ? 'rgba(99, 102, 241, 0.05)'
                : 'rgba(99, 102, 241, 0.1)',
              color: '#6366f1',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <ListItemIcon
            sx={{
              color: 'inherit',
              minWidth: 40,
            }}
          >
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </ListItemIcon>
          <ListItemText
            primary={`${mode === 'light' ? 'Dark' : 'Light'} Theme`}
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.875rem',
                fontWeight: 500,
              },
            }}
          />
        </ListItemButton>

        {/* Logout Button */}
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            minHeight: 48,
            color: mode === 'light' ? '#dc2626' : '#ef4444',
            '&:hover': {
              backgroundColor: mode === 'light'
                ? 'rgba(220, 38, 38, 0.05)'
                : 'rgba(239, 68, 68, 0.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <ListItemIcon
            sx={{
              color: 'inherit',
              minWidth: 40,
            }}
          >
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.875rem',
                fontWeight: 500,
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: mode === 'light' 
            ? '2px 0 8px rgba(0, 0, 0, 0.1)' 
            : '2px 0 8px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export { DRAWER_WIDTH };
