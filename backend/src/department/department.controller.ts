import { Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';


import { AuthGuard } from '../auth/auth.guard.js';
import { DepartmentService } from './department.service.js';

@Controller('department')
export class DepartmentController {
  constructor(private  departmentService: DepartmentService) {}

  
  @Get('/id/:did')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async checkDept(@Req() req: any,@Param('did') did: string) {
    // req.user is automatically populated by AuthGuard
    let dept= await this.departmentService.checkDepartment(did);
    console.log('Department:', dept); // Log the department for debugging
    if(!dept){
      return {
        success: false
    }
  }
    return {
      success: true,
      department: dept,
    };
  }

  @Get('/list')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async listDept(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let dept= await this.departmentService.listDepartments();
    console.log('Department:', dept); // Log the department for debugging
    if(dept.length === 0){
      return {
        success: false,
        department: []
    }
  }
    return {
      success: true,
      department: dept,
    };
  }



}