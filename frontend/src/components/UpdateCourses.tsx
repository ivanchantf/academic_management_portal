import { useEffect, useState, FormEvent, ChangeEvent } from "react";

interface Course {
  Course_Code: string;
  Name: string;
  Description: string;
  Difficulty: string;
  Credits: number;
  Status: string;
  Created_DT: string;
  Created_Staff_ID: number;
  Offered_DID: number;
}

interface Department {
  DID: number;
  Name: string;
  Address: string;
  Phone_No: string;
  Photo_Path: string;
}

const DIFFICULTY_OPTIONS = ["B1", "B2", "B3", "P4", "P5", "P6", "R7", "R8", "R9"];

export default function UpdateCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    Name: "",
    Description: "",
    Difficulty: "B1",
    Status: "ACTIVE",
    Offered_DID: 1,
  });

  // Fetch initial course list and department list
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coursesRes, deptRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_PATH}/course/list`, {
            method: "GET",
            credentials: "include",
          }),
          fetch(`${import.meta.env.VITE_API_PATH}/department/list`, {
            method: "GET",
            credentials: "include",
          }),
        ]);

        const coursesData = await coursesRes.json();
        const deptData = await deptRes.json();

        if (coursesData.success) {
          setCourses(coursesData.courses);
        } else {
          console.error("Failed to fetch courses:", coursesData.message);
        }

        if (deptData.success) {
          setDepartments(deptData.department);
        } else {
          console.error("Failed to fetch departments:", deptData.message);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle course dropdown selection change
  const handleCourseChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedCourseCode(code);
    setMessage(null);

    const course = courses.find((c) => c.Course_Code === code);
    if (course) {
      setFormData({
        Name: course.Name,
        Description: course.Description,
        Difficulty: course.Difficulty,
        Status: course.Status.toUpperCase(),
        Offered_DID: course.Offered_DID,
      });
    }
  };

  // Handle input field changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "Offered_DID" ? Number(value) : value,
    }));
  };

  // Handle form submission to update course details
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCourseCode) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_PATH}/course/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            Course_Code: selectedCourseCode,
            ...formData,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Course updated successfully!" });
        // Synchronize updated data into local state
        setCourses((prevCourses) =>
          prevCourses.map((c) =>
            c.Course_Code === selectedCourseCode
              ? { ...c, ...formData }
              : c
          )
        );
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to update course.",
        });
      }
    } catch (error) {
      console.error("Error updating course:", error);
      setMessage({
        type: "error",
        text: "An error occurred while sending the update request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading data...</div>;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", fontFamily: "sans-serif" }}>
      <h2 style={{color: "#333",textDecoration: "underline"}}>Update Course Information</h2>
    <br></br>
      {/* Select Course Dropdown */}
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="course-select" style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
          Select Course:
        </label>
        <select
          id="course-select"
          value={selectedCourseCode}
          onChange={handleCourseChange}
          style={{ width: "100%", padding: "8px", fontSize: "14px" }}
        >
          <option value="">-- Choose a course to edit --</option>
          {courses.map((course) => (
            <option key={course.Course_Code} value={course.Course_Code}>
              {course.Course_Code} - {course.Name}
            </option>
          ))}
        </select>
      </div>

      {/* Feedback Message */}
      {message && (
        <div
          style={{
            padding: "10px 15px",
            marginBottom: "20px",
            borderRadius: "4px",
            color: message.type === "success" ? "#155724" : "#721c24",
            backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da",
            border: `1px solid ${message.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Editable Form */}
      {selectedCourseCode && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Course Code (Read-only)
            </label>
            <input
              type="text"
              value={selectedCourseCode}
              disabled
              style={{ width: "100%", padding: "8px", backgroundColor: "#f0f0f0" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Course Name
            </label>
            <input
              type="text"
              name="Name"
              value={formData.Name}
              onChange={handleInputChange}
              required
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Description
            </label>
            <textarea
              name="Description"
              value={formData.Description}
              onChange={handleInputChange}
              rows={4}
              required
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Difficulty
            </label>
            <select
              name="Difficulty"
              value={formData.Difficulty}
              onChange={handleInputChange}
              style={{ width: "100%", padding: "8px" }}
            >
              {DIFFICULTY_OPTIONS.map((diff) => (
                <option key={diff} value={diff}>
                  {diff}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Status
            </label>
            <select
              name="Status"
              value={formData.Status}
              onChange={handleInputChange}
              style={{ width: "100%", padding: "8px" }}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Offered Department (Offered_DID)
            </label>
            <select
              name="Offered_DID"
              value={formData.Offered_DID}
              onChange={handleInputChange}
              style={{ width: "100%", padding: "8px" }}
            >
              {departments.map((dept) => (
                <option key={dept.DID} value={dept.DID}>
                  {dept.Name} (DID: {dept.DID})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "10px 15px",
              fontSize: "16px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              marginTop: "10px",
            }}
          >
            {isSubmitting ? "Updating..." : "Update Course"}
          </button>
        </form>
      )}
    </div>
  );
}