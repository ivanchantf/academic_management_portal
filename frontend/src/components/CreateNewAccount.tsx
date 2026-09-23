import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider
} from "@mui/material";
import ViewAllAccounts from "./ViewAllAccounts";

interface CustomTabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: CustomTabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface Department {
  DID: number;
  Name: string;
}

export default function CreateNewAccount({ user }: { user?: any }) {
  const navigate = useNavigate();

  // Tab State: 0 = Create Account, 1 = View All Accounts
  const [tabIndex, setTabIndex] = useState(0);

  // Departments State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  // Form State
  const [accountType, setAccountType] = useState<string>("Staff");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    hkid: "",
    dob: "",
    address: "",
    gender: "",
    phoneNo: "",
    email: "",
    emergencyPhoneNo: "",
    emergencyContactPerson: "",
    entryDt: "",
    department: "",
    officeAddress: "",
    officeNo: ""
  });

  // Feedback and Loading States
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | ""; message: string }>({
    type: "",
    message: ""
  });



  // Fetch Departments List
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_PATH}/department/list`, {
          credentials: "include"
        });
        const data = await response.json();
        if (data.department) {
          setDepartments(data.department);
        }
      } catch (err) {
        console.error("Error fetching department list:", err);
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setFeedback({ type: "", message: "" });
  };

  const handleAccountTypeChange = (e: SelectChangeEvent<string>) => {
    setAccountType(e.target.value);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    // Client-side Validation: Check required fields
    const requiredFields = [
      "username",
      "password",
      "name",
      "hkid",
      "dob",
      "address",
      "gender",
      "phoneNo",
      "email",
      "emergencyPhoneNo",
      "emergencyContactPerson",
      "entryDt",
      "department"
    ];

    if (accountType === "Staff") {
      requiredFields.push("officeAddress", "officeNo");
    }

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]?.trim()) {
        setFeedback({
          type: "error",
          message: "All fields are required. Please fill in all inputs."
        });
        return;
      }
    }

    setSubmitting(true);

    const payload: Record<string, any> = {
      username: formData.username.trim(),
      password: formData.password,
      userType: accountType === "Staff" ? "Staff" : "Student",
      name: formData.name.trim(),
      hkid: formData.hkid.trim(),
      dob: formData.dob,
      address: formData.address.trim(),
      gender: formData.gender,
      phoneNo: formData.phoneNo.trim(),
      email: formData.email.trim(),
      emergencyPhoneNo: formData.emergencyPhoneNo.trim(),
      emergencyContactPerson: formData.emergencyContactPerson.trim(),
      entryDt: formData.entryDt,
      department: formData.department
    };

    if (accountType === "Staff") {
      payload.officeAddress = formData.officeAddress.trim();
      payload.officeNo = formData.officeNo.trim();
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/auth/create-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create account.");
      }

      setFeedback({
        type: "success",
        message: `${accountType} account created successfully!`
      });

      // Reset form on success
      setFormData({
        username: "",
        password: "",
        name: "",
        hkid: "",
        dob: "",
        address: "",
        gender: "",
        phoneNo: "",
        email: "",
        emergencyPhoneNo: "",
        emergencyContactPerson: "",
        entryDt: "",
        department: "",
        officeAddress: "",
        officeNo: ""
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "An error occurred while creating the account."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={3} maxWidth={650} mx="auto">
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
          Account Management
        </Typography>

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Account Management Tabs">
            <Tab label="Create Account" id="account-tab-0" />
            <Tab label="View All Accounts" id="account-tab-1" />
          </Tabs>
        </Box>

        {/* Tab 1: Create Account */}
        <CustomTabPanel value={tabIndex} index={0}>
          {feedback.message && (
            <Alert severity={feedback.type || "info"} sx={{ mb: 3 }}>
              {feedback.message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              {/* Account Type Selection */}
              <FormControl fullWidth required>
                <InputLabel id="account-type-label">Type of Account</InputLabel>
                <Select
                  labelId="account-type-label"
                  id="accountType"
                  value={accountType}
                  label="Type of Account"
                  onChange={handleAccountTypeChange}
                >
                  <MenuItem value="Staff">Staff Account</MenuItem>
                  <MenuItem value="Student">Student Account</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 1 }} />

              {/* Login Credentials */}
              <Typography variant="subtitle1" fontWeight="bold">
                Account Credentials
              </Typography>
              <TextField
                fullWidth
                required
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                required
                type="password"
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
              />

              <Divider sx={{ my: 1 }} />

              {/* Personal Information */}
              <Typography variant="subtitle1" fontWeight="bold">
                Personal Details
              </Typography>
              <TextField
                fullWidth
                required
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                required
                label="HKID"
                name="hkid"
                value={formData.hkid}
                onChange={handleInputChange}
                placeholder="e.g. A123456(7)"
              />
              <TextField
                fullWidth
                required
                type="date"
                label="Date of Birth (DOB)"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <FormControl fullWidth required>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  name="gender"
                  value={formData.gender}
                  label="Gender"
                  onChange={handleInputChange}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 1 }} />

              {/* Contact Information */}
              <Typography variant="subtitle1" fontWeight="bold">
                Contact & Emergency Information
              </Typography>
              <TextField
                fullWidth
                required
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
              <TextField
                fullWidth
                required
                label="Phone Number"
                name="phoneNo"
                value={formData.phoneNo}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                required
                type="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                required
                label="Emergency Contact Person"
                name="emergencyContactPerson"
                value={formData.emergencyContactPerson}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                required
                label="Emergency Phone Number"
                name="emergencyPhoneNo"
                value={formData.emergencyPhoneNo}
                onChange={handleInputChange}
              />

              <Divider sx={{ my: 1 }} />

              {/* Academic/Department Details */}
              <Typography variant="subtitle1" fontWeight="bold">
                Affiliation & Dates
              </Typography>
              <TextField
                fullWidth
                required
                type="date"
                label="Entry Date (Entry_DT)"
                name="entryDt"
                value={formData.entryDt}
                onChange={handleInputChange}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <FormControl fullWidth required disabled={loadingDepts}>
                <InputLabel id="department-label">Department</InputLabel>
                <Select
                  labelId="department-label"
                  name="department"
                  value={formData.department}
                  label="Department"
                  onChange={handleInputChange}
                >
                  {loadingDepts ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} /> Loading departments...
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

              {/* Staff Extra Fields */}
              {accountType === "Staff" && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold" color="secondary">
                    Staff Office Details
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    label="Office Address"
                    name="officeAddress"
                    value={formData.officeAddress}
                    onChange={handleInputChange}
                  />
                  <TextField
                    fullWidth
                    required
                    label="Office Room Number"
                    name="officeNo"
                    value={formData.officeNo}
                    onChange={handleInputChange}
                  />
                </>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
                sx={{ mt: 2 }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
              </Button>
            </Stack>
          </Box>
        </CustomTabPanel>

        {/* Tab 2: View All Accounts */}
        <CustomTabPanel value={tabIndex} index={1}>
              <ViewAllAccounts/>
        </CustomTabPanel>
      </Paper>
    </Box>
  );
}