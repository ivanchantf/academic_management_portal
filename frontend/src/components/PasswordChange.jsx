import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useEffect } from 'react';
import { checkIdentity } from '../utils/checkIdentity';
import { useNavigate } from 'react-router-dom';
import {logout} from '../utils/logout'

export default function PasswordChange({ user }) {
  // Form State
  const [formData, setFormData] = useState({
    userName:'',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // UI State
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate=useNavigate();

  useEffect(()=>{
    checkIdentity().then(async ()=>{
        const response = await checkIdentity();
      
        if (response?.user) {

          setFormData((prev) => ({ ...prev, userName: response.user.Username }));
        } else {
          navigate('/login');
        }
    })
  },[])

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear alerts on user typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side Validations
    if (!formData.oldPassword) {
      setError('Please enter your current password.');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (formData.newPassword === formData.oldPassword) {
      setError('New password cannot be the same as your current password.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/auth/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Password updated successfully!');
        // Reset form inputs
        setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        alert('Success. You will be redirect to the login Page');
        logout(navigate('/login'));

      } else {
        setError(data.message || 'Failed to update password. Please check your old password.');
      }
    } catch (err) {
      setError('Server connection failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 2, sm: 4 }
      }}
    >
      <Card
        sx={{
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header */}
          <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
            <LockResetIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" component="h1" fontWeight="600" color="textPrimary">
              Change Password
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary" mb={3}>
            Update your password to keep your account secure.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {/* Alert Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              {/* Username (Disabled) */}
              <TextField
                fullWidth
                label="Username"
                value={formData.userName}
                disabled
                variant="outlined"
                helperText="Username cannot be changed"
              />

              {/* Old Password */}
              <TextField
                fullWidth
                required
                name="oldPassword"
                label="Old Password"
                type={showOldPassword ? 'text' : 'password'}
                value={formData.oldPassword}
                onChange={handleChange}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle old password visibility"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        edge="end"
                      >
                        {showOldPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              {/* New Password */}
              <TextField
                fullWidth
                required
                name="newPassword"
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                variant="outlined"
                helperText="Minimum 8 characters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle new password visibility"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              {/* Confirm New Password */}
              <TextField
                fullWidth
                required
                name="confirmPassword"
                label="Re-enter New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                variant="outlined"
                error={
                  formData.confirmPassword !== '' &&
                  formData.newPassword !== formData.confirmPassword
                }
                helperText={
                  formData.confirmPassword !== '' &&
                  formData.newPassword !== formData.confirmPassword
                    ? 'Passwords do not match'
                    : ''
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.2,
                  fontWeight: '600',
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}