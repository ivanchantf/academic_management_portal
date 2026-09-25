import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_PATH;

export default function RegisterCourses() {
  const [programmes, setProgrammes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [timeTickets, setTimeTickets] = useState([]);
  const [hasActiveTicket, setHasActiveTicket] = useState(false);
  const [initialEnrolledCodes, setInitialEnrolledCodes] = useState(new Set());
  const [selectedCourseCodes, setSelectedCourseCodes] = useState(new Set());
  
  const [isOverloadApproved, setIsOverloadApproved] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    console.log('Fetching initial data for course registration...');
    setLoading(true);
    setError(null);
    try {
      const [catalogRes, progRes, enrolledRes, timeTicketRes, overloadRes] = await Promise.all([
        fetch(`${API_BASE}/course/get-courses-catalog`, { credentials: "include" }).then(r => r.json()),
        fetch(`${API_BASE}/enrollment/my-enrolled-programmes`, { credentials: "include" }).then(r => r.json()),
        fetch(`${API_BASE}/enrollment/my-enrolled-courses`, { credentials: "include" }).then(r => r.json()),
        fetch(`${API_BASE}/timeticket/my-timetickets`, { credentials: "include" }).then(r => r.json()),
        fetch(`${API_BASE}/request/is-approved-overload`, { credentials: "include" }).then(r => r.json()),
      ]);

      if (!catalogRes.success || !progRes.success || !enrolledRes.success || !timeTicketRes.success || !overloadRes.success) {
        throw new Error('Failed to fetch required data');
      }

      // 1. Process Time Tickets & Check Active Window
      const tickets = timeTicketRes.tickets || [];
      setTimeTickets(tickets);

      const now = new Date();
      const isActive = tickets.some(ticket => {
        const start = new Date(ticket.From_DT);
        const end = new Date(ticket.To_DT);
        return now >= start && now <= end;
      });
      setHasActiveTicket(isActive);

      // 2. Process Enrolled Programmes
      const studentProgrammes = progRes.programmes || [];
      setProgrammes(studentProgrammes);

      const programmeCodes = new Set(
        studentProgrammes
          .map(p => (p.Programme_Code || p.programme_code || p.code || '').toString().trim().toUpperCase())
          .filter(Boolean)
      );

      // 3. Process Currently Enrolled Courses
      const enrolledList = enrolledRes.courses || enrolledRes.enrolled_courses || enrolledRes.data || [];
      
      const enrolledCodes = new Set(
        enrolledList
          .map(c => {
            const rawCode = typeof c === 'string' ? c : (c.course_code || c.Course_Code || c.code || c.Code);
            return rawCode ? String(rawCode).trim().toUpperCase() : null;
          })
          .filter(Boolean)
      );

      // 4. Process Catalog Courses
      const eligibleCourses = [];
      (catalogRes.courses || []).forEach(dept => {
        (dept.courses || []).forEach(course => {
          const rawCode = course.course_code || course.Course_Code || course.code;
          const normalizedCode = rawCode ? String(rawCode).trim().toUpperCase() : '';
          
          const isEligible = course.for_programme?.some(code => 
            programmeCodes.has(String(code).trim().toUpperCase())
          );
          
          if (isEligible && normalizedCode) {
            eligibleCourses.push({
              ...course,
              course_code: normalizedCode,
              department_name: dept.department_name,
            });
          }
        });
      });

      setCourses(eligibleCourses);
      setInitialEnrolledCodes(enrolledCodes);
      setSelectedCourseCodes(new Set(enrolledCodes));

      setIsOverloadApproved(overloadRes.isApproved ?? false);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (courseCode) => {
    const codeKey = String(courseCode).trim().toUpperCase();
    setSelectedCourseCodes(prev => {
      const next = new Set(prev);
      if (next.has(codeKey)) {
        next.delete(codeKey);
      } else {
        next.add(codeKey);
      }
      return next;
    });
  };

  // Helper function to calculate total credits for selected courses
  const calculateTotalCredits = () => {
    return courses.reduce((total, course) => {
      if (selectedCourseCodes.has(course.course_code)) {
        return total + (Number(course.credits) || 0);
      }
      return total;
    }, 0);
  };

  const handleSaveChanges = async () => {
    setMessage('');
    setError(null);

    const totalCredits = calculateTotalCredits();
    const maxCredits = isOverloadApproved ? 21 : 18;

    // Credit limit validation check
    if (totalCredits > maxCredits) {
      if (!isOverloadApproved) {
        setError(`You have selected ${totalCredits} credits. The maximum limit is 18 credits. Please submit an overload request to take more credits.`);
      } else {
        setError(`You have selected ${totalCredits} credits. Even with overload approval, you cannot exceed 21 credits.`);
      }
      return;
    }

    setSaving(true);

    const toRegister = [...selectedCourseCodes].filter(code => !initialEnrolledCodes.has(code));
    const toDeregister = [...initialEnrolledCodes].filter(code => !selectedCourseCodes.has(code));

    try {
      const response = await fetch(`${API_BASE}/enrollment/enroll-courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          register: toRegister,
          deregister: toDeregister,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Course registration updated successfully!');
        setInitialEnrolledCodes(new Set(selectedCourseCodes));
      } else {
        throw new Error(data.message || 'Failed to update registration');
      }
    } catch (err) {
      setError(err.message || 'Error saving registration changes');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading course registration...</div>
      </div>
    );
  }

  const currentTotalCredits = calculateTotalCredits();
  const maxAllowedCredits = isOverloadApproved ? 21 : 18;

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h2 style={styles.title}>Course Registration</h2>
          <p style={styles.subtitle}>Select courses for your active programmes and update your enrollment.</p>
        </header>

        {/* 1. Time Tickets Section */}
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>My Registration Time Tickets</h3>
          {timeTickets.length === 0 ? (
            <p style={styles.emptyText}>No registration time tickets found for your account.</p>
          ) : (
            <div style={styles.ticketGrid}>
              {timeTickets.map((ticket) => {
                const now = new Date();
                const start = new Date(ticket.From_DT);
                const end = new Date(ticket.To_DT);
                const isCurrent = now >= start && now <= end;

                return (
                  <div 
                    key={ticket.Ticket_ID} 
                    style={{
                      ...styles.ticketCard,
                      borderColor: isCurrent ? '#16a34a' : '#cbd5e1',
                      backgroundColor: isCurrent ? '#f0fdf4' : '#f8fafc',
                    }}
                  >
                    <div style={styles.ticketHeader}>
                      <span style={styles.ticketId}>Ticket #{ticket.Ticket_ID}</span>
                      <span 
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: isCurrent ? '#16a34a' : '#64748b',
                        }}
                      >
                        {isCurrent ? 'Active Now' : 'Inactive'}
                      </span>
                    </div>
                    <div style={styles.ticketDates}>
                      <div><strong>From:</strong> {formatDate(ticket.From_DT)}</div>
                      <div><strong>To:</strong> {formatDate(ticket.To_DT)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. Show Enrolled Majors & Minors */}
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>My Enrolled Programmes</h3>
          {programmes.length === 0 ? (
            <p style={styles.emptyText}>No enrolled programmes found.</p>
          ) : (
            <div style={styles.programmeGrid}>
              {programmes.map((p) => {
                const progCode = p.Programme_Code || p.programme_code || p.code;
                const progTitle = p.Title || p.title || p.Name || p.name;
                const progType = p.Programme_Type || p.programme_type || p.type || 'PROGRAMME';
                return (
                  <div key={progCode} style={styles.programmeBadge}>
                    <span style={styles.programmeType}>{progType}</span>
                    <div>
                      <strong style={styles.programmeTitle}>{progTitle}</strong>
                      <span style={styles.programmeCode}>({progCode})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Feedback Notifications */}
        {message && <div style={styles.successBanner}>{message}</div>}
        {error && <div style={styles.errorBox}>Error: {error}</div>}

        {/* 3. Conditional Registration Table or Restriction Notice */}
        {!hasActiveTicket ? (
          <div style={styles.restrictionBanner}>
            <h4 style={styles.restrictionTitle}>Registration Closed</h4>
            <p style={styles.restrictionMessage}>
              You do not hold an active time ticket for the current time slot. Course registration is unavailable at this time.
            </p>
          </div>
        ) : (
          <>
            <section style={styles.card}>
              <div style={styles.tableHeaderGroup}>
                <div>
                  <h3 style={styles.cardTitle}>Available Courses for Registration</h3>
                  <div style={{ fontSize: '13px', color: currentTotalCredits > maxAllowedCredits ? '#b91c1c' : '#475569' }}>
                    <strong>Selected Credits:</strong> {currentTotalCredits} / {maxAllowedCredits} credits 
                    {isOverloadApproved ? ' (Overload Approved)' : ''}
                  </div>
                </div>
                <span style={styles.courseCount}>{courses.length} Available</span>
              </div>

              {courses.length === 0 ? (
                <p style={styles.emptyText}>No eligible courses available for your programmes.</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, width: '70px', textAlign: 'center' }}>Select</th>
                        <th style={styles.th}>Course Code</th>
                        <th style={styles.th}>Course Details</th>
                        <th style={{ ...styles.th, textAlign: 'center' }}>Credits</th>
                        <th style={{ ...styles.th, textAlign: 'center' }}>Difficulty</th>
                        <th style={styles.th}>Department</th>
                        <th style={styles.th}>Instructors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => {
                        const codeKey = String(course.course_code).trim().toUpperCase();
                        const isChecked = selectedCourseCodes.has(codeKey);

                        return (
                          <tr 
                            key={codeKey}
                            style={{
                              ...styles.tr,
                              backgroundColor: isChecked ? '#f0f7ff' : '#ffffff',
                            }}
                          >
                            <td style={{ ...styles.td, textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxChange(codeKey)}
                                style={styles.checkbox}
                              />
                            </td>
                            <td style={styles.td}>
                              <span style={styles.codeTag}>{course.course_code}</span>
                            </td>
                            <td style={styles.td}>
                              <div style={styles.courseName}>{course.name || course.title}</div>
                              {course.description && (
                                <div style={styles.courseDesc}>{course.description}</div>
                              )}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>
                              <span style={styles.creditPill}>{course.credits ?? 'N/A'}</span>
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>
                              <span style={styles.difficultyPill}>{course.difficulty || '—'}</span>
                            </td>
                            <td style={styles.td}>{course.department_name}</td>
                            <td style={styles.td}>
                              <span style={styles.teacherText}>
                                {course.teachers?.map((t) => t.name).join(', ') || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Actions Bar */}
            <div style={styles.actionsBar}>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                style={{
                  ...styles.button,
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving Changes...' : 'Save Registration Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f8',
    padding: '40px 20px',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '28px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    margin: '6px 0 0 0',
    fontSize: '15px',
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0',
  },
  cardTitle: {
    margin: '0 0 4px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#0f172a',
  },
  ticketGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
  ticketCard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '8px',
    padding: '16px',
    minWidth: '260px',
    flex: '1 1 260px',
  },
  ticketHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  ticketId: {
    fontWeight: '700',
    color: '#1e293b',
    fontSize: '14px',
  },
  statusBadge: {
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '12px',
    textTransform: 'uppercase',
  },
  ticketDates: {
    fontSize: '13px',
    color: '#475569',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  programmeGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  programmeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px 14px',
  },
  programmeType: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  programmeTitle: {
    fontSize: '14px',
    color: '#1e293b',
  },
  programmeCode: {
    fontSize: '13px',
    color: '#64748b',
    marginLeft: '6px',
  },
  restrictionBanner: {
    backgroundColor: '#fff7ed',
    border: '1px solid #ffedd5',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    marginBottom: '24px',
  },
  restrictionTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#c2410c',
  },
  restrictionMessage: {
    margin: 0,
    fontSize: '14px',
    color: '#9a3412',
  },
  tableHeaderGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  courseCount: {
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#e2e8f0',
    color: '#475569',
    padding: '2px 10px',
    borderRadius: '12px',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  th: {
    backgroundColor: '#f8fafc',
    color: '#475569',
    fontWeight: '600',
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    transition: 'background-color 0.15s ease',
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '14px 16px',
    color: '#334155',
    verticalAlign: 'middle',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#2563eb',
  },
  codeTag: {
    fontWeight: '700',
    color: '#1d4ed8',
    backgroundColor: '#eff6ff',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '13px',
  },
  courseName: {
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '2px',
  },
  courseDesc: {
    fontSize: '12px',
    color: '#64748b',
    lineHeight: '1.4',
  },
  creditPill: {
    fontWeight: '600',
    color: '#0f766e',
    backgroundColor: '#f0fdf4',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
  },
  difficultyPill: {
    fontSize: '12px',
    color: '#475569',
  },
  teacherText: {
    fontSize: '13px',
    color: '#64748b',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '14px',
    margin: 0,
  },
  successBanner: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    border: '1px solid #bbf7d0',
    fontWeight: '500',
  },
  actionsBar: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    padding: '12px 28px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
    transition: 'all 0.2s ease',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
  },
  loadingText: {
    fontSize: '16px',
    color: '#64748b',
    fontWeight: '500',
  },
  errorContainer: {
    minHeight: '100vh',
    padding: '40px 20px',
    backgroundColor: '#f4f6f8',
  },
  errorBox: {
    maxWidth: '1100px',
    margin: '0 auto 24px auto',
    padding: '16px 20px',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    fontWeight: '500',
  },
};