import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import {type Response } from 'express';
import { AuthGuard } from './auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private  authService:AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { username: string; password: string }, @Res({ passthrough: true }) response: Response) {
    // Await the asynchronous login execution from AuthService
    const result = await this.authService.login(body.username, body.password);

    if (!result.success) {

      return{
        success:false,
        message: result.message,
      }
    }

    response.cookie('amp_access_token', result.token, {
      maxAge: 1000 * 60 * 60 * 24, // 1 day in milliseconds
      path: '/',
    });

    return {
      message: 'Login successful',
      success: true,
      user: result.user,
      token: result.token,
    };
  }


  



// --- LOGOUT ENDPOINT ---
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    // Clear the cookie by setting path to match the login cookie configuration
    response.clearCookie('amp_access_token', {
      path: '/',
    });

    return {
      success: true,
      message: 'Logout successful',
    };
  }



  @Post('change-password')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async changePassword(@Req() req: any,@Body() passwordBody:{newPassword:string,oldPassword:string}) {
    // req.user is automatically populated by AuthGuard
    let res = await this.authService.changePassword(req.user,passwordBody.oldPassword,passwordBody.newPassword);
   return res
  }

  // --- CHECK IDENTITY ENDPOINT ---
  @Get('check-identity')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async checkIdentity(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    return {
      success: true,
      user: req.user,
    };
  }


    @Post('create-account')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async createAccount(@Req() req: any,@Body() accountBody:{address: string, department: string, dob: string, email: string, emergencyContactPerson: string, emergencyPhoneNo: string, entryDt: string, gender: string, hkid: string, name: string, password: string, phoneNo: string, userType: string, username: string, officeAddress: string, officeNo: string}) {
    // req.user is automatically populated by AuthGuard
    let res = await this.authService.createAccount(req.user,accountBody);
    console.log('Create Account Result:', res); // Log the result for debugging
   return res
  }



  @Get('list-accounts')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async listAccounts(@Req() req: any) {
    // req.user is automatically populated by AuthGuard

    let accounts = await this.authService.listAccounts(req.user);
    if (!accounts) {
      return {
        success: false,
        message: 'Failed to list accounts',
      };
    }
    return {
      success: true,
      accounts: accounts,
    };
  }


}