import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider
 
} from "@mui/material";

interface Programme {
  Programme_Code: string;
  Title: string;
  Credits_Required: number;
  Status: string;
  DID: number;
  Normative_Duration_Years?: number | null;
  Max_Duration_Years?: number | null;
  Degree_Awarded?: string | null;
  Courses_Coverage: string[];
}

interface Department {
  DID: number;
  Name: string;
}

interface Course {
  Course_ID?: string;
  Course_Code?: string;
  Title?: string;
  Name?: string;
  [key: string]: any;
}

export default function UpdateProgrammes() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [loadingProgrammes, setLoadingProgrammes] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [selectedCode, setSelectedCode] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | ""; message: string }>({
    type: "",
    message: ""
  });

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    creditsRequired: "120",
    status: "ACTIVE",
    offeringDepartment: "",
    normativeDurationYears: "4",
    maxDurationYears: "6",
    degreeAwarded: "",
    coursesCoverage: [] as string[]
  });

  // 1. Fetch Programmes
  useEffect(() => {
    const fetchProgrammes = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_PATH}/programme/all-programmes-with-included-courses`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.success) {
          setProgrammes(data.programme || []);
        } else {
          console.error("Failed to fetch programmes:", data.message);
        }
      } catch (error) {
        console.error("Error fetching programmes:", error);
      } finally {
        setLoadingProgrammes(false);
      }
    };
    fetchProgrammes();
  }, []);

  // 2. Fetch Departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_PATH}/department/list`, {
          credentials: "include"
        });
        const data = await res.json();
        if (data.department) {
          setDepartments(data.department);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepartments();
  }, []);

  // 3. Fetch Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_PATH}/course/list`, {
          credentials: "include"
        });
        const data = await res.json();
        if (data.success) {
          setCourses(data.courses || []);
        } else {
          console.error("Failed to fetch courses:", data.message);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Handle Dropdown Selection of Programme
  const handleSelectProgramme = (event: SelectChangeEvent<string>) => {
    const code = event.target.value;
    setSelectedCode(code);
    setFeedback({ type: "", message: "" });

    const prog = programmes.find((p) => p.Programme_Code === code);
    if (prog) {
      setFormData({
        title: prog.Title || "",
        creditsRequired: String(prog.Credits_Required ?? 120),
        status: prog.Status || "ACTIVE",
        offeringDepartment: prog.DID ? String(prog.DID) : "",
        normativeDurationYears: String(prog.Normative_Duration_Years ?? 4),
        maxDurationYears: String(prog.Max_Duration_Years ?? 6),
        degreeAwarded: prog.Degree_Awarded || "",
        coursesCoverage: prog.Courses_Coverage || []
      });
    }
  };

  // Helper to determine if selected programme is Major or Minor
  const isMajor = () => {
    const prog = programmes.find((p) => p.Programme_Code === selectedCode);
    if (!prog) return false;
    return (
      prog.Normative_Duration_Years !== undefined &&
      prog.Normative_Duration_Years !== null
    );
  };

  // Input Field Change Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Checkbox Handler for Course Selection
  const handleCourseToggle = (courseCode: string) => {
    setFormData((prev) => {
      const exists = prev.coursesCoverage.includes(courseCode);
      if (exists) {
        return {
          ...prev,
          coursesCoverage: prev.coursesCoverage.filter((c) => c !== courseCode)
        };
      } else {
        return {
          ...prev,
          coursesCoverage: [...prev.coursesCoverage, courseCode]
        };
      }
    });
  };

  // Submit Handler with Validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCode) return;

    // Validate Required Base Fields
    if (!formData.title.trim()) {
      setFeedback({ type: "error", message: "Programme Title cannot be empty." });
      return;
    }
    if (formData.creditsRequired === "" || Number(formData.creditsRequired) <= 0) {
      setFeedback({ type: "error", message: "Credits Required must be a valid number greater than 0." });
      return;
    }
    if (!formData.status.trim()) {
      setFeedback({ type: "error", message: "Please select a Status." });
      return;
    }
    if (!formData.offeringDepartment) {
      setFeedback({ type: "error", message: "Please select an Offering Department." });
      return;
    }

    // Validate Major-Specific Fields
    if (isMajor()) {
      if (formData.normativeDurationYears === "" || Number(formData.normativeDurationYears) <= 0) {
        setFeedback({ type: "error", message: "Normative Duration must be greater than 0." });
        return;
      }
      if (formData.maxDurationYears === "" || Number(formData.maxDurationYears) <= 0) {
        setFeedback({ type: "error", message: "Max Duration must be greater than 0." });
        return;
      }
      if (Number(formData.maxDurationYears) < Number(formData.normativeDurationYears)) {
        setFeedback({ type: "error", message: "Max Duration cannot be less than Normative Duration." });
        return;
      }
      if (!formData.degreeAwarded.trim()) {
        setFeedback({ type: "error", message: "Degree Awarded field cannot be empty." });
        return;
      }
    }

    setSubmitting(true);
    setFeedback({ type: "", message: "" });

    const payload: Record<string, any> = {
      code: selectedCode,
      title: formData.title.trim(),
      creditsRequired: Number(formData.creditsRequired),
      status: formData.status,
      offeringDepartment: Number(formData.offeringDepartment),
      coursesCoverage: formData.coursesCoverage
    };

    if (isMajor()) {
      payload.normativeDurationYears = Number(formData.normativeDurationYears);
      payload.maxDurationYears = Number(formData.maxDurationYears);
      payload.degreeAwarded = formData.degreeAwarded.trim();
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/programme/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update programme");
      }

      setFeedback({ type: "success", message: "Programme updated successfully!" });

      // Local state sync
      setProgrammes((prev) =>
        prev.map((p) =>
          p.Programme_Code === selectedCode
            ? {
                ...p,
                Title: formData.title.trim(),
                Credits_Required: Number(formData.creditsRequired),
                Status: formData.status,
                DID: Number(formData.offeringDepartment),
                Normative_Duration_Years: isMajor() ? Number(formData.normativeDurationYears) : p.Normative_Duration_Years,
                Max_Duration_Years: isMajor() ? Number(formData.maxDurationYears) : p.Max_Duration_Years,
                Degree_Awarded: isMajor() ? formData.degreeAwarded.trim() : p.Degree_Awarded,
                Courses_Coverage: formData.coursesCoverage
              }
            : p
        )
      );
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "An error occurred during update" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={3} maxWidth={650} mx="auto">
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
          Update Programme
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Select an existing programme to review and edit its configuration.
        </Typography>

        {feedback.message && (
          <Alert severity={feedback.type || "info"} sx={{ mb: 3 }}>
            {feedback.message}
          </Alert>
        )}

        {/* Programme Selection Dropdown */}
        <FormControl fullWidth sx={{ mb: 3 }} disabled={loadingProgrammes}>
          <InputLabel id="select-programme-label">Select Programme</InputLabel>
          <Select
            labelId="select-programme-label"
            value={selectedCode}
            label="Select Programme"
            onChange={handleSelectProgramme}
          >
            {loadingProgrammes ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Loading programmes...
              </MenuItem>
            ) : (
              programmes.map((p) => (
                <MenuItem key={p.Programme_Code} value={p.Programme_Code}>
                  {p.Programme_Code} - {p.Title}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {/* Form Fields - Rendered when a programme is selected */}
        {selectedCode && (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <Divider />

              {/* Title */}
              <TextField
                fullWidth
                required
                label="Programme Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={!formData.title.trim()}
                helperText={!formData.title.trim() ? "Title is required" : ""}
              />

              {/* Credits Required */}
              <TextField
                fullWidth
                required
                type="number"
                label="Credits Required"
                name="creditsRequired"
                value={formData.creditsRequired}
                onChange={handleInputChange}
                error={!formData.creditsRequired || Number(formData.creditsRequired) <= 0}
                helperText={
                  !formData.creditsRequired || Number(formData.creditsRequired) <= 0
                    ? "Credits required must be greater than 0"
                    : ""
                }
                slotProps={{ htmlInput: { min: 1 } }}
              />

              {/* Status Dropdown */}
              <FormControl fullWidth required error={!formData.status}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleInputChange}
                >
                  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                  <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                </Select>
              </FormControl>

              {/* Offering Department */}
              <FormControl fullWidth required disabled={loadingDepts} error={!formData.offeringDepartment}>
                <InputLabel id="offering-dept-label">Offering Department</InputLabel>
                <Select
                  labelId="offering-dept-label"
                  name="offeringDepartment"
                  value={formData.offeringDepartment}
                  label="Offering Department"
                  onChange={handleInputChange}
                >
                  {loadingDepts ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
                    </MenuItem>
                  ) : (
                    departments.map((dept) => (
                      <MenuItem key={dept.DID} value={String(dept.DID)}>
                        {dept.Name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              {/* Major-Only Fields */}
              {isMajor() && (
                <>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Normative Duration (Years)"
                    name="normativeDurationYears"
                    value={formData.normativeDurationYears}
                    onChange={handleInputChange}
                    error={!formData.normativeDurationYears || Number(formData.normativeDurationYears) <= 0}
                    helperText={
                      !formData.normativeDurationYears || Number(formData.normativeDurationYears) <= 0
                        ? "Normative duration must be at least 1 year"
                        : ""
                    }
                    slotProps={{ htmlInput: { min: 1 } }}
                  />

                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Max Duration (Years)"
                    name="maxDurationYears"
                    value={formData.maxDurationYears}
                    onChange={handleInputChange}
                    error={
                      !formData.maxDurationYears ||
                      Number(formData.maxDurationYears) < Number(formData.normativeDurationYears)
                    }
                    helperText={
                      !formData.maxDurationYears ||
                      Number(formData.maxDurationYears) < Number(formData.normativeDurationYears)
                        ? "Max duration must be equal to or greater than normative duration"
                        : ""
                    }
                    slotProps={{ htmlInput: { min: 1 } }}
                  />

                  <TextField
                    fullWidth
                    required
                    label="Degree Awarded"
                    name="degreeAwarded"
                    value={formData.degreeAwarded}
                    onChange={handleInputChange}
                    error={!formData.degreeAwarded.trim()}
                    helperText={!formData.degreeAwarded.trim() ? "Degree Awarded is required" : ""}
                  />
                </>
              )}

              {/* Courses Coverage Checkboxes */}
              <Box mt={1}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Courses Coverage 
                </Typography>
                {loadingCourses ? (
                  <Box display="flex" alignItems="center" gap={1} py={1}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Loading courses...
                    </Typography>
                  </Box>
                ) : courses.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No courses available.
                  </Typography>
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, maxHeight: 220, overflowY: "auto", borderRadius: 1 }}
                  >
                    <FormGroup>
                      {courses.map((course, idx) => {
                        const code = course.Course_Code || course.Course_ID || `COURSE_${idx}`;
                        const isChecked = formData.coursesCoverage.includes(code);
                        return (
                          <FormControlLabel
                            key={code}
                            control={
                              <Checkbox
                                checked={isChecked}
                                onChange={() => handleCourseToggle(code)}
                              />
                            }
                            label={`${code} ${course.Name || course.Title ? `- ${course.Name || course.Title}` : ""}`}
                          />
                        );
                      })}
                    </FormGroup>
                  </Paper>
                )}
              </Box>

              {/* Update Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
                sx={{ mt: 2 }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : "Update Programme"}
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  );
}