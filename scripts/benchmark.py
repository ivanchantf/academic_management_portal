#!/usr/bin/env python3
"""Reproducible SQLite benchmark for the Academic Management Portal.

Builds two identical databases from create.sql:

  baseline  - schema only, no secondary indexes
  indexed   - same rows, plus database/indexes.sql

Every query is copied from a NestJS service, so the numbers reflect the
actual access paths rather than synthetic micro-queries. Timings are
DB-layer latency, not HTTP latency.

Usage:
    python3 scripts/benchmark.py
    python3 scripts/benchmark.py --students 4000 --out reports/bench-4k.json

Requires only the Python standard library.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import random
import shutil
import sqlite3
import statistics
import tempfile
import time
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "create.sql"
INDEXES = ROOT / "database" / "indexes.sql"
REPORT_DIR = ROOT / "reports"
# Keep the disposable databases out of the project tree. When the project
# lives under a cloud-synced folder (iCloud, OneDrive), commit stalls from the
# file provider add hundreds of milliseconds of noise to the write test.
BENCH_DIR = Path(tempfile.gettempdir()) / "academic-portal-bench"

GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"]
DIFFICULTIES = ["Introductory", "Intermediate", "Advanced"]
STATUSES = ["PENDING", "APPROVED", "REJECTED"]


def connect(path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.isolation_level = None
    conn.execute("PRAGMA foreign_keys = OFF")
    conn.execute("PRAGMA temp_store = MEMORY")
    return conn


def open_bench(path: Path) -> sqlite3.Connection:
    """Open a read/write connection with the whole database cached.

    Both databases are under 10 MB at the default scale. A 128 MB page cache
    keeps every page resident, so the numbers measure planner and execution
    work instead of which pages happened to survive the 2 MB default cache.
    """
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA cache_size = -131072")
    conn.execute("PRAGMA temp_store = MEMORY")
    return conn


def build_schema(path: Path) -> None:
    conn = connect(path)
    conn.executescript(SCHEMA.read_text(encoding="utf-8"))
    # create.sql ships the production indexes. The baseline must not have
    # them, otherwise the comparison measures index-vs-index.
    for (name,) in conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'"
    ).fetchall():
        conn.execute(f'DROP INDEX "{name}"')
    conn.close()


def seed(path: Path, scale: argparse.Namespace) -> None:
    """Insert a deterministic synthetic workload."""
    rng = random.Random(42)
    n_students = scale.students
    n_staff = scale.staff
    n_courses = scale.courses
    n_majors = 8
    n_minors = 4
    per_student = scale.enrollments_per_student
    per_student_requests = scale.requests_per_student
    per_student_tickets = scale.tickets_per_student

    if per_student > n_courses:
        raise SystemExit("enrollments-per-student cannot exceed courses")

    conn = connect(path)
    cur = conn.cursor()
    cur.execute("BEGIN")

    # Departments
    departments = [
        (f"Department {i}", f"Building {i}", f"2658-{8000 + i}", f"/uploads/dept/{i}.jpg")
        for i in range(1, 11)
    ]
    cur.executemany(
        "INSERT INTO Departments (Name, Address, Phone_No, Photo_Path) VALUES (?, ?, ?, ?)",
        departments,
    )

    # Users: students first, then staff
    users = []
    for i in range(1, n_students + 1):
        users.append(
            (
                f"Student {i}",
                f"HKID-S{i:06d}",
                "2004-05-15",
                f"{i} Campus Road",
                "M" if i % 2 else "F",
                f"5123-{i % 10000:04d}",
                f"student{i}@example.edu",
                f"6123-{i % 10000:04d}",
                f"Guardian {i}",
                "2024-09-01",
                (i % 10) + 1,
            )
        )
    for i in range(1, n_staff + 1):
        users.append(
            (
                f"Staff {i}",
                f"HKID-T{i:06d}",
                "1980-03-20",
                f"{i} Office Road",
                "M" if i % 2 else "F",
                f"9123-{i % 10000:04d}",
                f"staff{i}@example.edu",
                f"7123-{i % 10000:04d}",
                f"Contact {i}",
                "2020-09-01",
                (i % 10) + 1,
            )
        )
    cur.executemany(
        """INSERT INTO Users
           (Name, HKID, DOB, Address, Gender, Phone_No, Email,
            Emergency_Phone_No, Emergency_Contact_Person, Entry_DT, DID)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        users,
    )

    cur.executemany(
        "INSERT INTO Accounts (Username, PasswordHash, User_ID) VALUES (?, ?, ?)",
        [
            (f"student{i}", "$2b$10$benchmarkbenchmarkbenchmarkbenchmark", i)
            for i in range(1, n_students + 1)
        ]
        + [
            (f"staff{i}", "$2b$10$benchmarkbenchmarkbenchmarkbenchmark", n_students + i)
            for i in range(1, n_staff + 1)
        ],
    )

    cur.executemany(
        "INSERT INTO Students (CGPA, User_ID) VALUES (0.0, ?)",
        [(i,) for i in range(1, n_students + 1)],
    )
    cur.executemany(
        "INSERT INTO Staffs (Office_No, Office_Address, User_ID) VALUES (?, ?, ?)",
        [
            (f"AB-{i:03d}", f"Academic Building {i}", n_students + i)
            for i in range(1, n_staff + 1)
        ],
    )

    # Programmes
    programme_rows = []
    major_rows = []
    minor_rows = []
    major_codes = [f"MAJ{i:02d}" for i in range(1, n_majors + 1)]
    minor_codes = [f"MIN{i:02d}" for i in range(1, n_minors + 1)]
    for i, code in enumerate(major_codes, start=1):
        programme_rows.append((code, f"Major Programme {i}", 120, "ACTIVE", (i % 10) + 1))
        major_rows.append((code, 4, 8, "BSc"))
    for i, code in enumerate(minor_codes, start=1):
        programme_rows.append((code, f"Minor Programme {i}", 30, "ACTIVE", (i % 10) + 1))
        minor_rows.append((code,))
    cur.executemany(
        "INSERT INTO Programmes (Programme_Code, Title, Credits_Required, Status, DID) VALUES (?, ?, ?, ?, ?)",
        programme_rows,
    )
    cur.executemany(
        "INSERT INTO Major_Programmes (Programme_Code, Normative_Duration_Years, Max_Duration_Years, Degree_Awarded) VALUES (?, ?, ?, ?)",
        major_rows,
    )
    cur.executemany(
        "INSERT INTO Minor_Programmes (Programme_Code) VALUES (?)", minor_rows
    )

    course_rows = []
    course_codes = []
    for i in range(1, n_courses + 1):
        code = f"CRS{i:04d}"
        course_codes.append(code)
        course_rows.append(
            (
                code,
                f"Course {i}",
                f"Description for course {i} covering topics in computing and retrieval.",
                DIFFICULTIES[i % 3],
                3 if i % 3 else 4,
                "ACTIVE",
                "2024-08-01",
                (i % n_staff) + 1,
                (i % 10) + 1,
            )
        )
    cur.executemany(
        """INSERT INTO Courses
           (Course_Code, Name, Description, Difficulty, Credits, Status,
            Created_DT, Created_Staff_ID, Offered_DID)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        course_rows,
    )

    # Teaching assignments: 3 staff per course
    teach_pairs = set()
    for code in course_codes:
        for staff_id in rng.sample(range(1, n_staff + 1), min(3, n_staff)):
            teach_pairs.add((staff_id, code))
    cur.executemany(
        "INSERT INTO Teach (Staff_ID, Course_Code) VALUES (?, ?)", sorted(teach_pairs)
    )

    # Programme course coverage
    major_course_rows = []
    minor_course_rows = []
    for i, code in enumerate(major_codes):
        for course in rng.sample(course_codes, min(20, n_courses)):
            major_course_rows.append((code, course))
    for i, code in enumerate(minor_codes):
        for course in rng.sample(course_codes, min(10, n_courses)):
            minor_course_rows.append((code, course))
    cur.executemany(
        "INSERT OR IGNORE INTO Major_Programmes_Courses (Programme_Code, Course_Code) VALUES (?, ?)",
        major_course_rows,
    )
    cur.executemany(
        "INSERT OR IGNORE INTO Minor_Programmes_Courses (Programme_Code, Course_Code) VALUES (?, ?)",
        minor_course_rows,
    )

    # Enrollments: unique pairs per student
    enrolments = []
    enrolment_pairs = set()
    for student_id in range(1, n_students + 1):
        for course_index in rng.sample(range(n_courses), per_student):
            code = course_codes[course_index]
            enrolment_pairs.add((student_id, code))
            grade = rng.choice(GRADES) if rng.random() < 0.55 else None
            enrolments.append((student_id, code, "2025-09-01", grade))
    cur.executemany(
        "INSERT INTO Course_Enrollments (Student_ID, Course_Code, Enroll_DT, Grade) VALUES (?, ?, ?, ?)",
        enrolments,
    )

    # Programme enrollments
    cur.executemany(
        "INSERT INTO Programme_Major_Enrollments (Student_ID, Programme_Code, Enroll_DT, Status) VALUES (?, ?, ?, 'ENROLLED')",
        [
            (student_id, major_codes[(student_id - 1) % n_majors], "2024-09-01")
            for student_id in range(1, n_students + 1)
        ],
    )
    minor_count = min(500, n_students)
    cur.executemany(
        "INSERT INTO Programme_Minor_Enrollments (Student_ID, Programme_Code, Enroll_DT, Status) VALUES (?, ?, ?, 'ENROLLED')",
        [
            (student_id, minor_codes[(student_id - 1) % n_minors], "2025-09-01")
            for student_id in range(1, minor_count + 1)
        ],
    )

    # Time tickets: two windows per student
    tickets = []
    for student_id in range(1, n_students + 1):
        tickets.append(
            (
                "2026-09-01 00:00:00",
                "2026-10-31 23:59:59",
                student_id,
                "2026-08-25",
                (student_id % n_staff) + 1,
            )
        )
        tickets.append(
            (
                "2026-11-01 00:00:00",
                "2026-12-31 23:59:59",
                student_id,
                "2026-10-25",
                (student_id % n_staff) + 1,
            )
        )
    cur.executemany(
        """INSERT INTO Time_Tickets
           (From_DT, To_DT, Holder_Student_ID, Issued_DT, Issued_Staff_ID)
           VALUES (?, ?, ?, ?, ?)""",
        tickets,
    )

    # Mitigation requests: distinct assessment dates per student
    mitigations = []
    base_day = date(2026, 9, 1)
    for student_id in range(1, n_students + 1):
        for request_index in range(per_student_requests):
            course = course_codes[(student_id * 7 + request_index) % n_courses]
            submit = base_day + timedelta(days=(student_id + request_index * 13) % 80)
            status = STATUSES[(student_id + request_index) % 3]
            processed_staff = None if status == "PENDING" else (student_id % n_staff) + 1
            mitigations.append(
                (
                    submit.isoformat(),
                    f"Medical reason {student_id}-{request_index}",
                    status,
                    course,
                    f"{submit.isoformat()} 09:00:00",
                    None if status == "PENDING" else f"{submit.isoformat()} 15:00:00",
                    student_id,
                    processed_staff,
                    f"./uploads/mitigation/doc-{student_id}-{request_index}.pdf",
                )
            )
    cur.executemany(
        """INSERT INTO Mitigation_Requests
           (Date_Of_Assessment, Reason, Status, Affecting_Course_Code, Submit_DT,
            Process_DT, Submitted_Student_ID, Processed_Staff_ID, File_Path)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        mitigations,
    )

    # Credit overload: up to three requests per student, one per status.
    # The UNIQUE (Submitted_Student_ID, Status) constraint allows this shape
    # and it exercises the ORDER BY path with more than one row.
    overloads = []
    for student_id in range(1, n_students + 1):
        for status_index, status in enumerate(STATUSES):
            processed_staff = None if status == "PENDING" else (student_id % n_staff) + 1
            overloads.append(
                (
                    f"Overload reason {student_id}-{status_index}",
                    status,
                    f"2026-{9 + status_index:02d}-{(student_id % 28) + 1:02d} 10:00:00",
                    None
                    if status == "PENDING"
                    else f"2026-{9 + status_index:02d}-20 10:00:00",
                    student_id,
                    processed_staff,
                    f"./uploads/overload/doc-{student_id}-{status_index}.pdf",
                )
            )
    cur.executemany(
        """INSERT INTO Credit_Overload_Requests
           (Reason, Status, Submit_DT, Process_DT, Submitted_Student_ID,
            Processed_Staff_ID, File_Path)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        overloads,
    )

    # Qualifications
    categories = [
        ("Teaching", "Level 1"),
        ("Research", "Level 2"),
        ("Industry", "Level 3"),
        ("Professional", "Level 4"),
        ("Other", "Level 5"),
    ]
    cur.executemany(
        "INSERT INTO Qualifications_Category (Category_Name, Level) VALUES (?, ?)",
        categories,
    )
    qualifications = []
    for staff_id in range(1, n_staff + 1):
        for q_index in range(2):
            qualifications.append(
                (
                    f"Qualification {staff_id}-{q_index}",
                    f"Organisation {staff_id % 20}",
                    f"20{15 + q_index}-06-01",
                    staff_id,
                    ((staff_id + q_index) % 5) + 1,
                )
            )
    cur.executemany(
        """INSERT INTO Qualifications
           (Title, Organization, Obtained_DT, Holder_Staff_ID, Qualification_Type_ID)
           VALUES (?, ?, ?, ?, ?)""",
        qualifications,
    )

    cur.execute("COMMIT")
    conn.close()
    return enrolment_pairs


def apply_indexes(path: Path) -> None:
    conn = sqlite3.connect(path)
    conn.executescript(INDEXES.read_text(encoding="utf-8"))
    conn.close()


def db_size(path: Path) -> int:
    return os.path.getsize(path)


def pct(values, p):
    ordered = sorted(values)
    if not ordered:
        return 0.0
    k = (len(ordered) - 1) * p
    lower = int(k)
    upper = min(lower + 1, len(ordered) - 1)
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (k - lower)


def explain(conn, sql, params):
    rows = conn.execute("EXPLAIN QUERY PLAN " + sql, params).fetchall()
    return " | ".join(row[3] for row in rows)


def measure(conn, sql, params, iterations):
    for _ in range(max(5, iterations // 10)):
        conn.execute(sql, params).fetchall()
    samples = []
    for _ in range(iterations):
        started = time.perf_counter_ns()
        conn.execute(sql, params).fetchall()
        samples.append((time.perf_counter_ns() - started) / 1_000_000)
    return samples


def make_queries(n_students, n_staff, course_code, programme_code, student_id, username):
    catalog_sql = """
    SELECT
      d.DID AS department_id,
      d.Name AS department_name,
      d.Address AS department_address,
      d.Phone_No AS department_phone,
      d.Photo_Path AS department_photo,
      json_group_array(
        json_object(
          'course_code', c.Course_Code,
          'name', c.Name,
          'description', c.Description,
          'difficulty', c.Difficulty,
          'credits', c.Credits,
          'status', c.Status,
          'teachers', course_teachers.teachers,
          'for_programme', COALESCE(course_programmes.programmes, json('[]'))
        )
      ) AS courses
    FROM Departments d
    INNER JOIN Courses c ON d.DID = c.Offered_DID
    INNER JOIN (
      SELECT
        t.Course_Code,
        json_group_array(
          json_object(
            'staff_id', s.Staff_ID,
            'office_no', s.Office_No,
            'office_address', s.Office_Address,
            'user_id', u.User_ID,
            'name', u.Name,
            'email', u.Email,
            'phone_no', u.Phone_No
          )
        ) AS teachers
      FROM Teach t
      INNER JOIN Staffs s ON t.Staff_ID = s.Staff_ID
      INNER JOIN Users u ON s.User_ID = u.User_ID
      GROUP BY t.Course_Code
    ) course_teachers ON c.Course_Code = course_teachers.Course_Code
    LEFT JOIN (
      SELECT
        Course_Code,
        json_group_array(Programme_Code) AS programmes
      FROM (
        SELECT Course_Code, Programme_Code FROM Major_Programmes_Courses
        UNION
        SELECT Course_Code, Programme_Code FROM Minor_Programmes_Courses
      ) combined_programmes
      GROUP BY Course_Code
    ) course_programmes ON c.Course_Code = course_programmes.Course_Code
    GROUP BY d.DID
    """

    staff_list_sql = """
    SELECT
      s.Staff_ID,
      u.User_ID,
      u.Name AS Staff_Name,
      u.Email,
      u.Phone_No,
      s.Office_No,
      s.Office_Address,
      d.DID AS Department_ID,
      d.Name AS Department_Name,
      COALESCE(
        json_group_array(
          json_object(
            'qualification_id', q.Qualification_ID,
            'title', q.Title,
            'organization', q.Organization,
            'obtained_dt', q.Obtained_DT,
            'category_name', qc.Category_Name,
            'level', qc.Level
          )
        ) FILTER (WHERE q.Qualification_ID IS NOT NULL),
        '[]'
      ) AS qualifications
    FROM Staffs s
    INNER JOIN Users u ON s.User_ID = u.User_ID
    LEFT JOIN Departments d ON u.DID = d.DID
    LEFT JOIN Qualifications q ON s.Staff_ID = q.Holder_Staff_ID
    LEFT JOIN Qualifications_Category qc ON q.Qualification_Type_ID = qc.Type_ID
    GROUP BY s.Staff_ID
    ORDER BY d.DID ASC, s.Staff_ID ASC
    """

    return [
        {
            "id": "ticket_active",
            "label": "Active time ticket",
            "source": "enrollment.service.ts:140",
            "sql": """SELECT * FROM Time_Tickets
                      WHERE Holder_Student_ID = ?
                        AND From_DT <= ?
                        AND To_DT >= ?""",
            "params": (student_id, "2026-10-15 12:00:00", "2026-10-15 12:00:00"),
            "iterations": 1000,
        },
        {
            "id": "teaching_roster",
            "label": "Teaching roster",
            "source": "teach.service.ts:28",
            "sql": """SELECT c.Course_Code, c.Credits, c.Name, t.Staff_ID,
                             COALESCE(json_group_array(json_object(
                               'Student_ID', s.Student_ID, 'Name', u.Name, 'Email', u.Email,
                               'Grade', ce.Grade, 'Enroll_DT', ce.Enroll_DT
                             )) FILTER (WHERE s.Student_ID IS NOT NULL), '[]') AS Students
                      FROM Teach t
                      JOIN Courses c ON t.Course_Code = c.Course_Code
                      LEFT JOIN Course_Enrollments ce ON c.Course_Code = ce.Course_Code
                      LEFT JOIN Students s ON ce.Student_ID = s.Student_ID
                      LEFT JOIN Users u ON s.User_ID = u.User_ID
                      WHERE t.Staff_ID = ?
                      GROUP BY c.Course_Code""",
            "params": (5,),
            "iterations": 100,
        },
        {
            "id": "course_teachers",
            "label": "Teachers by course",
            "source": "course.service.ts:45",
            "sql": "SELECT Staff_ID FROM Teach WHERE Course_Code = ?",
            "params": (course_code,),
            "iterations": 1000,
        },
        {
            "id": "programme_students",
            "label": "Students by programme",
            "source": "enrollment.service.ts:62",
            "sql": """SELECT Student_ID FROM Programme_Major_Enrollments WHERE Programme_Code = ?
                      UNION
                      SELECT Student_ID FROM Programme_Minor_Enrollments WHERE Programme_Code = ?""",
            "params": (programme_code, programme_code),
            "iterations": 500,
        },
        {
            "id": "my_mitigation",
            "label": "My mitigation requests",
            "source": "request.service.ts:31",
            "sql": """SELECT Mitigation_Requests.*, Users.Name AS Processed_By
                      FROM Mitigation_Requests
                      LEFT JOIN Staffs ON Mitigation_Requests.Processed_Staff_ID = Staffs.Staff_ID
                      LEFT JOIN Users ON Staffs.User_ID = Users.User_ID
                      WHERE Submitted_Student_ID = ?
                      ORDER BY Submit_DT DESC""",
            "params": (student_id,),
            "iterations": 1000,
        },
        {
            "id": "my_overload",
            "label": "My overload requests",
            "source": "request.service.ts:82",
            "sql": """SELECT Credit_Overload_Requests.*, Users.Name AS Submitted_By
                      FROM Credit_Overload_Requests
                      LEFT JOIN Staffs ON Credit_Overload_Requests.Processed_Staff_ID = Staffs.Staff_ID
                      LEFT JOIN Users ON Staffs.User_ID = Users.User_ID
                      WHERE Submitted_Student_ID = ?
                      ORDER BY Submit_DT DESC""",
            "params": (student_id,),
            "iterations": 1000,
        },
        {
            "id": "all_mitigation",
            "label": "All mitigation requests",
            "source": "request.service.ts:42",
            "sql": """SELECT Mitigation_Requests.*, Users.Name AS Submitted_By
                      FROM Mitigation_Requests
                      JOIN Students ON Mitigation_Requests.Submitted_Student_ID = Students.Student_ID
                      JOIN Users ON Students.User_ID = Users.User_ID
                      ORDER BY Submit_DT DESC""",
            "params": (),
            "iterations": 80,
        },
        {
            "id": "course_catalog",
            "label": "Course catalog",
            "source": "course.service.ts:78",
            "sql": catalog_sql,
            "params": (),
            "iterations": 100,
        },
        {
            "id": "syllabus",
            "label": "Programme syllabus",
            "source": "programme.service.ts:219",
            "sql": """SELECT c.Course_Code, c.Name, c.Description, c.Difficulty,
                             c.Credits, c.Status, c.Offered_DID
                      FROM Courses c
                      INNER JOIN (
                        SELECT Course_Code FROM Major_Programmes_Courses WHERE Programme_Code = ?
                        UNION
                        SELECT Course_Code FROM Minor_Programmes_Courses WHERE Programme_Code = ?
                      ) pc ON c.Course_Code = pc.Course_Code""",
            "params": (programme_code, programme_code),
            "iterations": 1000,
        },
        {
            "id": "staff_list",
            "label": "Staff list",
            "source": "staff.service.ts:8",
            "sql": staff_list_sql,
            "params": (),
            "iterations": 100,
        },
        {
            "id": "transcript",
            "label": "Student transcript",
            "source": "enrollment.service.ts:72",
            "sql": """SELECT * FROM Course_Enrollments
                      JOIN Courses ON Course_Enrollments.Course_Code = Courses.Course_Code
                      WHERE Student_ID = ?""",
            "params": (student_id,),
            "iterations": 1000,
        },
        {
            "id": "login",
            "label": "Login lookup",
            "source": "auth.service.ts:22",
            "sql": """SELECT Accounts.*, Users.*, Departments.Name AS DepartmentName,
                             CASE WHEN Staffs.User_ID IS NOT NULL THEN 'Staff'
                                  WHEN Students.User_ID IS NOT NULL THEN 'Student'
                                  ELSE 'Unknown' END AS UserType
                      FROM Accounts
                      JOIN Users ON Accounts.User_ID = Users.User_ID
                      LEFT JOIN Staffs ON Users.User_ID = Staffs.User_ID
                      LEFT JOIN Students ON Users.User_ID = Students.User_ID
                      LEFT JOIN Departments ON Users.DID = Departments.DID
                      WHERE Accounts.Username = ?""",
            "params": (username,),
            "iterations": 1000,
        },
        {
            "id": "not_enrolled_major",
            "label": "Students without major",
            "source": "enrollment.service.ts:10",
            # This query scans all students; a small sample produced a p95
            # outlier, so it gets a larger sample than the indexed lookups.

            "sql": """SELECT s.Student_ID, u.Name, u.Email, u.HKID
                      FROM Students s
                      JOIN Users u ON s.User_ID = u.User_ID
                      WHERE NOT EXISTS (
                        SELECT 1
                        FROM Programme_Major_Enrollments pe
                        JOIN Major_Programmes mp ON pe.Programme_Code = mp.Programme_Code
                        WHERE pe.Student_ID = s.Student_ID AND pe.Status = 'ENROLLED'
                      )""",
            "params": (),
            "iterations": 300,
        },
    ]


def measure_writes(baseline_path: Path, indexed_path: Path, pairs,
                   rounds=10, per_round=500):
    """Insert the same rows into both databases, alternating which goes first.

    Commit durability makes a single round dominated by disk sync, so the
    rounds are interleaved; otherwise whichever database ran second looks
    faster (or slower) for reasons unrelated to its indexes.
    """
    conns = {
        "baseline": open_bench(baseline_path),
        "indexed": open_bench(indexed_path),
    }
    # Commit fsync dominates and is identical for both databases, which hides
    # the signal we want: the cost of maintaining the extra B-tree. Keep both
    # sides in memory so the round measures index maintenance only.
    for conn in conns.values():
        conn.execute("PRAGMA journal_mode = MEMORY")
        conn.execute("PRAGMA synchronous = OFF")
    times = {"baseline": [], "indexed": []}
    cursor = 0
    for round_no in range(rounds):
        batch = pairs[cursor : cursor + per_round]
        cursor += per_round
        order = ("baseline", "indexed") if round_no % 2 == 0 else ("indexed", "baseline")
        for name in order:
            conn = conns[name]
            conn.execute("BEGIN")
            started = time.perf_counter_ns()
            conn.executemany(
                "INSERT INTO Course_Enrollments (Student_ID, Course_Code, Enroll_DT, Grade) VALUES (?, ?, ?, NULL)",
                [(student, code, "2026-11-21") for student, code in batch],
            )
            conn.execute("COMMIT")
            times[name].append((time.perf_counter_ns() - started) / 1_000_000)
    for conn in conns.values():
        conn.close()

    summary = {}
    for name, values in times.items():
        summary[name] = {
            "inserts_per_round": per_round,
            "rounds": rounds,
            "p50_ms": round(statistics.median(values), 2),
            "all_ms": [round(value, 2) for value in values],
        }
    return summary


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--students", type=int, default=2000)
    parser.add_argument("--staff", type=int, default=200)
    parser.add_argument("--courses", type=int, default=300)
    parser.add_argument("--enrollments-per-student", type=int, default=20)
    parser.add_argument("--requests-per-student", type=int, default=5)
    parser.add_argument("--tickets-per-student", type=int, default=2)
    parser.add_argument("--passes", type=int, default=5)
    parser.add_argument("--out", type=Path, default=REPORT_DIR / "benchmark-results.json")
    args = parser.parse_args()

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    BENCH_DIR.mkdir(parents=True, exist_ok=True)
    baseline_path = BENCH_DIR / "baseline.db"
    indexed_path = BENCH_DIR / "indexed.db"
    for path in (baseline_path, indexed_path):
        if path.exists():
            path.unlink()

    print("Building schema...")
    build_schema(baseline_path)

    print(
        f"Seeding {args.students} students, {args.courses} courses, "
        f"{args.students * args.enrollments_per_student} enrollments..."
    )
    started = time.perf_counter()
    pairs = seed(baseline_path, args)
    print(f"  seeded in {time.perf_counter() - started:.1f}s")

    baseline_size = db_size(baseline_path)
    shutil.copy2(baseline_path, indexed_path)
    apply_indexes(indexed_path)
    indexed_size = db_size(indexed_path)

    student_id = 42
    course_code = "CRS0007"
    programme_code = "MAJ03"
    username = "student42"
    queries = make_queries(
        args.students, args.staff, course_code, programme_code, student_id, username
    )

    results = []
    print(f"Measuring ({args.passes} passes)...")
    baseline_conn = open_bench(baseline_path)
    indexed_conn = open_bench(indexed_path)

    # Warm both page caches across every query before timing either side,
    # so neither database benefits from being queried second.
    for query in queries:
        baseline_conn.execute(query["sql"], query["params"]).fetchall()
        indexed_conn.execute(query["sql"], query["params"]).fetchall()

    samples = {
        query["id"]: {"baseline": [], "indexed": []} for query in queries
    }
    for _ in range(args.passes):
        for query in queries:
            samples[query["id"]]["baseline"].extend(
                measure(baseline_conn, query["sql"], query["params"], query["iterations"])
            )
            samples[query["id"]]["indexed"].extend(
                measure(indexed_conn, query["sql"], query["params"], query["iterations"])
            )

    for query in queries:
        base_samples = samples[query["id"]]["baseline"]
        indexed_samples = samples[query["id"]]["indexed"]
        base = {
            "p50_ms": round(pct(base_samples, 0.50), 3),
            "p95_ms": round(pct(base_samples, 0.95), 3),
            "p99_ms": round(pct(base_samples, 0.99), 3),
        }
        indexed = {
            "p50_ms": round(pct(indexed_samples, 0.50), 3),
            "p95_ms": round(pct(indexed_samples, 0.95), 3),
            "p99_ms": round(pct(indexed_samples, 0.99), 3),
        }
        results.append(
            {
                **{key: query[key] for key in ("id", "label", "source", "iterations")},
                "baseline": base,
                "indexed": indexed,
                "speedup_p50": round(base["p50_ms"] / indexed["p50_ms"], 2)
                if indexed["p50_ms"]
                else None,
                "speedup_p95": round(base["p95_ms"] / indexed["p95_ms"], 2)
                if indexed["p95_ms"]
                else None,
                "plan_baseline": explain(baseline_conn, query["sql"], query["params"]),
                "plan_indexed": explain(indexed_conn, query["sql"], query["params"]),
            }
        )
        print(
            f"  {query['label']:<28} "
            f"p50 {base['p50_ms']:>9.3f} -> {indexed['p50_ms']:>9.3f} ms "
            f"({results[-1]['speedup_p50']}x)   "
            f"p95 {base['p95_ms']:>9.3f} -> {indexed['p95_ms']:>9.3f} ms"
        )

    # Write overhead: 5,000 fresh enrollments, identical pairs in both DBs.
    used = set(pairs)
    write_pairs = []
    rng = random.Random(7)
    while len(write_pairs) < 5000:
        candidate = (
            rng.randint(1, args.students),
            f"CRS{rng.randint(1, args.courses):04d}",
        )
        if candidate not in used:
            used.add(candidate)
            write_pairs.append(candidate)
    write = measure_writes(baseline_path, indexed_path, write_pairs)
    baseline_conn.close()
    indexed_conn.close()

    payload = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "engine": sqlite3.sqlite_version,
        "scale": {
            "students": args.students,
            "staff": args.staff,
            "courses": args.courses,
            "enrollments": args.students * args.enrollments_per_student,
            "mitigation_requests": args.students * args.requests_per_student,
            "time_tickets": args.students * args.tickets_per_student,
        },
        "db_size": {
            "baseline_bytes": baseline_size,
            "indexed_bytes": indexed_size,
            "delta_bytes": indexed_size - baseline_size,
            "delta_pct": round((indexed_size - baseline_size) / baseline_size * 100, 2),
        },
        "write": {
            "durability": "journal_mode=MEMORY, synchronous=OFF (fsync excluded)",
            "baseline": write["baseline"],
            "indexed": write["indexed"],
            "overhead_pct": round(
                (write["indexed"]["p50_ms"] - write["baseline"]["p50_ms"])
                / write["baseline"]["p50_ms"]
                * 100,
                1,
            )
            if write["baseline"]["p50_ms"]
            else None,
        },
        "results": results,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    csv_path = args.out.with_suffix(".csv")
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "query",
                "source",
                "baseline_p50_ms",
                "baseline_p95_ms",
                "indexed_p50_ms",
                "indexed_p95_ms",
                "speedup_p95",
                "baseline_plan",
                "indexed_plan",
            ]
        )
        for row in results:
            writer.writerow(
                [
                    row["label"],
                    row["source"],
                    row["baseline"]["p50_ms"],
                    row["baseline"]["p95_ms"],
                    row["indexed"]["p50_ms"],
                    row["indexed"]["p95_ms"],
                    row["speedup_p95"],
                    row["plan_baseline"],
                    row["plan_indexed"],
                ]
            )

    print(f"\nWrote {args.out} and {csv_path}")
    print(
        f"DB size: {baseline_size / 1024:.0f} KB -> {indexed_size / 1024:.0f} KB "
        f"({payload['db_size']['delta_pct']}%)"
    )
    print(
        f"Write overhead: {write['baseline']['p50_ms']} ms -> "
        f"{write['indexed']['p50_ms']} ms for "
        f"{write['baseline']['inserts_per_round']} inserts "
        f"({payload['write']['overhead_pct']}%)"
    )


if __name__ == "__main__":
    main()
