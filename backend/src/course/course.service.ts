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
async getTeacher(courseCode: string): Promise<string[]> {
  const teachers = await this.dataSource.query(
    `SELECT Staff_ID FROM Teach WHERE Course_Code = ?`, 
    [courseCode]
  );

  return teachers.map((row: { Staff_ID: string }) => row.Staff_ID);
}
async assignTeachers(user: any, body: any): Promise<void> {
  await this.dataSource.transaction(async (transactionalEntityManager) => {
    const { courseCode, teacherIds } = body;
    // 1. Delete existing teacher assignments for the course
    await transactionalEntityManager.query(
      `DELETE FROM Teach WHERE Course_Code = ?`,
      [courseCode]
    );

    // 2. Early return if there are no new teachers to insert
    if (!teacherIds || teacherIds.length === 0) {
      return;
    }

    // 3. Construct a single bulk INSERT statement
    const placeholders = teacherIds.map(() => `(?, ?)`).join(', ');
    const values = teacherIds.flatMap((teacherId: string) => [courseCode, teacherId]);

    await transactionalEntityManager.query(
      `INSERT INTO Teach (Course_Code, Staff_ID) VALUES ${placeholders}`,
      values
    );
  });
}

async getCoursesCatalog(): Promise<any> {
  const sql = `
    SELECT 
      d.DID AS department_id,
      d.Name AS department_name,
      d.Address AS department_address,
      d.Phone_No AS department_phone,
      d.Photo_Path AS department_photo,
      json_group_array(
        json_object(
          'course_code', c.Course_Code,
          'name', c.Name,
          'description', c.Description,
          'difficulty', c.Difficulty,
          'credits', c.Credits,
          'status', c.Status,
          'teachers', course_teachers.teachers,
          'for_programme', COALESCE(course_programmes.programmes, json('[]'))
        )
      ) AS courses
    FROM Departments d
    INNER JOIN Courses c ON d.DID = c.Offered_DID
    INNER JOIN (
      SELECT 
        t.Course_Code,
        json_group_array(
          json_object(
            'staff_id', s.Staff_ID,
            'office_no', s.Office_No,
            'office_address', s.Office_Address,
            'user_id', u.User_ID,
            'name', u.Name,
            'email', u.Email,
            'phone_no', u.Phone_No
          )
        ) AS teachers
      FROM Teach t
      INNER JOIN Staffs s ON t.Staff_ID = s.Staff_ID
      INNER JOIN Users u ON s.User_ID = u.User_ID
      GROUP BY t.Course_Code
    ) course_teachers ON c.Course_Code = course_teachers.Course_Code
    LEFT JOIN (
      SELECT 
        Course_Code,
        json_group_array(Programme_Code) AS programmes
      FROM (
        SELECT Course_Code, Programme_Code FROM Major_Programmes_Courses
        UNION
        SELECT Course_Code, Programme_Code FROM Minor_Programmes_Courses
      ) combined_programmes
      GROUP BY Course_Code
    ) course_programmes ON c.Course_Code = course_programmes.Course_Code
    GROUP BY d.DID;
  `;

  const rawCatalog = await this.dataSource.query(sql);

  if (!rawCatalog || rawCatalog.length === 0) {
    return null;
  }

  // Parse nested JSON strings returned by SQLite driver
  return rawCatalog.map((department: any) => {
    const courses = typeof department.courses === 'string' 
      ? JSON.parse(department.courses) 
      : department.courses;

    return {
      ...department,
      courses: courses.map((course: any) => ({
        ...course,
        teachers: typeof course.teachers === 'string' 
          ? JSON.parse(course.teachers) 
          : course.teachers,
        for_programme: typeof course.for_programme === 'string'
          ? JSON.parse(course.for_programme)
          : course.for_programme
      }))
    };
  });
}
}