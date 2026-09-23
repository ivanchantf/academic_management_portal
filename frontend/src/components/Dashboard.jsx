import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Stack,
  Chip,
  Paper
} from '@mui/material';

// MUI Icons
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ClassIcon from '@mui/icons-material/Class';
import PeopleIcon from '@mui/icons-material/People';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LockResetIcon from '@mui/icons-material/LockReset';
import PersonIcon from '@mui/icons-material/Person';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
export default function Dashboard({ user }) {
  const navigate = useNavigate();

  // Define all available dashboard actions and their target roles
  const dashboardActions = [
    // --- Student Functions ---
    {
      title: 'Enrolled Courses',
      description: 'View your current course schedule, grades, and materials.',
      icon: <ClassIcon sx={{ fontSize: 32 }} />,
      color: '#1976d2',
      path: '/courses',
      roles: ['Student']
    },
    {
      title: 'Submit Assignments',
      description: 'Check deadlines and upload your coursework.',
      icon: <AssignmentIcon sx={{ fontSize: 32 }} />,
      color: '#2e7d32',
      path: '/assignments',
      roles: ['Student']
    },
    {
      title: 'Academic Records',
      description: 'Access your transcripts and GPA summaries.',
      icon: <SchoolIcon sx={{ fontSize: 32 }} />,
      color: '#ed6c02',
      path: '/records',
      roles: ['Student']
    },
     {
      title: 'My Profile',
      description: 'View and update your contact details and preferences.',
      icon: <PersonIcon sx={{ fontSize: 32 }} />,
      color: '#009688',
      path: '/profile-student',
      roles: [ 'Student']
    },

    // --- Staff Functions ---
        {
      title: 'Courses & Programmes Management',
      description: 'Create new courses, new programs, and manage existing ones.',
      icon: <ClassIcon sx={{ fontSize: 32 }} />,
      color: '#009688',
      path: '/courses-programs-management',
      roles: ['Staff']
    },
    {
      title: 'Student Enrollment Management',
      description: 'Manage student enrollments in Major and Minor Programs.',
      icon: <HowToRegIcon sx={{ fontSize: 32 }} />,
      color: '#9c27b0',
      path: '/student-enrollment',
      roles: ['Staff']
    },
    {
      title: 'Create new accounts',
      description: 'Create new user accounts for students and staff.',
      icon: <PersonAddAlt1Icon sx={{ fontSize: 32 }} />,
      color: '#ED6C02',
      path: '/account-creation',
      roles: ['Staff']
    },
        {
      title: 'My Profile',
      description: 'View and update your contact details and preferences.',
      icon: <PersonIcon sx={{ fontSize: 32 }} />,
      color: '#009688',
      path: '/profile-staff',
      roles: [ 'Staff']
    },

    // --- Common Functions (Accessible to All Roles) ---

    {
      title: 'Change Password',
      description: 'Update your account password securely.',
      icon: <LockResetIcon sx={{ fontSize: 32 }} />,
      color: '#d32f2f',
      path: '/password-change',
      roles: ['Student', 'Staff']
    }
  ];

  // Filter actions based on the current user's role
  const allowedActions = dashboardActions.filter((action) =>
    action.roles.includes(user?.UserType)
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 4,
          borderRadius: 3,
          backgroundColor: '#1e293b',
          color: '#ffffff'
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85 }}>
              Welcome back, <strong>{user?.Name || 'User'}</strong>! Please select a function below.
            </Typography>
          </Box>

          <Chip
            label={user?.UserType || 'Guest'}
            color={user?.UserType === 'Staff' ? 'secondary' : 'primary'}
            sx={{ fontWeight: '600', fontSize: '0.9rem', px: 1 }}
          />
        </Stack>
      </Paper>

      {/* Grid of Action Cards */}
      <Grid container spacing={3}>
        {allowedActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                }
              }}
            >
              <CardActionArea
                onClick={() => navigate(action.path)}
                sx={{ height: '100%', p: 1 }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Avatar
                      sx={{
                        bgcolor: `${action.color}15`,
                        color: action.color,
                        width: 56,
                        height: 56
                      }}
                    >
                      {action.icon}
                    </Avatar>

                    <Box>
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" lineHeight={1.5}>
                        {action.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}