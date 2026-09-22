import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ProfileService {
  constructor(private dataSource: DataSource) { }

  async checkStudentProfile(user: any) {
    // Example implementation - replace with actual logic
    let profile = await this.dataSource.query(`Select 
Student_ID,
Users.Name,
Users.HKID,
Users.DOB,
Users.Address,
Users.Gender,
Users.Phone_No,
Users.Email,
Users.Emergency_Contact_Person,
Users.Emergency_Phone_No,
Users.Entry_DT,
Departments.Name As Department_Name,
Departments.DID  As DID

from Students 
JOIN Users ON Users.User_ID=Students.User_ID
JOIN Departments ON Departments.DID=Users.DID
WHERE Users.User_ID=?`, [user.User_ID]);

    return profile.length > 0 ? profile[0] : null;
  }


  async checkStaffProfile(user: any) {
    // Example implementation - replace with actual logic
    let profile = await this.dataSource.query(`Select Staff_ID,
Office_No,
Office_Address,
Users.Name,
Users.HKID,
Users.DOB,
Users.Address,
Users.Gender,
Users.Phone_No,
Users.Email,
Users.Emergency_Contact_Person,
Users.Emergency_Phone_No,
Users.Entry_DT,
Departments.Name As Department_Name

from Staffs
JOIN Users ON Users.User_ID=Staffs.User_ID
JOIN Departments ON Departments.DID=Users.DID
WHERE Users.User_ID=?
`, [user.User_ID]);

    return profile.length > 0 ? profile[0] : null;
  }

  async updateStudentProfile(user: any, updatedProfile: any) {
    // Example implementation - replace with actual logic
    const { Name, HKID, DOB, Address, Gender, Phone_No, Email, Emergency_Contact_Person, Emergency_Phone_No } = updatedProfile;


    await this.dataSource.query(`UPDATE Users
                                SET Name=?, 
                                HKID=?,
                                DOB=?,
                                Email=?,
                                Phone_No=?,
                                Address=?,
                                Emergency_Contact_Person=?,
                                Emergency_Phone_No=?
                                WHERE User_ID=? `, [Name, HKID, DOB, Email, Phone_No, Address, Emergency_Contact_Person, Emergency_Phone_No, user.User_ID]);

    // Return the updated profile
    return this.checkStudentProfile(user);
  }

async updateStaffProfile(user: any, updatedProfile: any) {
  const { 
    Name, HKID, DOB, Address, Gender, Phone_No, Email, 
    Emergency_Contact_Person, Emergency_Phone_No, Office_No, Office_Address 
  } = updatedProfile;

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Update Users table
    await queryRunner.query(
      `UPDATE Users
       SET Name = ?, HKID = ?, DOB = ?, Email = ?, Phone_No = ?, Address = ?, Emergency_Contact_Person = ?, Emergency_Phone_No = ?
       WHERE User_ID = ?`,
      [Name, HKID, DOB, Email, Phone_No, Address, Emergency_Contact_Person, Emergency_Phone_No, user.User_ID]
    );

    // 2. Update Staffs table
    await queryRunner.query(
      `UPDATE Staffs
       SET Office_No = ?, Office_Address = ?
       WHERE User_ID = ?`,
      [Office_No, Office_Address, user.User_ID]
    );

    // Commit transaction if both updates succeed
    await queryRunner.commitTransaction();
  } catch (err) {
    // Rollback changes on failure
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    // Release query runner memory/connection
    await queryRunner.release();
  }

  return this.checkStaffProfile(user);
}

}