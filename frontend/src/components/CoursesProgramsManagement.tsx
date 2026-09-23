import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import AddBookIcon from '@mui/icons-material/MenuBook';
import EditBookIcon from '@mui/icons-material/AutoStories';
import AddSchoolIcon from '@mui/icons-material/School';
import EditSchoolIcon from '@mui/icons-material/HistoryEdu';
import CreateCourses from './CreateCourses';
import UpdateCourses from './UpdateCourses';
import CreateProgrammes from './CreateProgammes';
import UpdateProgrammes from './UpdateProgrammes';

// Placeholder Sub-Components (Replace or import from their respective files)







interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Custom TabPanel wrapper for clean accessibility & rendering
function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`course-program-tabpanel-${index}`}
      aria-labelledby={`course-program-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CoursesProgramsManagement({ user }: { user: any }) {
  const [tabIndex, setTabIndex] = useState<number>(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: 'primary.main',
          color: '#fff',
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight="700">
          Courses & Programs Management
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          Create and update course catalogues and degree programmes.
        </Typography>
      </Paper>

      {/* Tabs Bar */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Courses and Programs Management Tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 56,
              },
            }}
          >
            <Tab icon={<AddBookIcon />} iconPosition="start" label="Create Courses" />
            <Tab icon={<EditBookIcon />} iconPosition="start" label="Update Courses" />
            <Tab icon={<AddSchoolIcon />} iconPosition="start" label="Create Programmes" />
            <Tab icon={<EditSchoolIcon />} iconPosition="start" label="Update Programmes" />
          </Tabs>
        </Box>

        {/* Tab Content Panels */}
        <CustomTabPanel value={tabIndex} index={0}>
          <CreateCourses />
        </CustomTabPanel>

        <CustomTabPanel value={tabIndex} index={1}>
          <UpdateCourses />
        </CustomTabPanel>

        <CustomTabPanel value={tabIndex} index={2}>
          <CreateProgrammes />
        </CustomTabPanel>

        <CustomTabPanel value={tabIndex} index={3}>
          <UpdateProgrammes />
        </CustomTabPanel>
      </Paper>
    </Box>
  );
}