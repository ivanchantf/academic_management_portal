-- SQLite Database Schema Definition
-- Enable Foreign Key constraints support in SQLite
PRAGMA foreign_keys = ON;

-- 1. Departments
CREATE TABLE IF NOT EXISTS Departments (
    DID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Address TEXT,
    Phone_No TEXT,
	Photo_Path TEXT
);

-- 2. Users
CREATE TABLE IF NOT EXISTS Users (
    User_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    HKID TEXT NOT NULL UNIQUE,
    DOB TEXT,
    Address TEXT,
    Gender TEXT,
    Phone_No TEXT,
    Email TEXT UNIQUE,
    Emergency_Phone_No TEXT,
    Emergency_Contact_Person TEXT,
    Entry_DT TEXT NOT NULL,
    DID INTEGER,
    FOREIGN KEY (DID) REFERENCES Departments(DID) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 3. Accounts
CREATE TABLE IF NOT EXISTS Accounts (
    Username TEXT PRIMARY KEY,
    PasswordHash TEXT NOT NULL,
    User_ID INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Students
CREATE TABLE IF NOT EXISTS Students (
    Student_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    CGPA REAL DEFAULT 0.0 CHECK (CGPA >= 0.0 AND CGPA <= 4.3),
    User_ID INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Staffs
CREATE TABLE IF NOT EXISTS Staffs (
    Staff_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Office_No TEXT,
    Office_Address TEXT,
    User_ID INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. Qualifications_Category
CREATE TABLE IF NOT EXISTS Qualifications_Category (
    Type_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Category_Name TEXT NOT NULL,
    Level TEXT
);

-- 7. Qualifications
CREATE TABLE IF NOT EXISTS Qualifications (
    Qualification_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    Organization TEXT,
    Obtained_DT TEXT,
    Holder_Staff_ID INTEGER NOT NULL,
    Qualification_Type_ID INTEGER NOT NULL,
    FOREIGN KEY (Holder_Staff_ID) REFERENCES Staffs(Staff_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Qualification_Type_ID) REFERENCES Qualifications_Category(Type_ID) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 8. Programmes
CREATE TABLE IF NOT EXISTS Programmes (
    Programme_Code TEXT PRIMARY KEY,
    Title TEXT NOT NULL,
    Credits_Required INTEGER NOT NULL CHECK (Credits_Required > 0),
    Status TEXT DEFAULT 'Active',
    DID INTEGER NOT NULL,
    FOREIGN KEY (DID) REFERENCES Departments(DID) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 9. Major_Programmes
CREATE TABLE IF NOT EXISTS Major_Programmes (
    Programme_Code TEXT PRIMARY KEY,
    Normative_Duration_Years INTEGER CHECK (Normative_Duration_Years > 0),
    Max_Duration_Years INTEGER CHECK (Max_Duration_Years >= Normative_Duration_Years),
    Degree_Awarded TEXT NOT NULL,
    FOREIGN KEY (Programme_Code) REFERENCES Programmes(Programme_Code) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 10. Minor_Programmes
CREATE TABLE IF NOT EXISTS Minor_Programmes (
    Programme_Code TEXT PRIMARY KEY,
    FOREIGN KEY (Programme_Code) REFERENCES Programmes(Programme_Code) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 11. Courses
CREATE TABLE IF NOT EXISTS Courses (
    Course_Code TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
	Description TEXT,
    Difficulty TEXT,
    Credits INTEGER NOT NULL CHECK (Credits > 0),
    Status TEXT DEFAULT 'Active',
    Created_DT TEXT NOT NULL,
    Created_Staff_ID INTEGER,
	Updated_DT TEXT ,
    Updated_Staff_ID INTEGER,
    Offered_DID INTEGER NOT NULL,
    FOREIGN KEY (Created_Staff_ID) REFERENCES Staffs(Staff_ID) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (Offered_DID) REFERENCES Departments(DID) ON DELETE RESTRICT ON UPDATE CASCADE
	FOREIGN KEY (Updated_Staff_ID) REFERENCES Staffs(Staff_ID) ON DELETE SET NULL ON UPDATE CASCADE
	);

-- 12. Credit_Overload_Requests
CREATE TABLE IF NOT EXISTS Credit_Overload_Requests (
    Request_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Reason TEXT,
    Status TEXT DEFAULT 'Pending',
    Submit_DT TEXT NOT NULL,
    Process_DT TEXT,
    Submitted_Student_ID INTEGER NOT NULL,
    Processed_Staff_ID INTEGER,
    FOREIGN KEY (Submitted_Student_ID) REFERENCES Students(Student_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Processed_Staff_ID) REFERENCES Staffs(Staff_ID) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 13. Mitigation_Requests
CREATE TABLE IF NOT EXISTS Mitigation_Requests (
    Request_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Date_Of_Assessment TEXT NOT NULL,
    Reason TEXT,
    Status TEXT DEFAULT 'Pending',
    Affecting_Course_Code TEXT NOT NULL,
    Submit_DT TEXT NOT NULL,
    Process_DT TEXT,
    Submitted_Student_ID INTEGER NOT NULL,
    Processed_Staff_ID INTEGER,
    FOREIGN KEY (Affecting_Course_Code) REFERENCES Courses(Course_Code) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (Submitted_Student_ID) REFERENCES Students(Student_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Processed_Staff_ID) REFERENCES Staffs(Staff_ID) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 14. Time_Tickets
CREATE TABLE IF NOT EXISTS Time_Tickets (
    Ticket_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    From_DT TEXT NOT NULL,
    To_DT TEXT NOT NULL,
    Holder_Student_ID INTEGER NOT NULL,
    Issued_DT TEXT NOT NULL,
    Issued_Staff_ID INTEGER,
    FOREIGN KEY (Holder_Student_ID) REFERENCES Students(Student_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Issued_Staff_ID) REFERENCES Staffs(Staff_ID) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 15. Teach (Junction Table)
CREATE TABLE IF NOT EXISTS Teach (
    Staff_ID INTEGER,
    Course_Code TEXT,
    PRIMARY KEY (Staff_ID, Course_Code),
    FOREIGN KEY (Staff_ID) REFERENCES Staffs(Staff_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Course_Code) REFERENCES Courses(Course_Code) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 16. Course_Enrollments (Junction Table)
CREATE TABLE IF NOT EXISTS Course_Enrollments (
    Student_ID INTEGER,
    Course_Code TEXT,
    Enroll_DT TEXT NOT NULL,
    Grade TEXT,
    PRIMARY KEY (Student_ID, Course_Code),
    FOREIGN KEY (Student_ID) REFERENCES Students(Student_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Course_Code) REFERENCES Courses(Course_Code) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 17. Programme_Major_Enrollments (Junction Table)


CREATE TABLE IF NOT EXISTS Programme_Major_Enrollments (
    Student_ID INTEGER,
    Programme_Code TEXT,
    Enroll_DT TEXT NOT NULL,
    Status TEXT DEFAULT 'Enrolled',
    PRIMARY KEY (Student_ID, Programme_Code),
    FOREIGN KEY (Student_ID) REFERENCES Students(Student_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Programme_Code) REFERENCES Major_Programmes(Programme_Code) ON DELETE CASCADE ON UPDATE CASCADE
);
-- 17B. Programme_Minor_Enrollments (Junction Table)

CREATE TABLE IF NOT EXISTS Programme_Minor_Enrollments (
    Student_ID INTEGER,
    Programme_Code TEXT,
    Enroll_DT TEXT NOT NULL,
    Status TEXT DEFAULT 'Enrolled',
    PRIMARY KEY (Student_ID, Programme_Code),
    FOREIGN KEY (Student_ID) REFERENCES Students(Student_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Programme_Code) REFERENCES Minor_Programmes(Programme_Code) ON DELETE CASCADE ON UPDATE CASCADE
);
-- 18. Major_Programmes_Courses (Junction Table)
CREATE TABLE IF NOT EXISTS Major_Programmes_Courses (
    Programme_Code TEXT,
    Course_Code TEXT,
    PRIMARY KEY (Programme_Code, Course_Code),
    FOREIGN KEY (Programme_Code) REFERENCES Major_Programmes(Programme_Code) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Course_Code) REFERENCES Courses(Course_Code) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 19. Minor_Programmes_Courses (Junction Table)
CREATE TABLE IF NOT EXISTS Minor_Programmes_Courses (
    Programme_Code TEXT,
    Course_Code TEXT,
    PRIMARY KEY (Programme_Code, Course_Code),
    FOREIGN KEY (Programme_Code) REFERENCES Minor_Programmes(Programme_Code) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Course_Code) REFERENCES Courses(Course_Code) ON DELETE CASCADE ON UPDATE CASCADE
);