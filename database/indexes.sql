-- Secondary indexes for the Academic Management Portal.
-- Idempotent: safe to run against an existing database.
--
-- Every index below is tied to a query captured from the NestJS services
-- and was kept only after the benchmark showed a p95 improvement.
-- Indexes that changed the plan without improving latency were removed:
--   * Submit_DT-only indexes on the request tables (index scan plus row
--     lookups lost to a table scan plus sort)
--   * Credit_Overload_Requests(Submitted_Student_ID, Submit_DT DESC): a
--     student has at most a handful of overload requests, so sorting them
--     costs less than maintaining the index
--   * Course_Code-first indexes on the programme junction tables (the
--     optimizer kept using the primary key)
--   * Courses(Offered_DID) and Qualifications(Holder_Staff_ID) (unused or
--     slower than SQLite's automatic index)
--
-- Apply with:
--   sqlite3 pjDB.db < database/indexes.sql

-- Course-first lookups: teacher roster, course catalog, enrollment joins.
CREATE INDEX IF NOT EXISTS idx_enrollment_course
  ON Course_Enrollments(Course_Code, Student_ID);

CREATE INDEX IF NOT EXISTS idx_teach_course
  ON Teach(Course_Code, Staff_ID);

-- Active registration window: Holder_Student_ID equality + time range.
CREATE INDEX IF NOT EXISTS idx_ticket_holder_window
  ON Time_Tickets(Holder_Student_ID, From_DT, To_DT);

-- Student request history, newest first.
CREATE INDEX IF NOT EXISTS idx_mit_student_dt
  ON Mitigation_Requests(Submitted_Student_ID, Submit_DT DESC);

-- Programme-first lookups. The primary keys lead with Student_ID, so the
-- reverse direction (Programme_Code -> students) needs its own index.
CREATE INDEX IF NOT EXISTS idx_pme_programme
  ON Programme_Major_Enrollments(Programme_Code, Student_ID, Status);

CREATE INDEX IF NOT EXISTS idx_pmin_programme
  ON Programme_Minor_Enrollments(Programme_Code, Student_ID, Status);
