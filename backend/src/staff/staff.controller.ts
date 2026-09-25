import { Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';


import { AuthGuard } from '../auth/auth.guard.js';
import { StaffService } from './staff.service.js';

@Controller('staff')
export class StaffController {
  constructor(private  staffService: StaffService) {}

  


  @Get('/list')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async listStaff(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let staff= await this.staffService.listStaffs();
    console.log('Staff:', staff); // Log the staff for debugging
    if(staff.length === 0){
      return {
        success: false,
        staff: []
    }
  }
    return {
      success: true,
      staff: staff,
    };
  }



}