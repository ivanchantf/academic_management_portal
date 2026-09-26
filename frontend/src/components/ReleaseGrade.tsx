import React, { useEffect, useState } from 'react';

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

export default function ReleaseGrade({ user }: { user: any }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('');
  
  // Local state for modified grades: { [studentId]: grade }
  const [studentGrades, setStudentGrades] = useState<Record<number, string>>({});
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/teach/courses`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.staff)) {
        setCourses(data.staff);
        if (data.staff.length > 0) {
          const firstCourse = data.staff[0];
          setSelectedCourseCode(firstCourse.Course_Code);
          initializeGrades(firstCourse.Students);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch courses data');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading courses.');
    } finally {
      setLoading(false);
    }
  };

  // Populate local grade state from the selected course's student list
  const initializeGrades = (students: any[]) => {
    const initialMap: Record<number, string> = {};
    (students || []).forEach((student) => {
      initialMap[student.Student_ID] = student.Grade || '';
    });
    setStudentGrades(initialMap);
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCourseCode = e.target.value;
    setSelectedCourseCode(newCourseCode);
    setMessage('');

    const targetCourse = courses.find((c) => c.Course_Code === newCourseCode);
    if (targetCourse) {
      initializeGrades(targetCourse.Students);
    }
  };

  const handleGradeChange = (studentId: number, grade: string) => {
    setStudentGrades((prev) => ({
      ...prev,
      [studentId]: grade,
    }));
  };

  const handleSaveChanges = async () => {
    if (!selectedCourseCode) return;

    setSaving(true);
    setMessage('');
    setError(null);

    const activeCourse = courses.find((c) => c.Course_Code === selectedCourseCode);
    
    // Construct updates list for modified grades
    const gradeUpdates = (activeCourse?.Students || []).map((student: any) => ({
      student_id: student.Student_ID,
      grade: studentGrades[student.Student_ID] || null,
    }));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/teach/release-grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          course_code: selectedCourseCode,
          grades: gradeUpdates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Grades submitted successfully!');
        
        // Update local memory so subsequent switches preserve saved grades
        setCourses((prevCourses) =>
          prevCourses.map((c) => {
            if (c.Course_Code === selectedCourseCode) {
              return {
                ...c,
                Students: c.Students.map((s: any) => ({
                  ...s,
                  Grade: studentGrades[s.Student_ID] || null,
                })),
              };
            }
            return c;
          })
        );
      } else {
        throw new Error(data.message || 'Failed to update grades');
      }
    } catch (err: any) {
      setError(err.message || 'Error releasing grades');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-600">Loading courses and student roster...</div>;
  if (error && courses.length === 0) return <div className="p-6 text-red-600">Error: {error}</div>;

  const currentCourse = courses.find((c) => c.Course_Code === selectedCourseCode);
  const currentStudents = currentCourse?.Students || [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Release Grades</h1>
       <p className="text-sm !text-gray-500 mt-1 bg-gray-100/50 p-2 rounded-full border border-gray-200">
  Select a course to view enrolled students and submit final letter grades.
</p>

      </div>

      {/* Notifications */}
      {error && <div className="p-3 bg-red-100 text-red-700 rounded border border-red-200 text-sm">{error}</div>}
      {message && <div className="p-3 bg-green-100 text-green-700 rounded border border-green-200 text-sm">{message}</div>}

      {/* Course Selection Panel */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <label htmlFor="course-select" className="font-semibold text-gray-700 min-w-max">
          Select Taught Course:
        </label>
        <select
          id="course-select"
          value={selectedCourseCode}
          onChange={handleCourseChange}
          className="w-full sm:w-1/2 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          {courses.map((course) => (
            <option key={course.Course_Code} value={course.Course_Code}>
              {course.Course_Code} - {course.Name} ({course.Students?.length || 0} Students)
            </option>
          ))}
        </select>
      </div>

      {/* Student Roster & Grading Table */}
      {selectedCourseCode && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold !text-gray-800">{currentCourse?.Name}</h2>
              <span className="text-xs text-gray-500 font-mono">Code: {currentCourse?.Course_Code} | Credits: {currentCourse?.Credits}</span>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full">
              {currentStudents.length} Enrolled
            </span>
          </div>

          {currentStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No students are currently enrolled in this course.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 border-b">
                    <th className="p-3">Student ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Enrollment Date</th>
                    <th className="p-3 text-center">Assigned Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentStudents.map((student: any) => {
                    const currentGrade = studentGrades[student.Student_ID] || '';
                    return (
                      <tr key={student.Student_ID} className="hover:bg-gray-50">
                        <td className="p-3 font-mono text-gray-600">{student.Student_ID}</td>
                        <td className="p-3 font-semibold text-gray-800">{student.Name}</td>
                        <td className="p-3 text-gray-600">{student.Email}</td>
                        <td className="p-3 text-gray-500 text-xs">
                          {new Date(student.Enroll_DT).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center">
                          <select
                            value={currentGrade}
                            onChange={(e) => handleGradeChange(student.Student_ID, e.target.value)}
                            className="p-1.5 border border-gray-300 rounded text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">-- Select Grade --</option>
                            {GRADE_OPTIONS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Footer */}
          {currentStudents.length > 0 && (
            <div className="p-4 bg-gray-50 border-t flex justify-end">
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded shadow-sm disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Release & Save Grades'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}