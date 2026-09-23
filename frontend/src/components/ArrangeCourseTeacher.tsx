import React, { useState, useEffect } from "react";

export interface Course {
  Course_Code: string;
  Name: string;
  Description: string;
  Difficulty: string;
  Credits: number;
  Status: string;
  Created_DT: string;
  Created_Staff_ID: number;
  Updated_DT: string | null;
  Updated_Staff_ID: number | null;
  Offered_DID: number;
}

export interface Account {
  Staff_ID?: number;
  ID?: number;
  Username?: string;
  Name?: string;
  Email?: string;
  Role?: string;
}

export default function ArrangeCourseTeacher() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Account[]>([]);
  
  // Selection States
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  
  // UI Loading/Status States
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [fetchingAssignedTeachers, setFetchingAssignedTeachers] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Initial Load: Fetch Courses and Teachers list
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setInitialLoading(true);
      setError(null);

      try {
        const [coursesRes, accountsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_PATH}/course/list`, {
            method: "GET",
            credentials: "include",
          }),
          fetch(`${import.meta.env.VITE_API_PATH}/auth/list-accounts`, {
            method: "GET",
            credentials: "include",
          }),
        ]);

        if (!coursesRes.ok || !accountsRes.ok) {
          throw new Error("Failed to fetch initial dropdown data.");
        }

        const coursesData = await coursesRes.json();
        const accountsData = await accountsRes.json();

        if (isMounted) {
          // Parse course array
          if (coursesData.success && Array.isArray(coursesData.courses)) {
            setCourses(coursesData.courses);
          } else if (Array.isArray(coursesData)) {
            setCourses(coursesData);
          }

          // Parse teacher accounts
          const accountList: Account[] = accountsData.accounts || accountsData.data || (Array.isArray(accountsData) ? accountsData : []);
          const filteredTeachers = accountList.filter(
            (acc) => !acc.Role || acc.Role.toUpperCase() === "TEACHER" || acc.Role.toUpperCase() === "INSTRUCTOR"
          );
          setTeachers(filteredTeachers.length > 0 ? filteredTeachers : accountList);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Data fetching error:", err);
          setError(err.message || "An unexpected error occurred while loading data.");
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch assigned teachers whenever course selection changes
  useEffect(() => {
    if (!selectedCourseCode) {
      setSelectedTeacherIds([]);
      return;
    }

    let isMounted = true;

    const fetchAssignedTeachers = async () => {
      setFetchingAssignedTeachers(true);
      setError(null);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_PATH}/course/get-teacher/${selectedCourseCode}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch assigned teachers for course ${selectedCourseCode}`);
        }

        const data = await response.json();

        if (isMounted) {
          // Handle response formats: array of numbers [1, 2] or array of objects [{ Staff_ID: 1 }]
          let staffIds: number[] = [];
          
          if (Array.isArray(data)) {
            staffIds = data.map((item) => (typeof item === "object" ? item.Staff_ID ?? item.ID : Number(item)));
          } else if (data.teachers && Array.isArray(data.teachers)) {
            staffIds = data.teachers.map((item: any) => (typeof item === "object" ? item.Staff_ID ?? item.ID : Number(item)));
          } else if (data.Staff_IDs && Array.isArray(data.Staff_IDs)) {
            staffIds = data.Staff_IDs.map((id: any) => Number(id));
          }

          setSelectedTeacherIds(staffIds.filter((id) => !isNaN(id)));
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Fetch assigned teachers error:", err);
          setError(err.message || "Could not retrieve teachers assigned to this course.");
          setSelectedTeacherIds([]);
        }
      } finally {
        if (isMounted) {
          setFetchingAssignedTeachers(false);
        }
      }
    };

    fetchAssignedTeachers();

    return () => {
      isMounted = false;
    };
  }, [selectedCourseCode]);

  // Handle individual checkbox toggle
  const handleTeacherToggle = (teacherId: number) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  // Select / Deselect All
  const handleSelectAll = () => {
    if (selectedTeacherIds.length === teachers.length) {
      setSelectedTeacherIds([]);
    } else {
      const allIds = teachers
        .map((t) => t.Staff_ID ?? t.ID)
        .filter((id): id is number => id !== undefined);
      setSelectedTeacherIds(allIds);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseCode) {
      setError("Please select a course.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/course/assign-teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          courseCode: selectedCourseCode,
          teacherIds: selectedTeacherIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update teacher assignments for the course.");
      }

      setSuccessMsg(`Successfully updated assignments for ${selectedCourseCode}!`);
    } catch (err: any) {
      console.error("Assignment error:", err);
      setError(err.message || "Failed to update teacher assignments.");
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ padding: "1.5rem", textAlign: "center" }}>
        <p>Loading courses and teacher list...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "8px", fontFamily: "sans-serif" }}>
      <h2 style={{ marginTop: 0, marginBottom: "1.5rem", color: "#1e293b" }}>Arrange Course Teachers</h2>

      {error && (
        <div style={{ padding: "0.75rem", marginBottom: "1rem", backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "4px" }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: "0.75rem", marginBottom: "1rem", backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: "4px" }}>
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Course Selection */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="course-select" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#334155" }}>
            Select Course
          </label>
          <select
            id="course-select"
            value={selectedCourseCode}
            onChange={(e) => setSelectedCourseCode(e.target.value)}
            style={{ width: "100%", padding: "0.6rem", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "1rem" }}
            required
          >
            <option value="">-- Choose a Course --</option>
            {courses.map((course) => (
              <option key={course.Course_Code} value={course.Course_Code}>
                [{course.Course_Code}] {course.Name} ({course.Credits} Credits)
              </option>
            ))}
          </select>
        </div>

        {/* Multi-Teacher Checkbox Selection */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: 600, color: "#334155" }}>
              Assigned Teachers {fetchingAssignedTeachers ? "(Fetching...)" : `(${selectedTeacherIds.length} selected)`}
            </label>
            {/* <button
              type="button"
              onClick={handleSelectAll}
              disabled={!selectedCourseCode || fetchingAssignedTeachers}
              style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "0.875rem", textDecoration: "underline" }}
            >
              {selectedTeacherIds.length === teachers.length ? "Deselect All" : "Select All"}
            </button> */}
          </div>

          <div style={{ maxHeight: "220px", overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "0.5rem", backgroundColor: fetchingAssignedTeachers ? "#f1f5f9" : "#f8fafc", opacity: fetchingAssignedTeachers ? 0.6 : 1 }}>
            {teachers.map((teacher:any) => {
              const id = teacher.Staff_ID ?? teacher.ID;
              if (id === undefined) return null;

              const isChecked = selectedTeacherIds.includes(id);
              const displayName = teacher.Name || teacher.Username || `Staff #${id}`;

              return (
                <label
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.4rem 0.5rem",
                    borderRadius: "4px",
                    cursor: fetchingAssignedTeachers ? "wait" : "pointer",
                    backgroundColor: isChecked ? "#e0f2fe" : "transparent",
                    marginBottom: "2px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={!selectedCourseCode || fetchingAssignedTeachers}
                    onChange={() => handleTeacherToggle(id)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                    {displayName} ({teacher?.DepartmentName}) {teacher.Email ? `(${teacher.Email})` : ""}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !selectedCourseCode || fetchingAssignedTeachers}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: submitting || !selectedCourseCode || fetchingAssignedTeachers ? "#94a3b8" : "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Saving..." : `Save Teacher Assignments (${selectedTeacherIds.length})`}
        </button>
      </form>
    </div>
  );
}