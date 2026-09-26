import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
export interface GradeEntry {
  student_id: number | string;
  grade: string | number;
}

export interface ReleaseGradesDto {
  course_code: string;
  grades: GradeEntry[];
}
@Injectable()
export class TeachService {
  constructor(private readonly dataSource: DataSource) {}

async getMyTeachingCourses(user: any): Promise<any[]> {
  const staff = await this.dataSource.query(
    'SELECT Staff_ID FROM Staffs WHERE User_ID = ?',
    [user.User_ID]
  );
  
  const staffId = staff[0]?.Staff_ID;
  if (!staffId) {
    throw new Error('Staff record not found for the logged-in user.');
  }

  // SQLite query using JSON functions to group students into an array per course
  const courses: any[] = await this.dataSource.query(
    `SELECT 
      c.Course_Code,
      c.Credits,
      c.Name,
      t.Staff_ID,
      COALESCE(
        json_group_array(
          json_object(
            'Student_ID', s.Student_ID,
            'Name', u.Name,
            'Email', u.Email,
            'Grade', ce.Grade,
            'Enroll_DT', ce.Enroll_DT
          )
        ) FILTER (WHERE s.Student_ID IS NOT NULL),
        '[]'
      ) AS Students
    FROM Teach t
    JOIN Courses c ON t.Course_Code = c.Course_Code
    LEFT JOIN Course_Enrollments ce ON c.Course_Code = ce.Course_Code
    LEFT JOIN Students s ON ce.Student_ID = s.Student_ID
    LEFT JOIN Users u ON s.User_ID = u.User_ID
    WHERE t.Staff_ID = ?
    GROUP BY c.Course_Code`,
    [staffId]
  );

  // Parse the JSON string into native JS arrays
  return courses.map(course => ({
    ...course,
    Students: JSON.parse(course.Students)
  }));
}

async releaseGrades(userId: number | string, body: ReleaseGradesDto): Promise<any> {
    const { course_code, grades } = body;

    // Validate payload shape
    if (!course_code || !grades || !Array.isArray(grades) || grades.length === 0) {
      return {
        success: false,
        message: 'Invalid payload. Course code and a non-empty grades array are required.',
      };
    }

    // 1. Verify user is a staff member
    const staff = await this.dataSource.query(
      'SELECT Staff_ID FROM Staffs WHERE User_ID = ?',
      [userId]
    );

    const staffId = staff[0]?.Staff_ID;
    if (!staffId) {
      return {
        success: false,
        message: 'Logged-in user is not a staff member.',
      };
    }

    // 2. Validate that the course is taught by this staff member
    const course = await this.dataSource.query(
      'SELECT 1 FROM Teach WHERE Staff_ID = ? AND Course_Code = ?',
      [staffId, course_code]
    );

    if (!course || course.length === 0) {
      return {
        success: false,
        message: 'Course not found or not assigned to this staff member.',
      };
    }

    // 3. Batch updates inside a Database Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const gradeEntry of grades) {
        const { student_id, grade } = gradeEntry;
        await queryRunner.query(
          'UPDATE Course_Enrollments SET Grade = ? WHERE Student_ID = ? AND Course_Code = ?',
          [grade, student_id, course_code]
        );
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Grades released successfully.',
        data: grades,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      return {
        success: false,
        message: error.message || 'An error occurred while updating grades.',
      };
    } finally {
      await queryRunner.release();
    }
  }
}