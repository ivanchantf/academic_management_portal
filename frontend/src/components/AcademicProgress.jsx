import { useEffect, useState, useMemo } from 'react';

export default function AcademicProgress() {
  const [activeTab, setActiveTab] = useState('transcript'); // 'transcript' | 'degreeworks'
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [cgpa, setCgpa] = useState(null);
  const [programmes, setProgrammes] = useState([]);
  const [selectedProgrammeCode, setSelectedProgrammeCode] = useState('');
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch initial enrolled courses and programmes
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${import.meta.env.VITE_API_PATH}/enrollment/my-enrolled-courses`, { credentials: 'include' })
        .then(res => res.json()),
      fetch(`${import.meta.env.VITE_API_PATH}/enrollment/my-enrolled-programmes`, { credentials: 'include' })
        .then(res => res.json()),
    ])
      .then(([coursesRes, progRes]) => {
        if (coursesRes.success) {
          setEnrolledCourses(coursesRes.courses || []);
          setCgpa(coursesRes.cgpa ?? null); // Save CGPA to state
        }
        if (progRes.success && progRes.programmes?.length > 0) {
          setProgrammes(progRes.programmes);
          setSelectedProgrammeCode(progRes.programmes[0].Programme_Code); // Default to first programme
        }
      })
      .catch(err => console.error('Error fetching initial data:', err))
      .finally(() => setLoading(false));
  }, []);

  // 2. Fetch syllabus whenever selected programme changes
  useEffect(() => {
    if (!selectedProgrammeCode) return;
    
    fetch(`${import.meta.env.VITE_API_PATH}/programme/syllabus/${selectedProgrammeCode}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSyllabus(data.courses || []);
        }
      })
      .catch(err => console.error('Error fetching syllabus:', err));
  }, [selectedProgrammeCode]);

  // Map enrolled courses by Course_Code for quick lookup
  const enrolledMap = useMemo(() => {
    const map = new Map();
    enrolledCourses.forEach(course => {
      map.set(course.Course_Code, course);
    });
    return map;
  }, [enrolledCourses]);

  // Current selected programme details
  const selectedProgramme = useMemo(() => {
    return programmes.find(p => p.Programme_Code === selectedProgrammeCode);
  }, [programmes, selectedProgrammeCode]);

  // Categorize syllabus courses into taken vs remaining
  const { takenSyllabusCourses, remainingSyllabusCourses, totalEarnedCredits } = useMemo(() => {
    let earnedCredits = 0;
    const taken = [];
    const remaining = [];

    syllabus.forEach(course => {
      const enrolled = enrolledMap.get(course.Course_Code);
      if (enrolled) {
        taken.push({ ...course, ...enrolled });
        // Count credits if completed with a grade
        if (enrolled.Grade) {
          earnedCredits += course.Credits;
        }
      } else {
        remaining.push(course);
      }
    });

    return {
      takenSyllabusCourses: taken,
      remainingSyllabusCourses: remaining,
      totalEarnedCredits: earnedCredits
    };
  }, [syllabus, enrolledMap]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading academic record...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold !text-gray-800 mb-6">Academic Progress Portal</h1>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('transcript')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'transcript'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Academic Transcript
        </button>
        <button
          onClick={() => setActiveTab('degreeworks')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'degreeworks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          DegreeWorks Audit
        </button>
      </div>

      {/* TAB 1: ACADEMIC TRANSCRIPT */}
      {activeTab === 'transcript' && (
        <div className="space-y-6">
          {/* CGPA Summary Banner */}
          <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between border-l-4 border-blue-600">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider !text-gray-500">Cumulative GPA (CGPA)</h2>
              <p className="text-xs text-gray-400 mt-0.5">Calculated based on all completed graded coursework.</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-extrabold text-blue-600">
                {cgpa !== null && cgpa !== undefined ? cgpa.toFixed(2) : 'N/A'}
              </span>
              <span className="text-sm font-medium text-gray-400"> / 4.30</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 !text-gray-700">Enrolled Courses & Grades</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-gray-100 text-gray-600 text-sm">
                    <th className="p-3">Course Code</th>
                    <th className="p-3">Course Name</th>
                    <th className="p-3">Credits</th>
                    <th className="p-3">Difficulty</th>
                    <th className="p-3">Enroll Date</th>
                    <th className="p-3">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {enrolledCourses.map((item) => (
                    <tr key={item.Course_Code} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-800">{item.Course_Code}</td>
                      <td className="p-3">{item.Name}</td>
                      <td className="p-3">{item.Credits}</td>
                      <td className="p-3"><span className="px-2 py-1 bg-gray-200 text-xs rounded">{item.Difficulty}</span></td>
                      <td className="p-3 text-gray-500">{item.Enroll_DT?.split(' ')[0]}</td>
                      <td className="p-3">
                        {item.Grade ? (
                          <span className="font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                            {item.Grade}
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEGREEWORKS */}
      {activeTab === 'degreeworks' && (
        <div className="space-y-6">
          {/* Programme Selection Bar */}
          <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
            <label className="font-semibold text-gray-700">Select Programme Audit:</label>
            <select
              value={selectedProgrammeCode}
              onChange={(e) => setSelectedProgrammeCode(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {programmes.map((prog) => (
                <option key={prog.Programme_Code} value={prog.Programme_Code}>
                  {prog.Title} ({prog.Programme_Type})
                </option>
              ))}
            </select>
          </div>

          {selectedProgramme && (
            <>
              {/* Credit Requirements Summary Card */}
              <div className="bg-white p-6 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-600 font-semibold uppercase">Total Required</div>
                  <div className="text-3xl font-bold text-blue-900 mt-1">
                    {selectedProgramme.Credits_Required || 'N/A'} <span className="text-sm">Credits</span>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-600 font-semibold uppercase">Completed Credits</div>
                  <div className="text-3xl font-bold text-green-900 mt-1">
                    {totalEarnedCredits} <span className="text-sm">Credits</span>
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-xs text-orange-600 font-semibold uppercase">Remaining Needed</div>
                  <div className="text-3xl font-bold text-orange-900 mt-1">
                    {selectedProgramme.Credits_Required
                      ? Math.max(0, selectedProgramme.Credits_Required - totalEarnedCredits)
                      : 'N/A'}{' '}
                    <span className="text-sm">Credits</span>
                  </div>
                </div>
              </div>

              {/* Covered Courses Taken */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <span>✓</span> Completed & In-Progress Requirements
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-green-50 text-green-900 text-xs uppercase">
                        <th className="p-3">Code</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Credits</th>
                        <th className="p-3">Grade</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {takenSyllabusCourses.map((c) => (
                        <tr key={c.Course_Code}>
                          <td className="p-3 font-semibold">{c.Course_Code}</td>
                          <td className="p-3">{c.Name}</td>
                          <td className="p-3">{c.Credits}</td>
                          <td className="p-3 font-bold">{c.Grade || '-'}</td>
                          <td className="p-3">
                            {c.Grade ? (
                              <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">Completed</span>
                            ) : (
                              <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">Enrolled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Covered Courses NOT Taken */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Recommended Remaining Courses
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Select from these syllabus courses to complete your programme requirements.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {remainingSyllabusCourses.map((course) => (
                    <div key={course.Course_Code} className="border border-gray-200 p-4 rounded-lg bg-gray-50 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-gray-800">{course.Course_Code}</span>
                          <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                            {course.Credits} Credits
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-700 text-sm mb-1">{course.Name}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2">{course.Description}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t text-xs text-gray-500 flex justify-between items-center">
                        <span>Level: {course.Difficulty}</span>
                        <span className="text-blue-600 font-medium">Fulfills Major Requirement</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}