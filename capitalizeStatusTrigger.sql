--1. Courses
-- Trigger on INSERT
CREATE TRIGGER IF NOT EXISTS trg_courses_status_insert
AFTER INSERT ON Courses
FOR EACH ROW
BEGIN
    UPDATE Courses 
    SET Status = UPPER(NEW.Status) 
    WHERE Course_Code = NEW.Course_Code;
END;

-- Trigger on UPDATE
CREATE TRIGGER IF NOT EXISTS trg_courses_status_update
AFTER UPDATE OF Status ON Courses
FOR EACH ROW
BEGIN
    UPDATE Courses 
    SET Status = UPPER(NEW.Status) 
    WHERE Course_Code = NEW.Course_Code;
END;



--2. Credit_Overload_Requests
-- Trigger on INSERT
CREATE TRIGGER IF NOT EXISTS trg_credit_overload_status_insert
AFTER INSERT ON Credit_Overload_Requests
FOR EACH ROW
BEGIN
    UPDATE Credit_Overload_Requests 
    SET Status = UPPER(NEW.Status) 
    WHERE Request_ID = NEW.Request_ID;
END;

-- Trigger on UPDATE
CREATE TRIGGER IF NOT EXISTS trg_credit_overload_status_update
AFTER UPDATE OF Status ON Credit_Overload_Requests
FOR EACH ROW
BEGIN
    UPDATE Credit_Overload_Requests 
    SET Status = UPPER(NEW.Status) 
    WHERE Request_ID = NEW.Request_ID;
END;

--3. Mitigation_Requests
-- Trigger on INSERT
CREATE TRIGGER IF NOT EXISTS trg_mitigation_requests_status_insert
AFTER INSERT ON Mitigation_Requests
FOR EACH ROW
BEGIN
    UPDATE Mitigation_Requests 
    SET Status = UPPER(NEW.Status) 
    WHERE Request_ID = NEW.Request_ID;
END;

-- Trigger on UPDATE
CREATE TRIGGER IF NOT EXISTS trg_mitigation_requests_status_update
AFTER UPDATE OF Status ON Mitigation_Requests
FOR EACH ROW
BEGIN
    UPDATE Mitigation_Requests 
    SET Status = UPPER(NEW.Status) 
    WHERE Request_ID = NEW.Request_ID;
END;

--4. Programme_Major_Enrollments
-- Trigger on INSERT
CREATE TRIGGER IF NOT EXISTS trg_major_enrollments_status_insert
AFTER INSERT ON Programme_Major_Enrollments
FOR EACH ROW
BEGIN
    UPDATE Programme_Major_Enrollments 
    SET Status = UPPER(NEW.Status) 
    WHERE Student_ID = NEW.Student_ID 
      AND Programme_Code = NEW.Programme_Code;
END;

-- Trigger on UPDATE
CREATE TRIGGER IF NOT EXISTS trg_major_enrollments_status_update
AFTER UPDATE OF Status ON Programme_Major_Enrollments
FOR EACH ROW
BEGIN
    UPDATE Programme_Major_Enrollments 
    SET Status = UPPER(NEW.Status) 
    WHERE Student_ID = NEW.Student_ID 
      AND Programme_Code = NEW.Programme_Code;
END;

--5. Programme_Minor_Enrollments
-- Trigger on INSERT
CREATE TRIGGER IF NOT EXISTS trg_minor_enrollments_status_insert
AFTER INSERT ON Programme_Minor_Enrollments
FOR EACH ROW
BEGIN
    UPDATE Programme_Minor_Enrollments 
    SET Status = UPPER(NEW.Status) 
    WHERE Student_ID = NEW.Student_ID 
      AND Programme_Code = NEW.Programme_Code;
END;

-- Trigger on UPDATE
CREATE TRIGGER IF NOT EXISTS trg_minor_enrollments_status_update
AFTER UPDATE OF Status ON Programme_Minor_Enrollments
FOR EACH ROW
BEGIN
    UPDATE Programme_Minor_Enrollments 
    SET Status = UPPER(NEW.Status) 
    WHERE Student_ID = NEW.Student_ID 
      AND Programme_Code = NEW.Programme_Code;
END;

--6. Programmes
-- Trigger on INSERT
CREATE TRIGGER IF NOT EXISTS trg_programmes_status_insert
AFTER INSERT ON Programmes
FOR EACH ROW
BEGIN
    UPDATE Programmes 
    SET Status = UPPER(NEW.Status) 
    WHERE Programme_Code = NEW.Programme_Code;
END;

-- Trigger on UPDATE
CREATE TRIGGER IF NOT EXISTS trg_programmes_status_update
AFTER UPDATE OF Status ON Programmes
FOR EACH ROW
BEGIN
    UPDATE Programmes 
    SET Status = UPPER(NEW.Status) 
    WHERE Programme_Code = NEW.Programme_Code;
END;
