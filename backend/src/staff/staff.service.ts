import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StaffService {
  constructor(private readonly dataSource: DataSource) {}

  async listStaffs() {
    const rawData = await this.dataSource.query(`
      SELECT 
        s.Staff_ID,
        u.User_ID,
        u.Name AS Staff_Name,
        u.Email,
        u.Phone_No,
        s.Office_No,
        s.Office_Address,
        d.DID AS Department_ID,
        d.Name AS Department_Name,
        COALESCE(
          json_group_array(
            json_object(
              'qualification_id', q.Qualification_ID,
              'title', q.Title,
              'organization', q.Organization,
              'obtained_dt', q.Obtained_DT,
              'category_name', qc.Category_Name,
              'level', qc.Level
            )
          ) FILTER (WHERE q.Qualification_ID IS NOT NULL), 
          '[]'
        ) AS qualifications
      FROM Staffs s
      INNER JOIN Users u ON s.User_ID = u.User_ID
      LEFT JOIN Departments d ON u.DID = d.DID
      LEFT JOIN Qualifications q ON s.Staff_ID = q.Holder_Staff_ID
      LEFT JOIN Qualifications_Category qc ON q.Qualification_Type_ID = qc.Type_ID
      GROUP BY s.Staff_ID
      ORDER BY d.DID ASC, s.Staff_ID ASC;
    `);

    // Parse stringified JSON arrays returned by SQLite query driver
    return rawData.map((staff:any) => ({
      ...staff,
      qualifications: typeof staff.qualifications === 'string' 
        ? JSON.parse(staff.qualifications) 
        : staff.qualifications,
    }));
  }
}