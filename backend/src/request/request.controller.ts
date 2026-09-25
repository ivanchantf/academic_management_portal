import { Body, Controller, Get, Param, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';


import { AuthGuard } from '../auth/auth.guard.js';
import { RequestService } from './request.service.js';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/index.js';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
export class SubmitMitigationDto {
  requestType: string;
  assessmentDate: string;
  reason: string;
  courseCode: string;
}
@Controller('request')
export class RequestController {
  constructor(private requestService: RequestService) { }





  @Post('/submit-mitigation')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  @UseInterceptors(
    FileInterceptor('supportingDocument', {
      storage: diskStorage({
        // Define the target directory relative to the process execution root
        destination: './uploads/mitigation',

        // Custom filename generation to prevent file overwrites
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
    }),
  )
  async submitMitigation(@Req() req: any, @Body() body: SubmitMitigationDto,
    @UploadedFile() file?: any) {
    // Output: { requestType: 'MITIGATION', assessmentDate: '2010-10-10', reason: 'sick', courseCode: 'CS101' }
    console.log('Request Body:', body);
    console.log('Uploaded File:', file?.path);

    let res = await this.requestService.submitMitigationRequest(req.user, body.assessmentDate, body.reason, body.courseCode, file?.path.replaceAll('\\', '/'));

    return res;
  }



    @Get('/my-mitigation')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async getMyMitigationRequests(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let requests= await this.requestService.getMyMitigationRequests(req.user);

    if(requests.length === 0){
      return {
        success: false,
        requests: []
    }
  }
    return {
      success: true,
     requests: requests,
    };
  }


  


  @Post('/submit-overload')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  @UseInterceptors(
    FileInterceptor('supportingDocument', {
      storage: diskStorage({
        // Define the target directory relative to the process execution root
        destination: './uploads/overload',

        // Custom filename generation to prevent file overwrites
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
    }),
  )
  async submitOverload(@Req() req: any, @Body() body: SubmitMitigationDto,
    @UploadedFile() file?: any) {
    // Output: { requestType: 'OVERLOAD',reason: 'sick'}
    console.log('Request Body:', body);
    console.log('Uploaded File:', file?.path);

    let res = await this.requestService.submitOverloadRequest(req.user, body.reason,  file?.path.replaceAll('\\', '/'));

    return res;
  }



    @Get('/my-overload')
  @UseGuards(AuthGuard) // Blocks request if not logged in
  async getMyOverloadRequests(@Req() req: any) {
    // req.user is automatically populated by AuthGuard
    let requests= await this.requestService.getMyOverloadRequests(req.user);

    if(requests.length === 0){
      return {
        success: false,
        requests: []
    }
  }
    return {
      success: true,
     requests: requests,
    };
  }
}