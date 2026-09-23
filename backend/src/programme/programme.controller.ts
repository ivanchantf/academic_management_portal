import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';


import { AuthGuard } from '../auth/auth.guard.js';
import {  ProgrammeService } from './programme.service.js';

@Controller('programme')
export class ProgrammeController {
  constructor(private  programmeService: ProgrammeService) {}

  
  @Get('all-major-programmes')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async getMajProgramme(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let prog= await this.programmeService.getAllMajorProgramme();

    console.log('Programme:', prog); // Log the programme for debugging
    return {
      success: true,
      programme: prog,
    };
  }


    @Get('all-minor-programmes')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async getMinProgramme(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let prog= await this.programmeService.getAllMinorProgramme();

    console.log('Programme:', prog); // Log the programme for debugging
    return {
      success: true,
      programme: prog,
    };
  }


  @Post('/create')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async createProgamme(@Req() req: any,@Body() body: any) {
    // req.user is automatically populated by AuthGuard
    let p= await this.programmeService.createProgramme(req.user,body);
    console.log('create Programme result:', p); // Log the programme for debugging
 
    return p;
  }



}