import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';


import { AuthGuard } from '../auth/auth.guard.js';
import { TimeticketService } from './timeticket.service.js';


@Controller('timeticket')
export class TimeticketController {
  constructor(private  timeticketService: TimeticketService) {}

@Post('/issue')
@UseGuards(AuthGuard) // Blocks request if not logged in
async issueTimeTicket(@Req() req: any, @Body() body: any) {
  try {
    const issuedStudentIds = await this.timeticketService.issue(req.user, body);

    return {
      success: true,
      issuedCount: issuedStudentIds.length,
      studentIds: issuedStudentIds,
    };
  } catch (error: any) {
    // Catch errors thrown by the service (e.g. staff record missing)
    return {
      success: false,
      message: error.message || 'Failed to issue time tickets',
    };
  }
}

@Delete('/delete-all')
  @UseGuards(AuthGuard)
  async deleteAllTimeTickets() {
    try {
      await this.timeticketService.deleteAll();

      return {
        success: true,
        message: 'All time tickets deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete time tickets',
      };
    }
  }

}