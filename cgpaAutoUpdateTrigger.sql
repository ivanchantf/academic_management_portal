CREATE TRIGGER IF NOT EXISTS trg_update_cgpa_after_insert
AFTER INSERT ON Course_Enrollments
FOR EACH ROW
BEGIN
    UPDATE Students
    SET CGPA = COALESCE(
        (
            SELECT 
                ROUND(
                    SUM(
                        CASE UPPER(ce.Grade)
                            WHEN 'A+' THEN 4.3
                            WHEN 'A'  THEN 4.0
                            WHEN 'A-' THEN 3.7
                            WHEN 'B+' THEN 3.3
                            WHEN 'B'  THEN 3.0
                            WHEN 'B-' THEN 2.7
                            WHEN 'C+' THEN 2.3
                            WHEN 'C'  THEN 2.0
                            WHEN 'C-' THEN 1.7
                            WHEN 'D'  THEN 1.0
                            WHEN 'F'  THEN 0.0
                            ELSE 0.0
                        END * c.Credits
                    ) * 1.0 / NULLIF(SUM(c.Credits), 0),
                    2
                )
            FROM Course_Enrollments ce
            JOIN Courses c ON ce.Course_Code = c.Course_Code
            WHERE ce.Student_ID = NEW.Student_ID
              AND ce.Grade IS NOT NULL
        ), 
        0.0
    )
    WHERE Student_ID = NEW.Student_ID;
END;

CREATE TRIGGER IF NOT EXISTS trg_update_cgpa_after_update
AFTER UPDATE OF Grade ON Course_Enrollments
FOR EACH ROW
BEGIN
    UPDATE Students
    SET CGPA = COALESCE(
        (
            SELECT 
                ROUND(
                    SUM(
                        CASE UPPER(ce.Grade)
                            WHEN 'A+' THEN 4.3
                            WHEN 'A'  THEN 4.0
                            WHEN 'A-' THEN 3.7
                            WHEN 'B+' THEN 3.3
                            WHEN 'B'  THEN 3.0
                            WHEN 'B-' THEN 2.7
                            WHEN 'C+' THEN 2.3
                            WHEN 'C'  THEN 2.0
                            WHEN 'C-' THEN 1.7
                            WHEN 'D'  THEN 1.0
                            WHEN 'F'  THEN 0.0
                            ELSE 0.0
                        END * c.Credits
                    ) * 1.0 / NULLIF(SUM(c.Credits), 0),
                    2
                )
            FROM Course_Enrollments ce
            JOIN Courses c ON ce.Course_Code = c.Course_Code
            WHERE ce.Student_ID = NEW.Student_ID
              AND ce.Grade IS NOT NULL
        ), 
        0.0
    )
    WHERE Student_ID = NEW.Student_ID;
END;

CREATE TRIGGER IF NOT EXISTS trg_update_cgpa_after_delete
AFTER DELETE ON Course_Enrollments
FOR EACH ROW
BEGIN
    UPDATE Students
    SET CGPA = COALESCE(
        (
            SELECT 
                ROUND(
                    SUM(
                        CASE UPPER(ce.Grade)
                            WHEN 'A+' THEN 4.3
                            WHEN 'A'  THEN 4.0
                            WHEN 'A-' THEN 3.7
                            WHEN 'B+' THEN 3.3
                            WHEN 'B'  THEN 3.0
                            WHEN 'B-' THEN 2.7
                            WHEN 'C+' THEN 2.3
                            WHEN 'C'  THEN 2.0
                            WHEN 'C-' THEN 1.7
                            WHEN 'D'  THEN 1.0
                            WHEN 'F'  THEN 0.0
                            ELSE 0.0
                        END * c.Credits
                    ) * 1.0 / NULLIF(SUM(c.Credits), 0),
                    2
                )
            FROM Course_Enrollments ce
            JOIN Courses c ON ce.Course_Code = c.Course_Code
            WHERE ce.Student_ID = OLD.Student_ID
              AND ce.Grade IS NOT NULL
        ), 
        0.0
    )
    WHERE Student_ID = OLD.Student_ID;
END;