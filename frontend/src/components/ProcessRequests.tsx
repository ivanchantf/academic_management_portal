import React, { useEffect, useState } from 'react';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

interface MitigationRequest {
  Request_ID: number;
  Date_Of_Assessment: string;
  Reason: string;
  Status: string;
  Affecting_Course_Code: string;
  Submit_DT: string;
  Process_DT: string | null;
  Submitted_Student_ID: number;
  Submitted_By: string | null;
  Processed_Staff_ID: number | null;
  File_Path: string | null;
}

interface OverloadRequest {
  Request_ID: number;
  Reason: string;
  Status: string;
  Submit_DT: string;
  Process_DT: string | null;
  Submitted_Student_ID: number;
  Submitted_By: string | null;
  Processed_Staff_ID: number | null;
  File_Path: string | null;
}

export default function ProcessRequests({ user }: { user?: any }) {
  const [activeTab, setActiveTab] = useState<'mitigation' | 'overload'>('mitigation');
  const [showOnlyPending, setShowOnlyPending] = useState<boolean>(false);

  // Mitigation Data State
  const [mitigationRequests, setMitigationRequests] = useState<MitigationRequest[]>([]);
  const [loadingMitigation, setLoadingMitigation] = useState<boolean>(true);

  // Overload Data State
  const [overloadRequests, setOverloadRequests] = useState<OverloadRequest[]>([]);
  const [loadingOverload, setLoadingOverload] = useState<boolean>(true);

  // Processing Action State
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Mitigation Requests
  const fetchMitigationRequests = async () => {
    try {
      setLoadingMitigation(true);
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/request/all-mitigation`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.requests)) {
        setMitigationRequests(data.requests);
      } else {
        setMitigationRequests([]);
      }
    } catch (error) {
      console.error('Error fetching mitigation requests:', error);
    } finally {
      setLoadingMitigation(false);
    }
  };

  // Fetch Overload Requests
  const fetchOverloadRequests = async () => {
    try {
      setLoadingOverload(true);
      const response = await fetch(`${import.meta.env.VITE_API_PATH}/request/all-overload`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.requests)) {
        setOverloadRequests(data.requests);
      } else {
        setOverloadRequests([]);
      }
    } catch (error) {
      console.error('Error fetching overload requests:', error);
    } finally {
      setLoadingOverload(false);
    }
  };

  useEffect(() => {
    fetchMitigationRequests();
    fetchOverloadRequests();
  }, []);

  // Handle Approve / Reject Actions
  const handleProcessRequest = async (requestId: number, action: 'APPROVED' | 'REJECTED') => {
    setProcessingId(requestId);
    setMessage(null);

    const endpoint =
      activeTab === 'mitigation'
        ? `${import.meta.env.VITE_API_PATH}/request/process-mitigation`
        : `${import.meta.env.VITE_API_PATH}/request/process-overload`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestId,
          status: action,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: `Request #${requestId} has been successfully ${action.toLowerCase()}.`,
        });

        // Refresh request list
        if (activeTab === 'mitigation') {
          fetchMitigationRequests();
        } else {
          fetchOverloadRequests();
        }
      } else {
        setMessage({
          type: 'error',
          text: data.message || `Failed to process request #${requestId}.`,
        });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      setMessage({ type: 'error', text: 'An error occurred while processing the request.' });
    } finally {
      setProcessingId(null);
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

  const filteredMitigationRequests = showOnlyPending
    ? mitigationRequests.filter((r) => r.Status?.toUpperCase() === 'PENDING')
    : mitigationRequests;

  const filteredOverloadRequests = showOnlyPending
    ? overloadRequests.filter((r) => r.Status?.toUpperCase() === 'PENDING')
    : overloadRequests;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold !text-gray-900">Process Student Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review, approve, or reject student mitigation and credit overload requests.
        </p>
      </div>

      {/* Navigation Tabs and Controls Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 px-4 pt-2">
          {/* Tabs */}
          <div className="flex space-x-2">
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
              Mitigation Requests ({mitigationRequests.length})
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
              Credit Overload Requests ({overloadRequests.length})
            </button>
          </div>

          {/* Pending Checkbox Filter */}
          <div className="py-3 px-2 flex items-center space-x-2">
            <input
              type="checkbox"
              id="pendingFilter"
              checked={showOnlyPending}
              onChange={(e) => setShowOnlyPending(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="pendingFilter" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
              Show Pending Only
            </label>
          </div>
        </div>

        {/* Feedback Alert Message */}
        {message && (
          <div
            className={`p-4 mx-6 mt-4 rounded-lg text-sm font-medium border ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Request Tables Content */}
        <div className="p-6">
          {activeTab === 'mitigation' ? (
            loadingMitigation ? (
              <div className="text-center py-10 text-sm text-gray-500">Loading mitigation requests...</div>
            ) : filteredMitigationRequests.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                {showOnlyPending ? 'No pending mitigation requests found.' : 'No mitigation requests found.'}
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Student Name (StudentID)</th>
                      <th className="px-4 py-3">Course Code</th>
                      <th className="px-4 py-3">Assessment Date</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Submitted At</th>
                      <th className="px-4 py-3 text-center">Attachment</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredMitigationRequests.map((req) => {
                      const isPending = req.Status?.toUpperCase() === 'PENDING';
                      return (
                        <tr key={req.Request_ID} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">#{req.Request_ID}</td>
                          <td className="px-4 py-3 text-gray-700 font-medium">{req.Submitted_By}({req.Submitted_Student_ID})</td>
                          <td className="px-4 py-3 font-medium text-blue-600">{req.Affecting_Course_Code}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{req.Date_Of_Assessment}</td>
                          <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={req.Reason}>
                            {req.Reason}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{renderStatusBadge(req.Status)}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{req.Submit_DT}</td>
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
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleProcessRequest(req.Request_ID, 'APPROVED')}
                                  disabled={processingId === req.Request_ID}
                                  className="inline-flex items-center px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-50"
                                >
                                  <CheckCircleIcon fontSize="small" className="mr-1 !text-sm" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleProcessRequest(req.Request_ID, 'REJECTED')}
                                  disabled={processingId === req.Request_ID}
                                  className="inline-flex items-center px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-50"
                                >
                                  <HighlightOffIcon fontSize="small" className="mr-1 !text-sm" />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Processed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : loadingOverload ? (
            <div className="text-center py-10 text-sm text-gray-500">Loading overload requests...</div>
          ) : filteredOverloadRequests.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              {showOnlyPending ? 'No pending credit overload requests found.' : 'No credit overload requests found.'}
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Student Name (StudentID)</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Submitted At</th>
                    <th className="px-4 py-3 text-center">Attachment</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredOverloadRequests.map((req) => {
                    const isPending = req.Status?.toUpperCase() === 'PENDING';
                    return (
                      <tr key={req.Request_ID} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">#{req.Request_ID}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{req.Submitted_By}({req.Submitted_Student_ID})</td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={req.Reason}>
                          {req.Reason}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{renderStatusBadge(req.Status)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{req.Submit_DT}</td>
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
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isPending ? (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleProcessRequest(req.Request_ID, 'APPROVED')}
                                disabled={processingId === req.Request_ID}
                                className="inline-flex items-center px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-50"
                              >
                                <CheckCircleIcon fontSize="small" className="mr-1 !text-sm" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleProcessRequest(req.Request_ID, 'REJECTED')}
                                disabled={processingId === req.Request_ID}
                                className="inline-flex items-center px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-50"
                              >
                                <HighlightOffIcon fontSize="small" className="mr-1 !text-sm" />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}