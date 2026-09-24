import { useEffect, useState } from "react";

import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
export default function IssueTimeTickets({ user }) {
    const [students, setStudents] = useState([]);
    const [majorProgrammes, setMajorProgrammes] = useState([]);
    const [minorProgrammes, setMinorProgrammes] = useState([]);

    // Selection states
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [selectedProgrammeCode, setSelectedProgrammeCode] = useState("");

    // Date & Time states
    const [fromDateTime, setFromDateTime] = useState("");
    const [toDateTime, setToDateTime] = useState("");

    // Loading & Alert states
    const [loading, setLoading] = useState(false);
    const [programmeLoading, setProgrammeLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    // 1. Fetch Students
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_PATH}/auth/list-accounts`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success) {
                    const studentAccounts = (data.accounts || []).filter(
                        (acc) => acc.userType === "Student" && acc.Student_ID !== null
                    );
                    setStudents(studentAccounts);
                }
            } catch (err) {
                console.error("Failed to fetch students:", err);
            }
        };
        fetchStudents();
    }, []);

    // 2. Fetch Major Programmes
    useEffect(() => {
        const fetchAllMajorProgramme = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_PATH}/programme/all-major-programmes`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success) {
                    setMajorProgrammes(data.programme || []);
                }
            } catch (err) {
                console.error("Failed to fetch major programmes:", err);
            }
        };
        fetchAllMajorProgramme();
    }, []);

    // 3. Fetch Minor Programmes
    useEffect(() => {
        const fetchAllMinorProgramme = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_PATH}/programme/all-minor-programmes`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success) {
                    setMinorProgrammes(data.programme || []);
                }
            } catch (err) {
                console.error("Failed to fetch minor programmes:", err);
            }
        };
        fetchAllMinorProgramme();
    }, []);

    // Mode 2: Handle Programme Selection -> Fetch & Check enrolled students
    const handleProgrammeChange = async (e) => {
        const progCode = e.target.value;
        setSelectedProgrammeCode(progCode);
        setSelectedStudentIds([]);
        if (!progCode) return;

        try {
            setProgrammeLoading(true);
            const res = await fetch(
                `${import.meta.env.VITE_API_PATH}/enrollment/get-students/${progCode}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );
            const data = await res.json();
            if (data.success && data.students) {
                const enrolledIds = data.students.map((s) => s.Student_ID);
                setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...enrolledIds])));
                setStatusMessage({
                    type: "info",
                    text: `Auto-selected ${enrolledIds.length} student(s) enrolled in ${progCode}.`,
                });
            } else if (!data.success && data.students?.length === 0) {
                setStatusMessage({
                    type: "info",
                    text: `No students are currently enrolled in ${progCode}. (No students auto-selected)`,
                });
            }
        } catch (err) {
            console.error("Error fetching students by programme code:", err);
            setStatusMessage({ type: "error", text: "Failed to fetch students for selected programme." });
        } finally {
            setProgrammeLoading(false);
        }
    };

    // Toggle individual student selection
    const handleStudentCheckboxChange = (studentId) => {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    // Select / Deselect All
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudentIds(students.map((s) => s.Student_ID));
        } else {
            setSelectedStudentIds([]);
        }
    };

    // Issue Time Tickets Handler
    const handleIssueTickets = async () => {
        if (selectedStudentIds.length === 0) {
            alert("Please select at least one student.");
            return;
        }
        if (!fromDateTime || !toDateTime) {
            alert("Please fill both 'From' and 'To' date and time.");
            return;
        }
        if (new Date(fromDateTime) >= new Date(toDateTime)) {
            alert("'From' date/time must be strictly earlier than 'To' date/time.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_PATH}/timeticket/issue`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    student_ids: selectedStudentIds,
                    from_date_time: fromDateTime,
                    to_date_time: toDateTime,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setStatusMessage({ type: "success", text: "Time tickets successfully issued!" });
            } else {
                setStatusMessage({ type: "error", text: data.message || "Failed to issue time tickets." });
            }
        } catch (err) {
            console.error(err);
            setStatusMessage({ type: "error", text: "An error occurred while issuing time tickets." });
        } finally {
            setLoading(false);
        }
    };

    // Remove All Issued Tickets Handler
    const handleRemoveAllTickets = async () => {
        const confirmDelete = window.confirm(
            "Are you sure you want to remove all issued time tickets? This action cannot be undone."
        );
        if (!confirmDelete) return;

        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_PATH}/timeticket/delete-all`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setStatusMessage({ type: "success", text: "All issued tickets have been removed successfully." });
                setSelectedStudentIds([]);
            } else {
                setStatusMessage({ type: "error", text: data.message || "Failed to remove issued tickets." });
            }
        } catch (err) {
            console.error(err);
            setStatusMessage({ type: "error", text: "An error occurred while removing tickets." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="!text-2xl font-bold tracking-tight !text-slate-900">
                                Issue Time Tickets
                            </h1>
                        </div>
                        <p className="!text-sm text-slate-500">
                            Grant students specific time windows to register for courses.
                        </p>
                    </div>

                    <button
                        onClick={handleRemoveAllTickets}
                        disabled={loading}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 !text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500/20 active:scale-[0.98]"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove All Issued Tickets
                    </button>
                </div>

                {/* Alert Banner */}
                {statusMessage && (
                    <div
                        className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border transition-all duration-200 ${statusMessage.type === "success"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                                : statusMessage.type === "error"
                                    ? "bg-rose-50 text-rose-800 border-rose-200/80"
                                    : "bg-blue-50 text-blue-800 border-blue-200/80"
                            }`}
                    >
                        <span className="shrink-0">
                            {statusMessage.type === "success" && (
                                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                            {statusMessage.type === "error" && (
                                <svg className="w-5 h-5 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                            {statusMessage.type === "info" && (
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            )}
                        </span>
                        <p className="flex-1">{statusMessage.text}</p>
                    </div>
                )}

                {/* Configuration Form Card */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200/80 space-y-8">
                    {/* Step 1: Date & Time Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* From Date Time */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                                From Date & Time
                            </label>
                            <Flatpickr
                                data-enable-time
                                value={fromDateTime}
                                options={{
                                    dateFormat: "Y-m-d H:i",
                                    time_24hr: true,
                                    minuteIncrement: 15,
                                }}
                                onChange={([date]) => setFromDateTime(date)}
                                placeholder="Select start date & time"
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 hover:border-slate-400 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                            />
                        </div>

                        {/* To Date Time */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                                To Date & Time
                            </label>
                            <div className="relative">
                                <Flatpickr
                                    data-enable-time
                                    value={toDateTime}
                                    options={{
                                        dateFormat: "Y-m-d H:i",
                                        time_24hr: true,
                                        minuteIncrement: 15,
                                    }}
                                    onChange={([date]) => setToDateTime(date)}
                                    placeholder="Select end date & time"
                                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 hover:border-slate-400 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Student Selection Section */}
                    <div className="border-t border-slate-200/80 pt-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-bold !text-slate-700 uppercase tracking-wider">
                                Student Selection
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                {selectedStudentIds.length} Selected
                            </span>
                        </div>
                        <div className="flex !justify-between !items-between gap-6 ">
                            {/* Batch Select Programme Dropdown */}
                            <div className="space-y-1.5 max-w-md ">
                                <label className="block text-xs font-semibold text-slate-600">
                                    Batch Select by Programme
                                </label>
                                <select
                                    value={selectedProgrammeCode}
                                    onChange={handleProgrammeChange}
                                    disabled={programmeLoading}
                                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 hover:border-slate-400 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                                >
                                    <option value="">-- Choose a Programme --</option>
                                    <optgroup label="Major Programmes">
                                        {majorProgrammes.map((prog) => (
                                            <option key={prog.Programme_Code} value={prog.Programme_Code}>
                                                {prog.Programme_Code} - {prog.Title}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Minor Programmes">
                                        {minorProgrammes.map((prog) => (
                                            <option key={prog.Programme_Code} value={prog.Programme_Code}>
                                                {prog.Programme_Code} - {prog.Title}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            {/* Select All Bar */}
                            <div className="flex items-center justify-end gap-2 text-sm text-slate-600 pt-1">
                                <input
                                    type="checkbox"
                                    id="selectAll"
                                    checked={
                                        students.length > 0 && selectedStudentIds.length === students.length
                                    }
                                    onChange={handleSelectAll}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 h-4 w-4 cursor-pointer transition-all"
                                />
                                <label htmlFor="selectAll" className="cursor-pointer font-medium text-slate-700 select-none text-xs">
                                    Select All Students
                                </label>
                            </div>
                        </div>
                        {/* Student Checkbox List */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto bg-slate-50/30">
                            {students.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    No student records available.
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {students.map((student) => {
                                        const isChecked = selectedStudentIds.includes(student.Student_ID);
                                        return (
                                            <li
                                                key={student.User_ID}
                                                className={`transition-colors duration-150 ${isChecked ? "bg-blue-50/60" : "hover:bg-slate-100/50"
                                                    }`}
                                            >
                                                <label
                                                    htmlFor={`student-${student.Student_ID}`}
                                                    className="flex items-center gap-3.5 p-3.5 w-full cursor-pointer select-none"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        id={`student-${student.Student_ID}`}
                                                        checked={isChecked}
                                                        onChange={() => handleStudentCheckboxChange(student.Student_ID)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 h-4 w-4 cursor-pointer"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-slate-900 truncate">
                                                                {student.Name}
                                                            </p>
                                                            <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                                                                {student.Student_ID}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                                            {student.Email} • {student.DepartmentName || "N/A"}
                                                        </p>
                                                    </div>
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleIssueTickets}
                            disabled={loading || selectedStudentIds.length === 0}
                            className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-[0.99]"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Updating...
                                </>
                            ) : (
                                "Issue Time Tickets"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}