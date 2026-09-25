import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TimeticketService {
  constructor(private dataSource: DataSource) { }

async issue(user: any, body: any) {
  console.log('Issuing time tickets with body:', body);
  const { from_date_time, to_date_time, student_ids } = body;

  // 1. Guard clause for empty input
  if (!student_ids || student_ids.length === 0) {
    return [];
  }

  // 2. Fetch staff record
  const staffResults = await this.dataSource.query(
    `SELECT Staff_ID FROM Staffs WHERE User_ID = ? LIMIT 1`,
    [user.User_ID]
  );

  const issuedStaffId = staffResults[0]?.Staff_ID;
  if (!issuedStaffId) {
    throw new Error(`Staff record not found for User_ID: ${user.User_ID}`);
  }

  // 3. Perform batch insert inside a database transaction
  await this.dataSource.transaction(async (transactionalEntityManager) => {
    // Construct bulk query placeholders (?, ?, ?, CURRENT_DATE, ?)
    const placeholders = student_ids.map(() => `(?, ?, ?, CURRENT_DATE, ?)`).join(', ');
    
    // Flatten parameters into a single array
    const queryParams = student_ids.flatMap((sid: any) => [
      from_date_time,
      to_date_time,
      sid,
      issuedStaffId,
    ]);
    console.log('Bulk insert query parameters:', queryParams);
    const bulkInsertQuery = `
      INSERT INTO Time_Tickets (From_DT, To_DT, Holder_Student_ID, Issued_DT, Issued_Staff_ID)
      VALUES ${placeholders};
    `;

    await transactionalEntityManager.query(bulkInsertQuery, queryParams);
  });

  return student_ids;
}
async deleteAll() {

  const result = await this.dataSource.query(`DELETE FROM Time_Tickets;`);
  


  return { success: true };
}

async getMyTimeTickets(user: any) {

  let studentID=await this.dataSource.query(`SELECT Student_ID FROM Students WHERE User_ID=?`, [user.User_ID]);
  if (studentID.length === 0) {
    throw new Error(`Student record not found for User_ID: ${user.User_ID}`);
  }

  let query = `SELECT * FROM Time_Tickets WHERE Holder_Student_ID = ?`;
  let tickets = await this.dataSource.query(query, [studentID[0].Student_ID]);

  return tickets;
}


}