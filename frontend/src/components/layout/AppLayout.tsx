import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { useTheme as useCustomTheme } from '../../context/ThemeContext';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title = 'Dashboard' }) => {
  const theme = useTheme();
  const { mode } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: mode === 'light' ? '#ffffff' : '#1a1a1a',
            color: mode === 'light' ? '#1e293b' : '#ffffff',
            boxShadow: mode === 'light' 
              ? '0 1px 3px rgba(0, 0, 0, 0.1)' 
              : '0 1px 3px rgba(0, 0, 0, 0.3)',
            borderBottom: `1px solid ${mode === 'light' ? '#e2e8f0' : '#27272a'}`,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="toggle sidebar"
              edge="start"
              onClick={handleSidebarToggle}
              sx={{ mr: 2 }}
            >
              {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                mr: 2,
              }}
            >
              FT
            </Box>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {title}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        variant={isMobile ? 'temporary' : 'persistent'}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: isMobile ? 0 : sidebarOpen ? 0 : `-${DRAWER_WIDTH}px`,
          marginTop: isMobile ? '64px' : 0,
          minHeight: '100vh',
          backgroundColor: mode === 'light' ? '#f8fafc' : '#0f0f0f',
          position: 'relative',
        }}
      >


        {/* Page Content */}
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
