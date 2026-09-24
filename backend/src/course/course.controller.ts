import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';


import { AuthGuard } from '../auth/auth.guard.js';
import { CourseService } from './course.service.js';

@Controller('course')
export class CourseController {
  constructor(private  courseService: CourseService) {}

  
  @Post('/create')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async createCourse(@Req() req: any,@Body() body: any) {
    // req.user is automatically populated by AuthGuard
    let course= await this.courseService.createCourse(req.user,body);
    console.log('Course:', course); // Log the course for debugging
    if(!course){
      return {
        success: false
    }
  }
    return {
      success: true,
      course: course,
    };
  }



  @Get('/list')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async listCourses(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let c= await this.courseService.listCourses();
    console.log('Courses:', c); // Log the department for debugging
    if(c.length === 0){
      return {
        success: false,
        courses: []
    }
  }
    return {
      success: true,
      courses: c,
    };
  }



  @Put('/update')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async updateCourse(@Req() req: any,@Body() body: any) {
    // req.user is automatically populated by AuthGuard
    let course= await this.courseService.updateCourse(req.user,body);
    console.log('Course is :', course); // Log the course for debugging
   
    return course;
  }




    @Get('/get-teacher/:courseCode')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async getTeacher(@Req() req: any,@Param('courseCode') courseCode: string) {
    // req.user is automatically populated by AuthGuard
    let teacher= await this.courseService.getTeacher(courseCode);
    console.log('teacher:', teacher); // Log the department for debugging
    if(teacher.length === 0){
      return {
        success: false,
        teachers: []
    }
  }
    return {
      success: true,
      teachers: teacher,
    };
  }
  @Post('/assign-teachers')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async assignTeachers(@Req() req: any,@Body() body: any) {
    // req.user is automatically populated by AuthGuard
    let insert= await this.courseService.assignTeachers(req.user,body);
    console.log('insert:', insert); // Log the course for debugging
    
    return {
      success: true,
      teachers: insert,
    };
  }

  @Get('/get-courses-catalog')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async getCoursesCatalog(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let courses = await this.courseService.getCoursesCatalog();
    console.log('Courses Catalog:', courses); // Log the courses for debugging
    if (courses.length === 0) {
      return {
        success: false,
        courses: []
      };
    }
    return {
      success: true,
      courses: courses,
    };
  }

}