import { Injectable, OnModuleInit, Req } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService  {

  constructor(private dataSource: DataSource, private jwtService: JwtService) {}
  private readonly saltRounds = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
  async comparePassword(password: string, hash: string): Promise<boolean> {
      return bcrypt.compare(password, hash);
    }
  // Execute raw SQL
  async login(username: string, password: string) {
    let result;
    let hashedPassword = await this.hashPassword(password);

    let account = await this.dataSource.query(`SELECT 
    Accounts.*, 
    Users.*,
    Departments.Name AS DepartmentName,
    Departments.Address AS DepartmentAddress,
    CASE 
        WHEN Staffs.User_ID IS NOT NULL THEN 'Staff'
        WHEN Students.User_ID IS NOT NULL THEN 'Student'
        ELSE 'Unknown' 
    END AS UserType
FROM Accounts 
JOIN Users ON Accounts.User_ID = Users.User_ID
LEFT JOIN Staffs ON Users.User_ID = Staffs.User_ID
LEFT JOIN Students ON Users.User_ID = Students.User_ID
LEFT JOIN Departments ON Users.DID=Departments.DID
WHERE Accounts.Username = ?;`, [username])
    console.log(account)
    if (account.length === 0) {
      return { success: false, message: 'User not found' };
    }
    if(!await this.comparePassword(password, account[0].PasswordHash)){
      return { success: false, message: 'Incorrect password' };
    }
    console.log('Login successful for user:', username);

    const { PasswordHash, ...userWithoutPassword } = account[0];

    let token= this.jwtService.sign({ ...userWithoutPassword },{
      secret: process.env.JWT_SECRET||'amp_secret', // Use the secret from environment variables or a default value
      expiresIn: '1d', // Token expires in 1 day
    });

    return { success: true, user: userWithoutPassword, token };
  }

  async changePassword(user: any, oldPassword: string, newPassword: string) {
    console.log('change password is called')
    console.log(user)
    let account = await this.dataSource.query(`SELECT * FROM Accounts WHERE Accounts.Username = ?;`, [user.Username])
    if(!await this.comparePassword(oldPassword,account[0].PasswordHash )){
      return{success:false,message:'Incorrect password'};
    }
    let hashedPassword=await this.hashPassword(newPassword);
    let res= await this.dataSource.query(`UPDATE Accounts SET PasswordHash=? WHERE Username=?;`, [hashedPassword, user.Username])
    return{success:true,message:'Password changed successfully'};
  }
  
}