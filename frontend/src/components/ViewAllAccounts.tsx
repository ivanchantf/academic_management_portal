import React, { useEffect, useState } from "react";

export default function ViewAllAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_PATH}/auth/list-accounts`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setAccounts(data.accounts);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Filter accounts dynamically based on Name or Username
  const filteredAccounts = accounts.filter((acc:any) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = acc.Name?.toLowerCase().includes(term);
    const usernameMatch = acc.Username?.toLowerCase().includes(term);
    return nameMatch || usernameMatch;
  });

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      {/* Search Input Bar replace the "Account Management" header */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search by Name or Username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "10px 14px",
            fontSize: "15px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            outline: "none",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        />
        <p style={{ color: "#666", fontSize: "13px", marginTop: "8px" }}>
          Double-click any row to view complete profile details.
        </p>
      </div>

      {loading ? (
        <div>Loading accounts...</div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ padding: "12px" }}>Username</th>
              <th style={{ padding: "12px" }}>Name</th>
              <th style={{ padding: "12px" }}>User Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((acc:any) => (
                <tr
                  key={acc.User_ID}
                  onDoubleClick={() => setSelectedAccount(acc)}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "12px", fontWeight: "500" }}>{acc.Username}</td>
                  <td style={{ padding: "12px" }}>{acc.Name}</td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: acc.userType === "Staff" ? "#dbeafe" : "#dcfce7",
                        color: acc.userType === "Staff" ? "#1e40af" : "#166534",
                      }}
                    >
                      {acc.userType}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>
                  No accounts found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Account Details Modal */}
      {selectedAccount && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedAccount(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "12px",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0 }}>User Profile Details</h3>
              <button
                onClick={() => setSelectedAccount(null)}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
              <DetailItem label="User ID" value={selectedAccount.User_ID} />
              <DetailItem label="Username" value={selectedAccount.Username} />
              <DetailItem label="Full Name" value={selectedAccount.Name} />
              <DetailItem label="User Type" value={selectedAccount.userType} />
              <DetailItem label="HKID" value={selectedAccount.HKID} />
              <DetailItem label="Gender" value={selectedAccount.Gender} />
              <DetailItem label="Date of Birth" value={selectedAccount.DOB} />
              <DetailItem label="Phone No." value={selectedAccount.Phone_No} />
              <DetailItem label="Email" value={selectedAccount.Email} />
              <DetailItem label="Department ID (DID)" value={selectedAccount.DID} />
              <DetailItem label="Entry Date" value={selectedAccount.Entry_DT} />
              <DetailItem label="Emergency Contact" value={selectedAccount.Emergency_Contact_Person} />
              <DetailItem label="Emergency Phone" value={selectedAccount.Emergency_Phone_No} />
              
              <div style={{ gridColumn: "span 2" }}>
                <DetailItem label="Address" value={selectedAccount.Address} />
              </div>

              {selectedAccount.userType === "Staff" && (
                <>
                  <DetailItem label="Staff ID" value={selectedAccount.Staff_ID} />
                  <DetailItem label="Office No." value={selectedAccount.Office_No} />
                  <div style={{ gridColumn: "span 2" }}>
                    <DetailItem label="Office Address" value={selectedAccount.Office_Address} />
                  </div>
                </>
              )}

              {selectedAccount.userType === "Student" && (
                <>
                  <DetailItem label="Student ID" value={selectedAccount.Student_ID} />
                  <DetailItem label="CGPA" value={selectedAccount.CGPA ?? "N/A"} />
                </>
              )}
            </div>

            <div style={{ marginTop: "24px", textAlign: "right" }}>
              <button
                onClick={() => setSelectedAccount(null)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
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

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <span style={{ fontSize: "12px", color: "#6b7280", display: "block" }}>{label}</span>
      <span style={{ fontSize: "14px", fontWeight: "500", color: "#111827" }}>
        {value !== null && value !== undefined && value !== "" ? String(value) : "—"}
      </span>
    </div>
  );
}