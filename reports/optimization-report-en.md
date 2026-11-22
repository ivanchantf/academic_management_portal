# Academic Management Portal: Database Index Optimization Report

Generated: 2026-11-21T15:46:20+0800  
Engine: SQLite 3.51.0  
Dataset: 2,000 students / 300 courses / 40,000 enrollments / 10,000 mitigation requests / 4,000 time tickets

## Summary

- Six secondary indexes, 5 queries moved from full scans to index lookups, median p50 speedup 14.6x, maximum 23.0x (My mitigation requests).
- The staff-wide mitigation list is the only material regression: p50 30.4 to 32.4 ms, p95 46.7 to 62.9 ms. The plan scans the new index and adds row lookups while the sort remains.
- Database size +22.5%; enrollment index maintenance +60.4% with fsync disabled (about +4 µs per row).
- 6 queries keep identical plans and vary within ±14%, treated as noise.

## Query results

| Query | Service | Before p50 | After p50 | Speedup | Before p95 | After p95 | Plan |
|---|---|---:|---:|---:|---:|---:|---|
| My mitigation requests | `request.service.ts:31` | 0.37 | 0.016 | **23.0x** | 1.74 | 0.097 | index lookup (idx_mit_student_dt) |
| Teaching roster | `teach.service.ts:28` | 5.36 | 0.32 | **16.95x** | 11.0 | 1.54 | index lookup (idx_enrollment_course) |
| Active time ticket | `enrollment.service.ts:140` | 0.10 | 0.007 | **14.57x** | 0.57 | 0.064 | index lookup (idx_ticket_holder_window) |
| Teachers by course | `course.service.ts:45` | 0.035 | 0.006 | **5.83x** | 0.15 | 0.033 | index lookup (idx_teach_course) |
| Students by programme | `enrollment.service.ts:62` | 0.14 | 0.067 | **2.03x** | 0.42 | 0.19 | index lookup (idx_pme_programme / idx_pmin_programme) |
| Student transcript | `enrollment.service.ts:72` | 0.049 | 0.043 | 1.14x | 0.19 | 0.28 | unchanged |
| Staff list | `staff.service.ts:8` | 1.33 | 1.21 | 1.1x | 3.70 | 3.01 | unchanged |
| Programme syllabus | `programme.service.ts:219` | 0.038 | 0.035 | 1.09x | 0.19 | 0.19 | unchanged |
| Course catalog | `course.service.ts:78` | 2.63 | 2.56 | 1.02x | 5.49 | 5.36 | index scan (idx_teach_course) |
| My overload requests | `request.service.ts:82` | 0.011 | 0.011 | 1.0x | 0.039 | 0.053 | unchanged |
| Login lookup | `auth.service.ts:22` | 0.010 | 0.010 | 1.0x | 0.040 | 0.032 | unchanged |
| Students without major | `enrollment.service.ts:10` | 1.33 | 1.44 | 0.93x | 3.28 | 2.83 | unchanged |
| All mitigation requests | `request.service.ts:42` | 30.4 | 32.4 | **0.94x** | 46.7 | 62.9 | index scan (idx_mit_student_dt) |

*Milliseconds. Bold marks a speedup above 1.5x or a material regression. Students without major measures 0.93x with an unchanged plan; the 0.1 ms difference is treated as noise.*

## Indexes

| Index | Table | Columns | Query | p50 speedup |
|---|---|---|---|---:|
| `idx_mit_student_dt` | `Mitigation_Requests` | `Submitted_Student_ID, Submit_DT DESC` | My mitigation requests | 23.0x |
| `idx_enrollment_course` | `Course_Enrollments` | `Course_Code, Student_ID` | Teaching roster | 16.95x |
| `idx_ticket_holder_window` | `Time_Tickets` | `Holder_Student_ID, From_DT, To_DT` | Active time ticket | 14.57x |
| `idx_teach_course` | `Teach` | `Course_Code, Staff_ID` | Teachers by course | 5.83x |
| `idx_pme_programme` | `Programme_Major_Enrollments` | `Programme_Code, Student_ID, Status` | Students by programme (major branch) | 2.03x |
| `idx_pmin_programme` | `Programme_Minor_Enrollments` | `Programme_Code, Student_ID, Status` | Students by programme (minor branch) | 2.03x |

DDL: `database/indexes.sql`; `create.sql` section 20 stays in sync.

## Method and reproduction

- Both databases come from one `create.sql`; the baseline drops every `idx_%` index, the indexed copy runs the migration, and the rows are identical.
- The 13 queries are copied from service SQL. A 128 MB page cache, two-sided warmup, and five interleaved passes produce p50, p95, and p99.
- The write test interleaves both databases with fsync disabled to isolate index maintenance. Database files live in a local temp directory.
- Only database latency is measured, not HTTP or serialization.

```bash
python3 scripts/benchmark.py
python3 scripts/make_report.py
python3 scripts/make_report_en.py
sqlite3 pjDB.db < database/indexes.sql
```

The demo database `pjDB.db` already has the six indexes. Full charts and plans: `reports/optimization-report-en.html`.
