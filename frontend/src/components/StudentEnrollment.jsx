import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Paper
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

export default function StudentEnrollment({ user }) {
  // --- Major State ---
  const [studentsNoMajor, setStudentsNoMajor] = useState([]);
  const [majors, setMajors] = useState([]);
  const [selectedMajorStudent, setSelectedMajorStudent] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [majorLoading, setMajorLoading] = useState(false);

  // --- Minor State ---
  const [studentsNoMinor, setStudentsNoMinor] = useState([]);
  const [minors, setMinors] = useState([]);
  const [selectedMinorStudent, setSelectedMinorStudent] = useState('');
  const [selectedMinor, setSelectedMinor] = useState('');
  const [minorLoading, setMinorLoading] = useState(false);

  // --- Global Loading & Notification State ---
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  // 1. Fetch initial dropdown data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      setPageLoading(true);
      try {
        await Promise.all([
          fetchStudentsNoMajor(),
          fetchMajors(),
          fetchStudentsNoMinor(),
          fetchMinors()
        ]);
      } catch (err) {
        console.error('Error loading enrollment data:', err);
        showToast('Failed to load dropdown options from server.', 'error');
      } finally {
        setPageLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // --- API Fetchers ---
  const fetchStudentsNoMajor = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_PATH}/enrollment/student-not-enroll-major`, {
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) setStudentsNoMajor(data.students || []);
  };

  const fetchMajors = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_PATH}/programme/all-major-programmes`, {
      credentials: 'include'
    });
    const data = await res.json();
    console.log('Majors fetched:', data); // Debugging log
    if (data.success) setMajors(data.programme  || []);
  };

  const fetchStudentsNoMinor = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_PATH}/enrollment/student-not-enroll-minor`, {
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) setStudentsNoMinor(data.students || []);
  };

  const fetchMinors = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_PATH}/programme/all-minor-programmes`, {
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) setMinors(data.programme || []);
  };

  // --- Assign Major Handler ---
  const handleAssignMajor = async () => {
    if (!selectedMajorStudent || !selectedMajor) {
      showToast('Please select both a student and a major programme.', 'warning');
      return;
    }

    setMajorLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_PATH}/enrollment/assign-major`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedMajorStudent,
          majorId: selectedMajor
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Major assigned successfully!');
        setSelectedMajorStudent('');
        setSelectedMajor('');
        // Refresh the student list without major
        fetchStudentsNoMajor();
      } else {
        showToast(data.message || 'Failed to assign major.', 'error');
      }
    } catch (err) {
      showToast('Server error while assigning major.', 'error');
    } finally {
      setMajorLoading(false);
    }
  };

  // --- Assign Minor Handler ---
  const handleAssignMinor = async () => {
    if (!selectedMinorStudent || !selectedMinor) {
      showToast('Please select both a student and a minor programme.', 'warning');
      return;
    }

    setMinorLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_PATH}/enrollment/assign-minor`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedMinorStudent,
          minorId: selectedMinor
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Minor assigned successfully!');
        setSelectedMinorStudent('');
        setSelectedMinor('');
        // Refresh the student list without minor
        fetchStudentsNoMinor();
      } else {
        showToast(data.message || 'Failed to assign minor.', 'error');
      }
    } catch (err) {
      showToast('Server error while assigning minor.', 'error');
    } finally {
      setMinorLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Header Banner */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'primary.main', color: '#fff', borderRadius: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <AssignmentIndIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h5" fontWeight="700">
              Programme Enrollment Management
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Assign Major and Minor programmes to unenrolled students.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={4}>
        {/* ================= SECTION 1: MAJOR ENROLLMENT ================= */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <SchoolIcon color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Assign Major Programme
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Select a student currently missing a major and assign them to a programme.
              </Typography>

              <Stack spacing={3}>
                {/* Unenrolled Student Dropdown */}
                <FormControl fullWidth>
                  <InputLabel id="major-student-label">Student (No Major)</InputLabel>
                  <Select
                    labelId="major-student-label"
                    value={selectedMajorStudent}
                    label="Student (No Major)"
                    onChange={(e) => setSelectedMajorStudent(e.target.value)}
                  >
                    {studentsNoMajor.length === 0 ? (
                      <MenuItem disabled value="">
                        No students requiring major assignment
                      </MenuItem>
                    ) : (
                      studentsNoMajor.map((std) => (
                        <MenuItem key={std.Student_ID} value={std.Student_ID}>
                          {std.Name} [SID: {std.Student_ID}]
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                {/* Major Programme Dropdown */}
                <FormControl fullWidth>
                  <InputLabel id="major-program-label">Select Major Programme</InputLabel>
                  <Select
                    labelId="major-program-label"
                    value={selectedMajor}
                    label="Select Major Programme"
                    onChange={(e) => setSelectedMajor(e.target.value)}
                  >
                    {majors.map((m) => (
                      <MenuItem key={m.Programme_Code} value={m.Programme_Code}>
                        [{m.Programme_Code }] { m.Title }
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Submit Button */}
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAssignMajor}
                  disabled={majorLoading || !selectedMajorStudent || !selectedMajor}
                  sx={{ textTransform: 'none', fontWeight: '600', py: 1.2 }}
                >
                  {majorLoading ? <CircularProgress size={24} color="inherit" /> : 'Assign Major'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ================= SECTION 2: MINOR ENROLLMENT ================= */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <SchoolIcon color="secondary" />
                <Typography variant="h6" fontWeight="600">
                  Assign Minor Programme
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Select a student currently missing a minor and assign them to a programme.
              </Typography>

              <Stack spacing={3}>
                {/* Unenrolled Student Dropdown */}
                <FormControl fullWidth color="secondary">
                  <InputLabel id="minor-student-label">Student (No Minor)</InputLabel>
                  <Select
                    labelId="minor-student-label"
                    value={selectedMinorStudent}
                    label="Student (No Minor)"
                    onChange={(e) => setSelectedMinorStudent(e.target.value)}
                  >
                    {studentsNoMinor.length === 0 ? (
                      <MenuItem disabled value="">
                        No students requiring minor assignment
                      </MenuItem>
                    ) : (
                      studentsNoMinor.map((std) => (
                        <MenuItem key={std.Student_ID} value={std.Student_ID}>
                          {std.Name} [SID: {std.Student_ID}]
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                {/* Minor Programme Dropdown */}
                <FormControl fullWidth color="secondary">
                  <InputLabel id="minor-program-label">Select Minor Programme</InputLabel>
                  <Select
                    labelId="minor-program-label"
                    value={selectedMinor}
                    label="Select Minor Programme"
                    onChange={(e) => setSelectedMinor(e.target.value)}
                  >
                       {minors.map((m) => (
                      <MenuItem key={m.Programme_Code} value={m.Programme_Code}>
                        [{m.Programme_Code }] { m.Title }
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Submit Button */}
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={handleAssignMinor}
                  disabled={minorLoading || !selectedMinorStudent || !selectedMinor}
                  sx={{ textTransform: 'none', fontWeight: '600', py: 1.2 }}
                >
                  {minorLoading ? <CircularProgress size={24} color="inherit" /> : 'Assign Minor'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Global Toast Alerts */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}