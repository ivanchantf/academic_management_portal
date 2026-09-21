INSERT INTO Departments (Name, Address, Phone_No)
VALUES (
    'Department of Computer Science',
    '8/F, Academic Building, Main Campus',
    '+852 3411 7000'
);
--------------DEMO staff
INSERT INTO Users (
    Name, 
    HKID, 
    DOB, 
    Address, 
    Gender, 
    Phone_No, 
    Email, 
    Emergency_Phone_No, 
    Emergency_Contact_Person, 
    Entry_DT, 
    DID
) VALUES (
    'Dr. Alex Wong',
    'A123456(7)',
    '1985-04-12',
    'Flat B, 12/F, Tower 1, Shatin, N.T.',
    'Male',
    '+852 9123 4567',
    'alex.wong@university.edu.hk',
    '+852 9876 5432',
    'Mary Wong',
    '2021-09-01 09:00:00',
    1
);

INSERT INTO Staffs (
    Office_No, 
    Office_Address, 
    User_ID
) VALUES (
    'R6102',
    '6/F, Academic Building, Main Campus',
    (SELECT User_ID FROM Users WHERE HKID = 'A123456(7)')
);

INSERT INTO Accounts (
    Username, 
    PasswordHash, 
    User_ID
) VALUES (
    'alexwong',
    '$2b$10$KmVFVamap9j0Ek1DwKtdHOKbmG55CzZz8fPXYmgv1Wibz7pDz91aW', --alexwong123!
    (SELECT User_ID FROM Users WHERE HKID = 'A123456(7)')
);

--------------DEMO  student
INSERT INTO Users (
    Name,
    HKID,
    DOB,
    Address,
    Gender,
    Phone_No,
    Email,
    Emergency_Phone_No,
    Emergency_Contact_Person,
    Entry_DT,
    DID
) VALUES (
    'Chan Tai Man',
    'Z876543(2)',
    '2002-11-15',
    'Room 802, Block A, Student Residence, Kowloon',
    'Male',
    '+852 6123 9876',
    'taiman.chan@student.university.edu.hk',
    '+852 9123 0000',
    'Chan Wai Man',
    '2024-09-01 09:00:00',
    1  
);


INSERT INTO Students (
    CGPA,
    User_ID
) VALUES (
    0,
    (SELECT User_ID FROM Users WHERE HKID = 'Z876543(2)')
);


INSERT INTO Accounts (
    Username,
    PasswordHash,
    User_ID
) VALUES (
    'tmchan',
    '$2b$10$l.8Y0Gxw4.bfqa/hzcmELu/8s8m0YuIRP1926G5T6qqUydjVJXoTO', --tmchan123!
    (SELECT User_ID FROM Users WHERE HKID = 'Z876543(2)')
);


