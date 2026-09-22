import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Paper,
  Chip
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';

export default function Department({ user }) {
  const { did } = useParams();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDepartmentData = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${import.meta.env.VITE_API_PATH}/department/${did}`, {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setDepartment(data.department);
        } else {
          setError(data.message || 'Failed to load department details.');
        }
      } catch (err) {
        console.error('Error fetching department data:', err);
        setError('Server connection failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (did) {
      fetchDepartmentData();
    }
  }, [did]);

  // Construct image URL (adjust base URL if serving static files from backend)
  const imageUrl = department?.Photo_Path
    ? `${import.meta.env.VITE_API_PATH}/uploads/${department.Photo_Path}`
    : null;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} maxWidth={600} mx="auto">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 3 } }}>

      {/* Department Card */}
      {department && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          {/* Department Banner Photo */}
          {imageUrl && (
            <CardMedia
              component="img"
              height="260"
              image={imageUrl}
              alt={department.Name}
              sx={{ objectFit: 'cover' }}
            />
          )}

          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            {/* Header / DID Tag */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h4" component="h1" fontWeight="700" sx={{ color: 'grey.900' }}>
                {department.Name}
              </Typography>
              <Chip label={`DID: ${department.DID}`} color="primary" variant="outlined" />
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            {/* Department Details */}
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <LocationOnIcon color="action" />
                <Typography variant="body1" color="text.secondary">
                  <strong>Address:</strong> {department.Address}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <PhoneIcon color="action" />
                <Typography variant="body1" color="text.secondary">
                  <strong>Phone:</strong> {department.Phone_No}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}