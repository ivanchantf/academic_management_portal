import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CourseService {
  constructor(private dataSource: DataSource) { }




  async createCourse(user: any, courseData: any) {

    let userStaffId=await this.dataSource.query(`Select * from Staffs WHERE Staffs.User_ID=?`, [user.User_ID]);

    // Example implementation - replace with actual logic
    let course= await this.dataSource.query(`INSERT INTO Courses (Course_Code,Name,Description,Difficulty,Credits,Status,Created_DT,Created_Staff_ID,Offered_DID) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`   
      , [courseData.courseCode, courseData.name, courseData.description, courseData.difficulty, courseData.credits, 'ACTIVE', userStaffId[0].Staff_ID, courseData.offeringDepartment]
    );
    return course;
  }


  async listCourses() {
    // Example implementation - replace with actual logic
    console.log('Fetching all courses from the database...');
    let courses= await this.dataSource.query(`Select * from Courses `);
    return courses.length > 0 ? courses : [];
  }

  async updateCourse(user: any, courseData: any) {

    let userStaffId=await this.dataSource.query(`Select * from Staffs WHERE Staffs.User_ID=?`, [user.User_ID]);

    // Example implementation - replace with actual logic
    let course= await this.dataSource.query(`UPDATE Courses SET  Name=?, Description=?, Difficulty=?,  Status=?,  Offered_DID=?, Updated_DT=CURRENT_TIMESTAMP,  Updated_Staff_ID=? WHERE Course_Code=?`   
      , [ courseData.Name, courseData.Description, courseData.Difficulty,  courseData.Status,courseData.Offered_DID,  userStaffId[0].Staff_ID, courseData.Course_Code]
    );
    console.log('Update result:', course); // Log the update result for debugging

    return {
      success: true,
      message: 'Course updated successfully'
    };
  }

  
}