import { Controller, Get, Put, Req, UseGuards } from '@nestjs/common';

import {  ProfileService } from './profile.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('profile')
export class ProfileController {
  constructor(private  profileService: ProfileService) {}

  
  @Get('student')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async checkStudentProfile(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let profile = await this.profileService.checkStudentProfile(req.user);
    console.log('Profile:', profile); // Log the profile for debugging  
    return {
      success: true,
      profile: profile,
    };
  }

    @Get('staff')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async checkStaffProfile(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let profile = await this.profileService.checkStaffProfile(req.user);
    console.log('Profile:', profile); // Log the profile for debugging  
    return {
      success: true,
      profile: profile,
    };
  }

    @Put('student')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async updateStudentProfile(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let profile = await this.profileService.updateStudentProfile(req.user, req.body);
    console.log('Profile:', profile); // Log the profile for debugging  
    return {
      success: true,
      profile: profile,
    };
  }

      @Put('staff')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async updateStaffProfile(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let profile = await this.profileService.updateStaffProfile(req.user, req.body);
    console.log('Profile:', profile); // Log the profile for debugging  
    return {
      success: true,
      profile: profile,
    };
  }


}