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





}