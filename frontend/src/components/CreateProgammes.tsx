import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Stack
} from "@mui/material";

export default function CreateProgrammes() {
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    creditRequire: 120,
    offeringDepartment: "",
    programmeType: "Major", // Default to Major
    normativeDurationYears: 4,
    maxDurationYears: 6,
    degreeAwarded: "",
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [deptError, setDeptError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Fetch departments list on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_PATH}/department/list`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to load departments list");
        }
        const data = await response.json();

        setDepartments(data.department || []);
      } catch (err: any) {
        setDeptError(err.message || "Error fetching department list");
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "programmeType") {
        if (value === "Minor") {
          updated.creditRequire = 12;
        } else if (value === "Major") {
          updated.creditRequire = 120;
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    // --- Empty Check Validation ---
    if (!formData.code.trim()) {
      setFeedback({ type: "error", message: "Programme Code is required." });
      return;
    }
    if (!formData.title.trim()) {
      setFeedback({ type: "error", message: "Programme Title is required." });
      return;
    }
    if (formData.creditRequire === "" || formData.creditRequire === null || Number(formData.creditRequire) <= 0) {
      setFeedback({ type: "error", message: "Valid Credit Required value is required." });
      return;
    }
    if (!formData.offeringDepartment) {
      setFeedback({ type: "error", message: "Offering Department is required." });
      return;
    }

    if (formData.programmeType === "Major") {
      if (
        formData.normativeDurationYears === "" ||
        formData.normativeDurationYears === null ||
        Number(formData.normativeDurationYears) <= 0
      ) {
        setFeedback({ type: "error", message: "Valid Normative Duration is required." });
        return;
      }
      if (
        formData.maxDurationYears === "" ||
        formData.maxDurationYears === null ||
        Number(formData.maxDurationYears) <= 0
      ) {
        setFeedback({ type: "error", message: "Valid Max Duration is required." });
        return;
      }
      if (!formData.degreeAwarded.trim()) {
        setFeedback({ type: "error", message: "Degree Awarded name is required." });
        return;
      }
    }
    // -------------------------------

    setSubmitting(true);

    // Prepare payload based on whether it's Major or Minor
    const payload: Record<string, any> = {
      code: formData.code.trim(),
      title: formData.title.trim(),
      creditRequire: Number(formData.creditRequire),
      offeringDepartment: formData.offeringDepartment,
      programmeType: formData.programmeType,
    };

    if (formData.programmeType === "Major") {
      payload.normativeDurationYears = Number(formData.normativeDurationYears);
      payload.maxDurationYears = Number(formData.maxDurationYears);
      payload.degreeAwarded = formData.degreeAwarded.trim();
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_PATH}/programme/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create programme");
      }

      let data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Programme creation failed");
      } else {
        setFeedback({
          type: "success",
          message: "Programme created successfully!",
        });
      }

      // Reset form to defaults
      setFormData({
        code: "",
        title: "",
        creditRequire: 120,
        offeringDepartment: "",
        programmeType: "Major",
        normativeDurationYears: 4,
        maxDurationYears: 6,
        degreeAwarded: "",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "An error occurred during creation",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={3} maxWidth={550} mx="auto">
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
          Create New Programme
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Enter the programme details below to register a new academic programme.
        </Typography>

        {feedback.message && (
          <Alert severity={feedback.type as "success" | "error"} sx={{ mb: 3 }}>
            {feedback.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            {/* Programme Type Dropdown */}
            <FormControl fullWidth required>
              <InputLabel id="programme-type-label">Programme Type</InputLabel>
              <Select
                labelId="programme-type-label"
                id="programmeType"
                name="programmeType"
                value={formData.programmeType}
                label="Programme Type"
                onChange={handleChange}
              >
                <MenuItem value="Major">Major</MenuItem>
                <MenuItem value="Minor">Minor</MenuItem>
              </Select>
            </FormControl>

            {/* Programme Code Input */}
            <TextField
              fullWidth
              required
              label="Programme Code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g. BSCS"
            />

            {/* Title Input */}
            <TextField
              fullWidth
              required
              label="Programme Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Bachelor of Science in Computer Science"
            />

            {/* Credit Require (Number Input) */}
            <TextField
              fullWidth
              required
              type="number"
              label="Credit Required"
              name="creditRequire"
              value={formData.creditRequire}
              onChange={handleChange}
              slotProps={{ htmlInput: { min: 0 } }}
            />

            {/* Offering Department Dropdown */}
            <FormControl fullWidth required error={Boolean(deptError)}>
              <InputLabel id="offering-department-label">
                Offering Department
              </InputLabel>
              <Select
                labelId="offering-department-label"
                id="offeringDepartment"
                name="offeringDepartment"
                value={formData.offeringDepartment}
                label="Offering Department"
                onChange={handleChange}
                disabled={loadingDepts}
              >
                {loadingDepts ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} /> Loading departments...
                  </MenuItem>
                ) : deptError ? (
                  <MenuItem disabled>{deptError}</MenuItem>
                ) : (
                  departments.map((dept: any) => (
                    <MenuItem key={dept.DID} value={dept.DID}>
                      {dept.Name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Conditional Fields for Major */}
            {formData.programmeType === "Major" && (
              <>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Normative Duration (Years)"
                  name="normativeDurationYears"
                  value={formData.normativeDurationYears}
                  onChange={handleChange}
                  slotProps={{ htmlInput: { min: 1 } }}
                />

                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Max Duration (Years)"
                  name="maxDurationYears"
                  value={formData.maxDurationYears}
                  onChange={handleChange}
                  slotProps={{ htmlInput: { min: 1 } }}
                />

                <TextField
                  fullWidth
                  required
                  label="Name of Degree Awarded"
                  name="degreeAwarded"
                  value={formData.degreeAwarded}
                  onChange={handleChange}
                  placeholder="e.g. Bachelor of Science"
                />
              </>
            )}

            {/* Create Button at Bottom */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={submitting || loadingDepts}
              sx={{ mt: 1 }}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Create Programme"
              )}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}