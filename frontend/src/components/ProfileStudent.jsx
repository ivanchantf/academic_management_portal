// src/components/ProfileStudent.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Paper,
  Chip,
  Avatar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import SchoolIcon from '@mui/icons-material/School';
import LockIcon from '@mui/icons-material/Lock';

export default function ProfileStudent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    Student_ID: '',
    Name: '',
    HKID: '',
    DOB: '',
    Gender: '',
    Department_Name: '',
    Entry_DT: '',
    Email: '',
    Phone_No: '',
    Address: '',
    Emergency_Contact_Person: '',
    Emergency_Phone_No: '',
  });

  // Field Errors State
  const [errors, setErrors] = useState({});

  // Notification Toast State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch Student Profile on Mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/profile/student`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const data = await response.json();
      
      if (data.success && data.profile) {
        const formattedDOB = data.profile.DOB ? data.profile.DOB.split('T')[0] : '';
        
        setFormData({
          Student_ID: data.profile.Student_ID || '',
          Name: data.profile.Name || '',
          HKID: data.profile.HKID || '',
          DOB: formattedDOB,
          Gender: data.profile.Gender || '',
          Department_Name: data.profile.Department_Name || '',
          Entry_DT: data.profile.Entry_DT || '',
          Email: data.profile.Email || '',
          Phone_No: data.profile.Phone_No || '',
          Address: data.profile.Address || '',
          Emergency_Contact_Person: data.profile.Emergency_Contact_Person || '',
          Emergency_Phone_No: data.profile.Emergency_Phone_No || '',
        });
      } else {
        throw new Error('Invalid data structure received');
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      setFetchError(error.message || 'Error loading profile.');
    } finally {
      setLoading(false);
    }
  };

  // Validation Rules
  const validateField = (name, value) => {
    let errorMsg = '';

    switch (name) {
      case 'Name':
        if (!value.trim()) {
          errorMsg = 'Full Name is required.';
        } else if (value.trim().length < 2) {
          errorMsg = 'Name must be at least 2 characters long.';
        }
        break;

      case 'Email':
        if (!value.trim()) {
          errorMsg = 'Email address is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMsg = 'Please enter a valid email address.';
        }
        break;

      case 'HKID':
        if (value.trim() && !/^[A-Z]{1,2}[0-9]{6}\([0-9A]\)$/i.test(value.trim())) {
          errorMsg = 'Invalid HKID format. Example: A123456(7)';
        }
        if(!value.trim()) {
          errorMsg = 'HKID is required.';
        }
        break;

      case 'Phone_No':
      case 'Emergency_Phone_No':
        if (value.trim() && !/^(\+?\d{1,4}[\s-]?)?\d{8,11}$/.test(value.trim())) {
          errorMsg = 'Please enter a valid phone number (e.g. +852 91234567 or 91234567).';
        }
        break;

    case 'DOB':
        if (value) {
          console.log('Validating DOB:', value);
          const datePattern = /^\d{4}-\d{2}-\d{2}$/;

          if (!datePattern.test(value)) {
            errorMsg = 'Date of Birth must be in YYYY-MM-DD format.';
          } else {
            const selectedDate = new Date(value);
            const today = new Date();
            
            if (selectedDate > today) {
              errorMsg = 'Date of Birth cannot be in the future.';
            }
          }
        }
        break;
      default:
        break;
    }

    return errorMsg;
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(formData).forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) {
        newErrors[field] = err;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    const fieldError = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      setSnackbar({
        open: true,
        message: 'Please fix the errors in the form before saving.',
        severity: 'error',
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/profile/student`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const resData = await response.json();

      if (response.ok && resData.success !== false) {
        setSnackbar({
          open: true,
          message: 'Profile updated successfully!',
          severity: 'success',
        });
      } else {
        throw new Error(resData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error updating profile.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchProfile}>
            Retry
          </Button>
        }>
          {fetchError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        {/* Header Profile Summary */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.75rem' }}>
            {formData.Name ? formData.Name.charAt(0) : 'S'}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {formData.Name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
              <Chip
                icon={<SchoolIcon />}
                label={`Student ID: ${formData.Student_ID}`}
                color="primary"
                size="small"
                variant="outlined"
              />
              <Chip label={formData.Department_Name} size="small" color="default" />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Form Start */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Read-Only Academic / System Info Section */}
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon fontSize="small" /> Read-Only Details
          </Typography>

          <Stack spacing={2.5} sx={{ mb: 4 }}>
            <TextField
              fullWidth
              disabled
              label="Student ID"
              name="Student_ID"
              value={formData.Student_ID}
            />

            <TextField
              fullWidth
              disabled
              label="Gender"
              name="Gender"
              value={formData.Gender}
            />

            <TextField
              fullWidth
              type="date"
              label="Date of Birth"
              name="DOB"
              value={formData.DOB}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
               disabled
              error={!!errors.DOB}
              helperText={errors.DOB}
            />
            <TextField
              fullWidth
              disabled
              label="Entry Date/Time"
              name="Entry_DT"
              value={formData.Entry_DT}
            />

            <TextField
              fullWidth
              disabled
              label="Department"
              name="Department_Name"
              value={formData.Department_Name}
            />
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Editable Personal Information Section */}
          <Typography variant="h6" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon fontSize="small" /> Editable Personal & Contact Details
          </Typography>

          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Full Name"
              name="Name"
              value={formData.Name}
              onChange={handleChange}
              required
              error={!!errors.Name}
              helperText={errors.Name}
            />

            <TextField
              fullWidth
              label="HKID"
              name="HKID"
              value={formData.HKID}
              onChange={handleChange}
              placeholder="e.g. A123456(7)"
              required
              error={!!errors.HKID}
              helperText={errors.HKID}
            />



            <TextField
              fullWidth
              type="email"
              label="Email Address"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              required
              error={!!errors.Email}
              helperText={errors.Email}
            />

            <TextField
              fullWidth
              label="Phone Number"
              name="Phone_No"
              value={formData.Phone_No}
              onChange={handleChange}
              placeholder="e.g. +852 91234567"
              
              error={!!errors.Phone_No}
              helperText={errors.Phone_No}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Residential Address"
              name="Address"
              value={formData.Address}
              onChange={handleChange}
              error={!!errors.Address}
              helperText={errors.Address}
            />

            <Divider sx={{ my: 1 }} />

            {/* Emergency Contact Sub-Section */}
            <Typography variant="subtitle1" fontWeight="bold">
              Emergency Contact
            </Typography>

            <TextField
              fullWidth
              label="Contact Person Name"
              name="Emergency_Contact_Person"
              value={formData.Emergency_Contact_Person}
              onChange={handleChange}
              error={!!errors.Emergency_Contact_Person}
              helperText={errors.Emergency_Contact_Person}
            />

            <TextField
              fullWidth
              label="Emergency Phone Number"
              name="Emergency_Phone_No"
              value={formData.Emergency_Phone_No}
              onChange={handleChange}
              placeholder="e.g. +852 9876 5432"
              error={!!errors.Emergency_Phone_No}
              helperText={errors.Emergency_Phone_No}
            />

            {/* Submit Action Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      {/* Snackbar Notification Toast */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}