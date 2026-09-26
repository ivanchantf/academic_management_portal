import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';


import { AuthGuard } from '../auth/auth.guard.js';
import {  ReleaseGradesDto, TeachService } from './teach.service.js';

@Controller('teach')
export class TeachController {
  constructor(private  teachService: TeachService) {}

  


  @Get('/courses')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async getmyTeachCourses(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let courses= await this.teachService.getMyTeachingCourses(req.user);
    console.log('Courses:', courses); // Log the courses for debugging
    if(courses.length === 0){
      return {
        success: false,
        staff: []
    }
  }
    return {
      success: true,
      staff: courses,
    };
  }


@Post('release-grades')
  @UseGuards(AuthGuard)
  async releaseGrades(@Req() req: any, @Body() body: any) {
    // The service directly returns { success: boolean, message?: string, data?: any }
    return await this.teachService.releaseGrades(req.user?.User_ID, body);
  }

}