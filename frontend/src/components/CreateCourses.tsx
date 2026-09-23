import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  FormHelperText
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';

// Difficulty levels as specified
const DIFFICULTY_LEVELS = ['B1', 'B2', 'B3', 'P4', 'P5', 'P6', 'R7', 'R8', 'R9'];

interface Department {
  Department_ID?: number | string;
  id?: number | string;
  Code?: string;
  Name?: string;
  Title?: string;
  Department_Name?: string;
}

export default function CreateCourses() {
  // --- Form State ---
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [credits, setCredits] = useState<number | string>(3);
  const [offeringDepartment, setOfferingDepartment] = useState('');

  // --- Dropdown Options & Loading States ---
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Feedback Toast State ---
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setDeptLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_PATH}/department/list`, {
          credentials: 'include',
        });
        const data = await res.json();
        
        if (res.ok && (data.success || Array.isArray(data))) {
          setDepartments(data.department );
        } else {
          showToast(data.message || 'Failed to load offering departments.', 'error');
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        showToast('Server error while loading departments.', 'error');
      } finally {
        setDeptLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // --- Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!courseCode.trim() || !courseName.trim() || !difficulty || !offeringDepartment) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    const creditNum = parseInt(String(credits), 10);
    if (isNaN(creditNum) || creditNum <= 0) {
      showToast('Credits must be a positive integer.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_PATH}/course/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseCode: courseCode.trim(),
          name: courseName.trim(),
          description: description.trim(),
          difficulty,
          credits: creditNum,
          offeringDepartment,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Course created successfully!');
        // Reset form
        setCourseCode('');
        setCourseName('');
        setDescription('');
        setDifficulty('');
        setCredits(3);
        setOfferingDepartment('');
      } else {
        showToast(data.message || 'Failed to create course.', 'error');
      }
    } catch (err) {
      console.error('Error creating course:', err);
      showToast('Server error occurred while creating course.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Card sx={{ maxWidth: 650, mx: 'auto', borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
            <AddCircleIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight="600">
              Create New Course
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={4}>
            Enter the details below to register a new course into the catalogue.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Vertical Stack containing all form fields */}
            <Stack spacing={3}>
              {/* 1. Course Code */}
              <TextField
                required
                fullWidth
                label="Course Code"
                placeholder="e.g., CS3342"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
              />

              {/* 2. Course Name */}
              <TextField
                required
                fullWidth
                label="Course Name"
                placeholder="e.g., Software Engineering"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />

              {/* 3. Description (Textarea) */}
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                placeholder="Provide a detailed overview of the course syllabus and outcomes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* 4. Difficulty Dropdown */}
              <FormControl fullWidth required>
                <InputLabel id="difficulty-label">Difficulty</InputLabel>
                <Select
                  labelId="difficulty-label"
                  value={difficulty}
                  label="Difficulty"
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  {DIFFICULTY_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 5. Credits (Integer Input, default 3) */}
              <TextField
                required
                fullWidth
                type="number"
                label="Credits"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                inputProps={{ min: 1, step: 1 }}
              />

              {/* 6. Offering Department Dropdown */}
              <FormControl fullWidth required disabled={deptLoading}>
                <InputLabel id="department-label">Offering Department</InputLabel>
                <Select
                  labelId="department-label"
                  value={offeringDepartment}
                  label="Offering Department"
                  onChange={(e) => setOfferingDepartment(e.target.value)}
                >
                  {departments.length === 0 ? (
                    <MenuItem disabled value="">
                      {deptLoading ? 'Loading departments...' : 'No departments available'}
                    </MenuItem>
                  ) : (
                    departments.map((dept:any) => {
                      const id = dept.DID ;
                      const name = dept.Name ;
                      return (
                        <MenuItem key={id} value={id}>
                          {name}
                        </MenuItem>
                      );
                    })
                  )}
                </Select>
                {deptLoading && <FormHelperText>Fetching departments from server...</FormHelperText>}
              </FormControl>

              {/* 7. Create Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
                sx={{ textTransform: 'none', fontWeight: 600, py: 1.4, mt: 1 }}
              >
                {submitting ? <CircularProgress size={26} color="inherit" /> : 'Create Course'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Global Toast Alert */}
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