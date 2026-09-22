import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';


import { AuthGuard } from '../auth/auth.guard.js';
import { EnrollmentService } from './enrollment..service.js';

@Controller('enrollment')
export class EnrollmentController {
  constructor(private enrollmentService: EnrollmentService) { }


  @Get('student-not-enroll-major')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async getStudentNotEnrollMajor(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    console.log('User:', req.user);
    let students = await this.enrollmentService.getStudentNotEnrollMajor();


    return {
      success: true,
      students: students,
    };
  }



  @Get('student-not-enroll-minor')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async getStudentNotEnrollMinor(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    console.log('User:', req.user);
    let students = await this.enrollmentService.getStudentNotEnrollMinor();


    return {
      success: true,
      students: students,
    };
  }
  @Post('assign-major')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async assignMajor(@Req() req: any, @Body() body: { studentId: string; majorId: string }) {
    // req.user is automatically populated by AuthGuard
    console.log('User:', req.user);
    let enroll = await this.enrollmentService.assignMajor(body.studentId, body.majorId);


    return {
      success: true,
      enrollment: enroll,
    };
  }
  @Post('assign-minor')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async assignMinor(@Req() req: any, @Body() body: { studentId: string; minorId: string }) {
    // req.user is automatically populated by AuthGuard
    console.log('User:', req.user);
    let enroll = await this.enrollmentService.assignMinor(body.studentId, body.minorId);
    if (!enroll) {
      return {
        success: false,
        message: 'Student has no major enrollment',
      };
    }

    return {
      success: true,
      enrollment: enroll,
    };
  }

}