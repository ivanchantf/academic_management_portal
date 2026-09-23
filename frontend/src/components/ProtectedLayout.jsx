// src/components/ProtectedLayout.jsx
import React, { useState } from 'react';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Avatar,
  Chip,
  Popper,
  Paper,
  MenuList,
  MenuItem,
  ListItemIcon,
  Divider,
  ClickAwayListener,
} from '@mui/material';
import loginBg from '../assets/login-bg.jpg'; 
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import BadgeIcon from '@mui/icons-material/Badge';
import LockReset from '@mui/icons-material/LockReset'
import DomainIcon from '@mui/icons-material/Domain';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useAuth } from '../context/AuthContext';
import {logout} from '../utils/logout'


export default function ProtectedLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const handleMouseEnter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    logout(navigate('/login'))
  };

  return (
<Box
  sx={{
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100vw',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${loginBg})`,
      backgroundSize: '100% 100%', // Fits the exact container dimensions without zooming
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      filter: 'blur(28px)',
      zIndex: 0,
    },
    '& > *': {
      position: 'relative',
      zIndex: 1,
    },
  }}
>

      <AppBar position="sticky" elevation={2} sx={{ bgcolor: '#1e293b' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          
          {/* Logo & Navigation Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/dashboard"
              sx={{ fontWeight: 700, letterSpacing: 1.2, color: 'white', textDecoration: 'none' }}
            >
              AMP
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                component={RouterLink}
                to="/dashboard"
                startIcon={<DashboardIcon />}
                sx={{ color: '#e2e8f0', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
              >
                Home
              </Button>

              {/* {user?.UserType === 'Staff' && (
                <Button
                  component={RouterLink}
                  to="/abc"
                  startIcon={<BadgeIcon />}
                  sx={{ color: '#e2e8f0', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
                >
                  Staff Only
                </Button>
              )}

              {user?.UserType === 'Student' && (
                <Button
                  component={RouterLink}
                  to="/def"
                  startIcon={<SchoolIcon />}
                  sx={{ color: '#e2e8f0', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
                >
                  Student Only
                </Button>
              )} */}
            </Box>
          </Box>

          {/* User Profile Hover Dropdown Container */}
          <Box
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{ position: 'relative' }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                p: 0.75,
                borderRadius: 1,
                transition: 'background-color 0.2s',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                }}
              >
                {user?.Name ? user.Name.charAt(0).toUpperCase() : 'U'}
              </Avatar>

              <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                {user?.Name || 'User'}
              </Typography>

              {user?.UserType && (
                <Chip
                  label={user.UserType}
                  size="small"
                  color={user.UserType === 'Staff' ? 'secondary' : 'info'}
                  sx={{ height: 20, fontSize: '0.6875rem' }}
                />
              )}

              <KeyboardArrowDownIcon sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
            </Box>

            {/* Non-modal Popper Dropdown */}
            <Popper
              open={open}
              anchorEl={anchorEl}
              placement="bottom-end"
              style={{ zIndex: 1300 }}
            >
              <Paper
                elevation={4}
                sx={{
                  mt: 0.5,
                  minWidth: 160,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                }}
              >
                <ClickAwayListener onClickAway={handleMouseLeave}>
                  <MenuList autoFocus={false}>
                    <MenuItem
                      onClick={() => {
                        setAnchorEl(null);
                        if(user?.UserType === 'Staff') {
                           navigate('/profile-staff');
                        } else if(user?.UserType === 'Student') {
                           navigate('/profile-student');
                        }
                       
                      }}
                    >
                      <ListItemIcon>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      Profile
                    </MenuItem>

                    <Divider sx={{ my: 0.5 }} />
                  <MenuItem
                      onClick={() => {
                        setAnchorEl(null);
                         navigate('/department/' + user?.DID);
                       
                      }}
                    >
                      <ListItemIcon>
                        <DomainIcon fontSize="small" />
                      </ListItemIcon>
                      My Department
                    </MenuItem>

     
                    <Divider sx={{ my: 0.5 }} />
                               <MenuItem
                      onClick={() => {
                        setAnchorEl(null);
                         navigate('/password-change');
                       
                      }}
                    >
                      <ListItemIcon>
                        <LockReset fontSize="small" />
                      </ListItemIcon>
                      Change Password
                    </MenuItem>


                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                      <ListItemIcon sx={{ color: 'error.main' }}>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      Logout
                    </MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Popper>
          </Box>

        </Toolbar>
      </AppBar>

      {/* Main Page Content */}
      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}