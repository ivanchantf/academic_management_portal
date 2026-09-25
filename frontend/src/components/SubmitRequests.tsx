import React, { useEffect, useState } from 'react';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

interface EnrolledCourse {
  Student_ID: number;
  Course_Code: string;
  Enroll_DT: string;
  Grade: string | null;
  Name: string;
  Description: string;
  Difficulty: string;
  Credits: number;
  Status: string;
  Offered_DID: number;
}

interface MitigationRequest {
  Request_ID: number;
  Date_Of_Assessment: string;
  Reason: string;
  Status: string;
  Affecting_Course_Code: string;
  Submit_DT: string;
  Process_DT: string | null;
  Submitted_Student_ID: number;
  Processed_By: string | null;
  File_Path: string | null;
}

interface OverloadRequest {
  Request_ID: number;
  Reason: string;
  Status: string;
  Submit_DT: string;
  Process_DT: string | null;
  Submitted_Student_ID: number;
  Processed_By: string | null;
  File_Path: string | null;
}

export default function SubmitRequests({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'mitigation' | 'overload'>('mitigation');
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Key state to reset file input elements on successful submission
const [mitigationFileKey, setMitigationFileKey] = useState<number>(Date.now());
const [overloadFileKey, setOverloadFileKey] = useState<number>(Date.now());

  // Form State - Mitigation Request
  const [assessmentDate, setAssessmentDate] = useState<string>('');
  const [mitigationReason, setMitigationReason] = useState<string>('');
  const [affectedCourseCode, setAffectedCourseCode] = useState<string>('');
  const [mitigationFile, setMitigationFile] = useState<File | null>(null);

  // Form State - Credit Overload Request
  const [overloadReason, setOverloadReason] = useState<string>('');
  const [overloadFile, setOverloadFile] = useState<File | null>(null);

  // Submitted Requests State - Mitigation
  const [myMitigationRequests, setMyMitigationRequests] = useState<MitigationRequest[]>([]);
  const [loadingMitigationRequests, setLoadingMitigationRequests] = useState<boolean>(true);

  // Submitted Requests State - Credit Overload
  const [myOverloadRequests, setMyOverloadRequests] = useState<OverloadRequest[]>([]);
  const [loadingOverloadRequests, setLoadingOverloadRequests] = useState<boolean>(true);

  // Fetch Submitted Mitigation Requests
  const fetchMyMitigationRequests = async () => {
    try {
      setLoadingMitigationRequests(true);
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/request/my-mitigation`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.requests)) {
        setMyMitigationRequests(data.requests);
      } else {
        setMyMitigationRequests([]);
      }
    } catch (error) {
      console.error('Error fetching my mitigation requests:', error);
    } finally {
      setLoadingMitigationRequests(false);
    }
  };

  // Fetch Submitted Credit Overload Requests
  const fetchMyOverloadRequests = async () => {
    try {
      setLoadingOverloadRequests(true);
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/request/my-overload`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.requests)) {
        setMyOverloadRequests(data.requests);
      } else {
        setMyOverloadRequests([]);
      }
    } catch (error) {
      console.error('Error fetching my overload requests:', error);
    } finally {
      setLoadingOverloadRequests(false);
    }
  };

  useEffect(() => {
    fetchMyMitigationRequests();
    fetchMyOverloadRequests();
  }, []);

  // Fetch Enrolled Courses for Mitigation dropdown
  useEffect(() => {
    const getMyEnrolledCourse = async () => {
      try {
        setLoadingCourses(true);
        const response = await fetch(`${import.meta.env.VITE_API_PATH}/enrollment/my-enrolled-courses`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success && Array.isArray(data.students)) {
          setCourses(data.students);
          if (data.students.length > 0) {
            setAffectedCourseCode(data.students[0].Course_Code);
          }
        }
      } catch (error) {
        console.error('Error fetching my enrolled courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    };
    getMyEnrolledCourse();
  }, []);

  // Submit Handler for Mitigation Requests
  const handleMitigationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentDate || !mitigationReason || !affectedCourseCode) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('requestType', 'MITIGATION');
      formData.append('assessmentDate', assessmentDate);
      formData.append('reason', mitigationReason);
      formData.append('courseCode', affectedCourseCode);
      if (mitigationFile) {
        formData.append('supportingDocument', mitigationFile);
      }

      const response = await fetch(`${import.meta.env.VITE_API_PATH}/request/submit-mitigation`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Mitigation request submitted successfully.' });
        setAssessmentDate('');
        setMitigationReason('');
        setMitigationFile(null);
        setMitigationFileKey(Date.now());
        fetchMyMitigationRequests();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit request.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'An unexpected error occurred while submitting.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Handler for Credit Overload Requests
  const handleOverloadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overloadReason) {
      setMessage({ type: 'error', text: 'Please provide a reason for the credit overload.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('requestType', 'CREDIT_OVERLOAD');
      formData.append('reason', overloadReason);
      if (overloadFile) {
        formData.append('supportingDocument', overloadFile);
      }

      const response = await fetch(`${import.meta.env.VITE_API_PATH}/request/submit-overload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Credit overload request submitted successfully.' });
        setOverloadReason('');
        setOverloadFile(null);
        setOverloadFileKey(Date.now());
        fetchMyOverloadRequests();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit request.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'An unexpected error occurred while submitting.' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    const formatted = status?.toUpperCase() || 'UNKNOWN';
    let badgeStyle = 'bg-gray-100 text-gray-800 border-gray-200';

    if (formatted === 'APPROVED') {
      badgeStyle = 'bg-green-100 text-green-800 border-green-300';
    } else if (formatted === 'PENDING') {
      badgeStyle = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else if (formatted === 'REJECTED') {
      badgeStyle = 'bg-red-100 text-red-800 border-red-300';
    }

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
        {formatted}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold !text-gray-900">Submit Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a request type below, complete the details, and upload any necessary supporting documentation.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden px-4 pt-2">
        <button
          onClick={() => {
            setActiveTab('mitigation');
            setMessage(null);
          }}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'mitigation'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Mitigation Request
        </button>
        <button
          onClick={() => {
            setActiveTab('overload');
            setMessage(null);
          }}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'overload'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Credit Overload Request
        </button>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`p-4 rounded-lg text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white p-6 rounded-b-xl rounded-t-none shadow-sm border border-gray-200 border-t-0">
        {activeTab === 'mitigation' ? (
          <form onSubmit={handleMitigationSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Affected Course <span className="text-red-500">*</span>
              </label>
              <select
                value={affectedCourseCode}
                onChange={(e) => setAffectedCourseCode(e.target.value)}
                disabled={loadingCourses || courses.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                {loadingCourses ? (
                  <option value="">Loading enrolled courses...</option>
                ) : courses.length === 0 ? (
                  <option value="">No enrolled courses found</option>
                ) : (
                  courses.map((course) => (
                    <option key={course.Course_Code} value={course.Course_Code}>
                      {course.Course_Code} - {course.Name} ({course.Credits} Credits)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Date of Assessment <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Reason for Mitigation <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={mitigationReason}
                onChange={(e) => setMitigationReason(e.target.value)}
                placeholder="Describe the extenuating circumstances..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Upload Supporting Document <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="file"
                key={mitigationFileKey} // Reset file input on successful submission
                onChange={(e) => setMitigationFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || loadingCourses}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Mitigation Request'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOverloadSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Reason for Credit Overload <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={overloadReason}
                onChange={(e) => setOverloadReason(e.target.value)}
                placeholder="Explain why you require additional course credits beyond the standard limit..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Upload Supporting Document <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="file"
                key={overloadFileKey} // Reset file input on successful submission
                onChange={(e) => setOverloadFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Overload Request'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Dynamic Submitted Requests Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-8 space-y-4">
        <div>
          <h2 className="text-xl font-bold !text-gray-900">
            {activeTab === 'mitigation' ? 'My Submitted Mitigation Requests' : 'My Submitted Overload Requests'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {activeTab === 'mitigation'
              ? 'Review the status and details of your submitted mitigation requests.'
              : 'Review the status and details of your submitted credit overload requests.'}
          </p>
        </div>

        {activeTab === 'mitigation' ? (
          loadingMitigationRequests ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading mitigation requests...</div>
          ) : myMitigationRequests.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              No submitted mitigation requests found.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Course Code</th>
                    <th className="px-4 py-3">Assessment Date</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Submitted At</th>
                    <th className="px-4 py-3">Processed At</th>
                    <th className="px-4 py-3">Processed By</th>
                    <th className="px-4 py-3 text-center">Attachment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {myMitigationRequests.map((req) => (
                    <tr key={req.Request_ID} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{req.Request_ID}</td>
                      <td className="px-4 py-3 font-medium text-blue-600">{req.Affecting_Course_Code}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{req.Date_Of_Assessment}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={req.Reason}>
                        {req.Reason}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{renderStatusBadge(req.Status)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{req.Submit_DT}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{req.Process_DT || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{req.Processed_By || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        {req.File_Path ? (
                          <a
                            href={`${import.meta.env.VITE_API_PATH}/${req.File_Path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="View Supporting Document"
                          >
                            <InsertDriveFileIcon fontSize="small" />
                          </a>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : loadingOverloadRequests ? (
          <div className="text-center py-8 text-sm text-gray-500">Loading overload requests...</div>
        ) : myOverloadRequests.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No submitted credit overload requests found.
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted At</th>
                  <th className="px-4 py-3">Processed At</th>
                  <th className="px-4 py-3">Processed By</th>
                  <th className="px-4 py-3 text-center">Attachment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {myOverloadRequests.map((req) => (
                  <tr key={req.Request_ID} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{req.Request_ID}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={req.Reason}>
                      {req.Reason}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{renderStatusBadge(req.Status)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{req.Submit_DT}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{req.Process_DT || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{req.Processed_By || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {req.File_Path ? (
                        <a
                          href={`${import.meta.env.VITE_API_PATH}/${req.File_Path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                          title="View Supporting Document"
                        >
                          <InsertDriveFileIcon fontSize="small" />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}