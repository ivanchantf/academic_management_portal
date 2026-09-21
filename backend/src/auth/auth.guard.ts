import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request:any = context.switchToHttp().getRequest<Request>();
    
    // 1. Read token from the incoming HTTP cookie
    const token = request.cookies?.['amp_access_token'];

    if (!token) {
      throw new UnauthorizedException('Access denied. No token provided.');
    }

    try {
      // 2. Verify token signature & expiration
      const payload = await this.jwtService.verifyAsync(token,{secret: process.env.JWT_SECRET||'amp_secret'});
      
      // 3. Attach user payload to the request object for controllers to use
      request['user'] = payload;

    } catch {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    return true;
  }
}