INSERT INTO Departments (Name, Address, Phone_No,Photo_Path)
VALUES (
    'Department of Computer Science',
    '8/F, Academic Building, Main Campus',
    '+852 34117000',
	'dept/cs.jpg'
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
    '+852 91234567',
    'alex.wong@university.edu.hk',
    '+852 98765432',
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
    '+852 61239876',
    'taiman.chan@student.university.edu.hk',
    '+852 91230000',
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

INSERT INTO Departments (Name, Address, Phone_No, Photo_Path)
VALUES 
    ('Department of Business Administration', '6/F, Academic Building, Main Campus', '+852 34118000', 'dept/bus.jpg'),
    ('Department of Mathematics', '5/F, Academic Building, Main Campus', '+852 34119000', 'dept/math.jpg');
-- ----------------------------------------------------
-- 1. Insert into Programmes (Parent Table)
-- ----------------------------------------------------
INSERT INTO Programmes (Programme_Code, Title, Credits_Required, Status, DID) VALUES
('BS-CS', 'BSc in Computer Science', 120, 'ACTIVE', 1),
('BS-DS', 'BSc in Data Science', 120, 'ACTIVE', 1),
('BA-BUS', 'BBA in Business Administration', 120, 'ACTIVE', 2),
('BS-MATH', 'BSc in Mathematics', 120, 'ACTIVE', 3),
('MN-CS', 'Minor in Computer Science', 18, 'ACTIVE', 1),
('MN-MATH', 'Minor in Mathematics', 15, 'ACTIVE', 3),
('MN-MKT', 'Minor in Marketing', 18, 'ACTIVE', 2);

-- ----------------------------------------------------
-- 2. Insert into Major_Programmes (Child Table)
-- ----------------------------------------------------
INSERT INTO Major_Programmes (Programme_Code, Normative_Duration_Years, Max_Duration_Years, Degree_Awarded) VALUES
('BS-CS', 4, 6, 'Bachelor of Science in Computer Science'),
('BS-DS', 4, 6, 'Bachelor of Science in Data Science'),
('BA-BUS', 4, 6, 'Bachelor of Business Administration'),
('BS-MATH', 4, 6, 'Bachelor of Science in Mathematics');

-- ----------------------------------------------------
-- 3. Insert into Minor_Programmes (Child Table)
-- ----------------------------------------------------
INSERT INTO Minor_Programmes (Programme_Code) VALUES
('MN-CS'),
('MN-MATH'),
('MN-MKT');


-- ====================================================
-- 5 ADDITIONAL STAFF MEMBERS
-- ====================================================

-- Staff 1: Prof. Sarah Lee (Department of Computer Science - DID: 1)
INSERT INTO Users (
    Name, HKID, DOB, Address, Gender, Phone_No, Email, Emergency_Phone_No, Emergency_Contact_Person, Entry_DT, DID
) VALUES (
    'Prof. Sarah Lee', 'B234567(1)', '1980-08-22', 'Flat C, 18/F, Grand Horizon, Sha Tin, N.T.', 'Female', '+852 92345678',
    'sarah.lee@university.edu.hk', '+852 91112222', 'David Lee', '2018-01-15 09:00:00', 1
);

INSERT INTO Staffs (Office_No, Office_Address, User_ID) VALUES (
    'R6105', '6/F, Academic Building, Main Campus', (SELECT User_ID FROM Users WHERE HKID = 'B234567(1)')
);

INSERT INTO Accounts (Username, PasswordHash, User_ID) VALUES (
    'sarahlee', '$2b$10$l.8Y0Gxw4.bfqa/hzcmELu/8s8m0YuIRP1926G5T6qqUydjVJXoTO', (SELECT User_ID FROM Users WHERE HKID = 'B234567(1)')
);


-- Staff 2: Dr. David Cheung (Department of Business Administration - DID: 2)
INSERT INTO Users (
    Name, HKID, DOB, Address, Gender, Phone_No, Email, Emergency_Phone_No, Emergency_Contact_Person, Entry_DT, DID
) VALUES (
    'Dr. David Cheung', 'C345678(2)', '1976-12-05', 'House 12, Palm Springs, Yuen Long, N.T.', 'Male', '+852 93456789',
    'david.cheung@university.edu.hk', '+852 92223333', 'Grace Cheung', '2015-09-01 09:00:00', 2
);

INSERT INTO Staffs (Office_No, Office_Address, User_ID) VALUES (
    'R6208', '6/F, Academic Building, Main Campus', (SELECT User_ID FROM Users WHERE HKID = 'C345678(2)')
);

INSERT INTO Accounts (Username, PasswordHash, User_ID) VALUES (
    'davidcheung', '$2b$10$l.8Y0Gxw4.bfqa/hzcmELu/8s8m0YuIRP1926G5T6qqUydjVJXoTO', (SELECT User_ID FROM Users WHERE HKID = 'C345678(2)')
);


-- Staff 3: Dr. Emily Chan (Department of Mathematics - DID: 3)
INSERT INTO Users (
    Name, HKID, DOB, Address, Gender, Phone_No, Email, Emergency_Phone_No, Emergency_Contact_Person, Entry_DT, DID
) VALUES (
    'Dr. Emily Chan', 'D456789(3)', '1988-03-30', 'Flat A, 25/F, Tower 3, Laguna City, Kwun Tong, Kowloon', 'Female', '+852 94567890',
    'emily.chan@university.edu.hk', '+852 93334444', 'Peter Chan', '2020-08-25 09:00:00', 3
);

INSERT INTO Staffs (Office_No, Office_Address, User_ID) VALUES (
    'R5102', '5/F, Academic Building, Main Campus', (SELECT User_ID FROM Users WHERE HKID = 'D456789(3)')
);

INSERT INTO Accounts (Username, PasswordHash, User_ID) VALUES (
    'emilychan', '$2b$10$l.8Y0Gxw4.bfqa/hzcmELu/8s8m0YuIRP1926G5T6qqUydjVJXoTO', (SELECT User_ID FROM Users WHERE HKID = 'D456789(3)')
);


-- Staff 4: Prof. Michael Wong (Department of Computer Science - DID: 1)
INSERT INTO Users (
    Name, HKID, DOB, Address, Gender, Phone_No, Email, Emergency_Phone_No, Emergency_Contact_Person, Entry_DT, DID
) VALUES (
    'Prof. Michael Wong', 'E567890(4)', '1972-06-18', 'Flat D, 8/F, Taikoo Shing, Quarry Bay, Hong Kong', 'Male', '+852 95678901',
    'michael.wong@university.edu.hk', '+852 94445555', 'Helen Wong', '2010-09-01 09:00:00', 1
);

INSERT INTO Staffs (Office_No, Office_Address, User_ID) VALUES (
    'R6110', '6/F, Academic Building, Main Campus', (SELECT User_ID FROM Users WHERE HKID = 'E567890(4)')
);

INSERT INTO Accounts (Username, PasswordHash, User_ID) VALUES (
    'michaelwong', '$2b$10$l.8Y0Gxw4.bfqa/hzcmELu/8s8m0YuIRP1926G5T6qqUydjVJXoTO', (SELECT User_ID FROM Users WHERE HKID = 'E567890(4)')
);


-- Staff 5: Dr. Karen Ho (Department of Business Administration - DID: 2)
INSERT INTO Users (
    Name, HKID, DOB, Address, Gender, Phone_No, Email, Emergency_Phone_No, Emergency_Contact_Person, Entry_DT, DID
) VALUES (
    'Dr. Karen Ho', 'F678901(5)', '1983-11-02', 'Flat B, 15/F, Yoho Town, Yuen Long, N.T.', 'Female', '+852 96789012',
    'karen.ho@university.edu.hk', '+852 95556666', 'Simon Ho', '2022-01-10 09:00:00', 2
);

INSERT INTO Staffs (Office_No, Office_Address, User_ID) VALUES (
    'R6215', '6/F, Academic Building, Main Campus', (SELECT User_ID FROM Users WHERE HKID = 'F678901(5)')
);

INSERT INTO Accounts (Username, PasswordHash, User_ID) VALUES (
    'karenho', '$2b$10$l.8Y0Gxw4.bfqa/hzcmELu/8s8m0YuIRP1926G5T6qqUydjVJXoTO', (SELECT User_ID FROM Users WHERE HKID = 'F678901(5)')
);


-- ====================================================
-- 5 ADDITIONAL STUDENTS
-- ====================================================

-- Student 1: Lee Ching Yee (Department of Computer Science - DID: 1)
INSERT INTO Users (
    Name, HKID, DOB, Address, Gender, Phone_No, Email, Emergency_Phone_No, Emergency_Contact_Person, Entry_DT, DID
) VALUES (
    'Lee Ching Yee', 'Y123456(1)', '2003-02-14', 'Room 304, Block B, Student Residence, Kowloon', 'Female', '+852 62345678',
    'chingyee.lee@student.university.edu.hk', '+852 96667777', 'Lee Kwok Wah', '2024-09-01 09:00:00', 1
);

INSERT INTO Students (CGPA, User_ID) VALUES (
    0, (SELECT User_ID FROM Users WHERE HKID = 'Y123456(1)')
);

INSERT INTO Accounts (Username, PasswordHash, User_ID) VALUES (
    'cylee', '$2b$10$l.8Y0Gxw4.bfqa/hzcmELu/8s8m0YuIRP1926G5T6qqUydjVJXoTO', (SELECT User_ID FROM Users WHERE HKID = 'Y123456(1)')
);


-- Student 2: Wong Ka Ho (Department of Business Administration - DID: 2)
INSERT INTO Users (
    Name, HKID, DOB, Address, Gender, Phone_No, Email, Emergency_Phone_No, Emergency_Contact_Person, Entry_DT, DID
) VALUES (
    'Wong Ka Ho', 'Y234567(2)', '2002-07-09', 'Flat 12B, Mei Foo Sun Chuen, Lai Chi Kok, Kowloon', 'Male', '+852 63456789',
    'kaho.wong@student.university.edu.hk', '+852 97778888', 'Wong Chiu Ming', '2023-09-01 09:00:00', 2
);

INSERT INTO Students (CGPA, User_ID) VALUES (
    3.45, (SELECT User_ID FROM Users WHERE HKID = 'Y234567(2)')
);

INSERT INTO Accounts (Username, PasswordHash, User_ID) VALUES (
    'khwong', '$2b$10$l.8Y0Gxw4.bfqa/hzcmELu/8s8m0YuIRP1926G5T6qqUydjVJXoTO', (SELECT User_ID FROM Users WHERE HKID = 'Y234567(2)')
);


-- Student 3: Cheung Hoi Ching (Department of Mathematics - DID: 3)
INSERT INTO Users (
    Name, HKID, DOB, Address, Gender, Phone_No, Email, Emergency_Phone_No, Emergency_Contact_Person, Entry_DT, DID
) VALUES (
    'Cheung Hoi Ching', 'Y345678(3)', '2003-10-28', 'Flat E, 5/F, Amoy Gardens, Ngau Tau Kok, Kowloon', 'Female', '+852 64567890',
    'hoiching.cheung@student.university.edu.hk', '+852 98889999', 'Cheung Wai Keung', '2024-09-01 09:00:00', 3
);

INSERT INTO Students (CGPA, User_ID) VALUES (
    0, (SELECT User_ID FROM Users WHERE HKID = 'Y345678(3)')
);

INSERT INTO Accounts (Username, PasswordHash, User_ID) VALUES (
    'hccheung', '$2b$10$l.8Y0Gxw4.bfqa/hzcmELu/8s8m0YuIRP1926G5T6qqUydjVJXoTO', (SELECT User_ID FROM Users WHERE HKID = 'Y345678(3)')
);


-- Student 4: Lau Tsz Chun (Department of Computer Science - DID: 1)
INSERT INTO Users (
    Name, HKID, DOB, Address, Gender, Phone_No, Email, Emergency_Phone_No, Emergency_Contact_Person, Entry_DT, DID
) VALUES (
    'Lau Tsz Chun', 'Y456789(4)', '2001-05-04', 'Room 1201, Heng On Estate, Ma On Shan, N.T.', 'Male', '+852 65678901',
    'tszchun.lau@student.university.edu.hk', '+852 99990000', 'Lau Man Shing', '2022-09-01 09:00:00', 1
);

INSERT INTO Students (CGPA, User_ID) VALUES (
    3.82, (SELECT User_ID FROM Users WHERE HKID = 'Y456789(4)')
);

INSERT INTO Accounts (Username, PasswordHash, User_ID) VALUES (
    'tclau', '$2b$10$l.8Y0Gxw4.bfqa/hzcmELu/8s8m0YuIRP1926G5T6qqUydjVJXoTO', (SELECT User_ID FROM Users WHERE HKID = 'Y456789(4)')
);


-- Student 5: Mak Wing Yan (Department of Business Administration - DID: 2)
INSERT INTO Users (
    Name, HKID, DOB, Address, Gender, Phone_No, Email, Emergency_Phone_No, Emergency_Contact_Person, Entry_DT, DID
) VALUES (
    'Mak Wing Yan', 'Y567890(5)', '2002-12-19', 'Flat 8C, Whampoa Garden, Hung Hom, Kowloon', 'Female', '+852 66789012',
    'wingyan.mak@student.university.edu.hk', '+852 90001111', 'Mak Chi Kin', '2023-09-01 09:00:00', 2
);

INSERT INTO Students (CGPA, User_ID) VALUES (
    3.10, (SELECT User_ID FROM Users WHERE HKID = 'Y567890(5)')
);

INSERT INTO Accounts (Username, PasswordHash, User_ID) VALUES (
    'wymak', '$2b$10$l.8Y0Gxw4.bfqa/hzcmELu/8s8m0YuIRP1926G5T6qqUydjVJXoTO', (SELECT User_ID FROM Users WHERE HKID = 'Y567890(5)')
);

