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
  
 async createAccount(user: any, accountData: {address: string, department: string, dob: string, email: string, emergencyContactPerson: string, emergencyPhoneNo: string, entryDt: string, gender: string, hkid: string, name: string, password: string, phoneNo: string, userType: string, username: string, officeAddress: string, officeNo: string}) {
  // Check if the user has the 'Staff' role
  if (user.UserType !== 'Staff') {
    return { success: false, message: 'Unauthorized: Only staff can create accounts' };
  }

  const {
    address,
    department,
    dob,
    email,
    emergencyContactPerson,
    emergencyPhoneNo,
    entryDt,
    gender,
    hkid,
    name,
    password,
    phoneNo,
    userType,
    username,
    officeAddress,
    officeNo
  } = accountData;

  // Check if the username already exists (performed outside transaction to avoid unnecessary locks)
  const existingAccount = await this.dataSource.query(`SELECT * FROM Accounts WHERE Username = ?;`, [username]);
  if (existingAccount.length > 0) {
    return { success: false, message: 'Username already exists' };
  }

  const hashedPassword = await this.hashPassword(password);

  // Initialize QueryRunner for transaction management
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Insert into Users table
    const newUser = await queryRunner.query(
      `INSERT INTO Users (Name, HKID, DOB, Address, Gender, Phone_No, Email, Emergency_Contact_Person, Emergency_Phone_No, Entry_DT, DID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [name, hkid, dob, address, gender, phoneNo, email, emergencyContactPerson, emergencyPhoneNo, entryDt, department]
    );
    console.log('New user created with ID:', newUser);
    const newUserId = newUser;

    // 2. Insert into Students or Staffs table based on userType
    if (userType === 'Student') {
      await queryRunner.query(
        `INSERT INTO Students (User_ID) VALUES (?)`, 
        [newUserId]
      );
    } else if (userType === 'Staff') {
      await queryRunner.query(
        `INSERT INTO Staffs (User_ID, Office_No, Office_Address) VALUES (?, ?, ?)`, 
        [newUserId, officeNo, officeAddress]
      );
    }

    // 3. Insert into Accounts table
    await queryRunner.query(
      `INSERT INTO Accounts (User_ID, Username, PasswordHash) VALUES (?, ?, ?)`, 
      [newUserId, username, hashedPassword]
    );

    // Commit all operations if everything succeeded
    await queryRunner.commitTransaction();
    return { success: true, message: 'Account created successfully' };

  } catch (error:any) {
    // Roll back all operations if any insert failed
    await queryRunner.rollbackTransaction();
    return { success: false, message: 'Failed to create account due to an error: ' + error.message };

  } finally {
    // Always release the QueryRunner back to the connection pool
    await queryRunner.release();
  }
}

async listAccounts(user: any) {
  // Check if the user has the 'Staff' role
  if (user.UserType !== 'Staff') {
    return { success: false, message: 'Unauthorized: Only staff can list accounts' };
  }
  // If the user is a staff member, proceed to list the accounts
  let query = await this.dataSource.query(`SELECT 

    Accounts.*,
    Users.*,
    CASE 
        WHEN Staffs.Staff_ID IS NOT NULL THEN 'Staff'
        WHEN Students.Student_ID IS NOT NULL THEN 'Student'
        ELSE 'Unknown'
    END AS userType,
    Staffs.Staff_ID,
    Staffs.Office_No,
    Staffs.Office_Address,
    Students.Student_ID,
    Students.CGPA

FROM Accounts
JOIN Users 
    ON Accounts.User_ID = Users.User_ID
LEFT JOIN Staffs 
    ON Users.User_ID = Staffs.User_ID
LEFT JOIN Students 
    ON Users.User_ID = Students.User_ID;`);

  return query;
}
}