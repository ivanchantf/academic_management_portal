import { useEffect, useState } from "react"

export default function StaffList({ user }: { user: any }) {
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${import.meta.env.VITE_API_PATH}/staff/list`, {
          credentials: 'include'
        })
        const data = await res.json()
        
        if (data.success && Array.isArray(data.staff)) {
          setStaffList(data.staff)
        } else {
          setError(data.message || "Failed to load staff records.")
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    }

    fetchStaffList()
  }, [])

  // Group staff items dynamically by Department_Name
  const groupedStaff = staffList.reduce((acc: Record<string, any[]>, item) => {
    const deptName = item.Department_Name || "Unassigned Department"
    if (!acc[deptName]) {
      acc[deptName] = []
    }
    acc[deptName].push(item)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-gray-500 text-sm animate-pulse">Loading staff directory...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 my-4 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
        <strong>Error:</strong> {error}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Academic & Administrative Directory</h1>
        {/* <p className="text-sm text-gray-500 mt-1">Browse faculty and staff members grouped by department.</p> */}
      </div>

      {/* Departments */}
      {Object.keys(groupedStaff).length === 0 ? (
        <p className="text-gray-500 text-sm">No staff records found.</p>
      ) : (
        Object.entries(groupedStaff).map(([departmentName, staffMembers]) => (
          <section key={departmentName} className="space-y-4">
            {/* Department Title */}
            <div className="flex items-center space-x-2 border-b-2 border-indigo-600 pb-1">
              <h2 className="text-xl font-semibold text-gray-800">{departmentName}</h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 m-4">
                {staffMembers.length} {staffMembers.length === 1 ? 'member' : 'members'}
              </span>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {staffMembers.map((member) => (
                <div 
                  key={member.Staff_ID} 
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  {/* Basic Info */}
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{member.Staff_Name}</h3>
                        <p className="text-xs text-gray-400 font-mono">Staff ID: {member.Staff_ID}</p>
                      </div>
                    </div>

                    {/* Contact & Location */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-semibold block text-gray-700">Email:</span>
                        <a href={`mailto:${member.Email}`} className="text-indigo-600 hover:underline break-all">
                          {member.Email}
                        </a>
                      </div>
                      <div>
                        <span className="font-semibold block text-gray-700">Phone:</span>
                        <span>{member.Phone_No}</span>
                      </div>
                      <div>
                        <span className="font-semibold block text-gray-700">Office Room:</span>
                        <span>{member.Office_No}</span>
                      </div>
                      <div>
                        <span className="font-semibold block text-gray-700">Location:</span>
                        <span>{member.Office_Address}</span>
                      </div>
                    </div>

                    {/* Qualifications Section */}
                    <div className="mt-5 border-t border-gray-100 pt-3">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        Qualifications & Credentials
                      </h4>

                      {member.qualifications && member.qualifications.length > 0 ? (
                        <ul className="space-y-2">
                          {member.qualifications.map((qual: any) => (
                            <li 
                              key={qual.qualification_id} 
                              className="text-xs bg-gray-50 border border-gray-100 rounded p-2 text-gray-700"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-indigo-950">{qual.title}</span>
                                <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                                  {qual.level}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px] text-gray-500">
                                <span>{qual.organization}</span>
                                <span>{qual.obtained_dt}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No qualifications recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}