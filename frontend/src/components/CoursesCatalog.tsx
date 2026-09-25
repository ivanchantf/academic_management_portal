import { useEffect, useState } from "react";
import "../App.css";

export default function CoursesCatalog({ user }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for handling course search/filter
  const [searchTerm, setSearchTerm] = useState("");

  // State for detail modal
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_PATH}/course/get-courses-catalog`,
          { credentials: "include" }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch courses catalog.");
        }

        const data = await response.json();
        if (data.success) {
          setDepartments(data.courses || []);
        } else {
          setError(data.message || "Failed to load course data.");
        }
      } catch (err) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler for double clicking a course row
  const handleCourseDoubleClick = (course, dept) => {
    setSelectedCourse(course);
    setSelectedDepartment(dept);
  };

  // Close modal handler
  const closeModal = () => {
    setSelectedCourse(null);
    setSelectedDepartment(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-600 font-medium">
        Loading courses catalog...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md my-4">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header & Search Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold !text-gray-600">
            Course Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Courses available in this semester are shown below. Double-click any row to view full course details.
          </p>
        </div>

        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search code, name, teacher, or programme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Department Tables */}
      {departments.map((dept) => {
        // Filter courses according to search input
        const filteredCourses = dept.courses.filter((course) => {
          const query = searchTerm.toLowerCase();
          const matchesCode = course.course_code.toLowerCase().includes(query);
          const matchesName = course.name.toLowerCase().includes(query);
          const matchesTeacher = course.teachers?.some((t) =>
            t.name.toLowerCase().includes(query)
          );
          const matchesProgramme = course.for_programme?.some((prog) =>
            prog.toLowerCase().includes(query)
          );

          return matchesCode || matchesName || matchesTeacher || matchesProgramme;
        });

        if (filteredCourses.length === 0 && searchTerm) {
          return null; // Skip rendering empty departments when search active
        }

        return (
          <div
            key={dept.department_id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Department Info Header */}
            <div className="bg-gray-800 text-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-lg font-semibold">{dept.department_name}</h2>
                <p className="text-xs text-gray-300">{dept.department_address}</p>
              </div>
              <span className="text-xs bg-gray-700 px-3 py-1 rounded-full text-gray-200">
                Contact: {dept.department_phone}
              </span>
            </div>

            {/* Courses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 px-4">Course Code</th>
                    <th className="py-3 px-4">Course Name</th>
                    <th className="py-3 px-4">Programmes</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Credits</th>
                    <th className="py-3 px-4">Teachers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredCourses.map((course) => (
                    <tr
                      key={course.course_code}
                      onDoubleClick={() => handleCourseDoubleClick(course, dept)}
                      className="hover:bg-blue-50/60 cursor-pointer transition-colors duration-150 select-none"
                      title="Double-click to view details"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-blue-600 whitespace-nowrap">
                        {course.course_code}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {course.name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {course.for_programme?.map((prog) => (
                            <span
                              key={prog}
                              className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                            >
                              {prog}
                            </span>
                          )) || <span className="text-gray-400 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
                          {course.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {course.credits}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {course.teachers.map((t) => t.name).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 relative border border-gray-100">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 text-xl font-bold"
            >
              &times;
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-800 px-2.5 py-1 rounded">
                  {selectedCourse.course_code}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-700 px-2.5 py-1 rounded">
                  {selectedCourse.difficulty} Level
                </span>
                <span className="text-xs font-bold uppercase tracking-wide bg-green-100 text-green-800 px-2.5 py-1 rounded">
                  {selectedCourse.credits} Credits
                </span>
              </div>
              <h2 className="text-2xl font-bold !text-gray-900 !mt-5">
                {selectedCourse.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedDepartment?.department_name}
              </p>
            </div>

            {/* Target Programmes Section */}
            {selectedCourse.for_programme && selectedCourse.for_programme.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Available For Programmes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCourse.for_programme.map((prog) => (
                    <span
                      key={prog}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200"
                    >
                      {prog}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="border-t border-b border-gray-100 py-4">
              <h3 className="text-sm font-semibold !text-gray-900 uppercase tracking-wider mb-2">
                Course Description
              </h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                {selectedCourse.description}
              </p>
            </div>

            {/* Teachers Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Instructors ({selectedCourse.teachers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCourse.teachers.map((teacher) => (
                  <div
                    key={teacher.staff_id}
                    className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-sm space-y-1"
                  >
                    <p className="font-bold text-gray-900">{teacher.name}</p>
                    <p className="text-gray-600 text-xs">
                      <span className="font-medium text-gray-500">Office:</span>{" "}
                      {teacher.office_no} ({teacher.office_address})
                    </p>
                    <p className="text-gray-600 text-xs">
                      <span className="font-medium text-gray-500">Email:</span>{" "}
                      <a
                        href={`mailto:${teacher.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {teacher.email}
                      </a>
                    </p>
                    <p className="text-gray-600 text-xs">
                      <span className="font-medium text-gray-500">Phone:</span>{" "}
                      {teacher.phone_no}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={closeModal}
                className="px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}