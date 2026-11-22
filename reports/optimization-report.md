# Academic Management Portal 数据库索引优化报告

生成时间：2026-11-21T15:46:20+0800  
数据库：SQLite 3.51.0  
数据规模：2,000 学生 / 300 课程 / 40,000 选课 / 10,000 缓考申请 / 4,000 时间票

## 结论

- 6 条二级索引，5 条查询的执行计划从全表扫描改为索引查找，p50 中位提速 14.6×，最高 23.0×（学生缓考记录）。
- 管理端“全部缓考申请”是唯一实质回退：p50 30.4 → 32.4 ms，p95 46.7 → 62.9 ms。索引使计划改为索引扫描加回表，排序仍在。
- 数据库体积 +22.5%，选课写入的索引维护成本 +60.4%（关闭 fsync 单独测量，约 +4 µs/行）。
- 6 条查询计划未变，耗时在 ±14% 内波动，按噪声处理。

## 查询结果

| 查询 | 服务位置 | 前 p50 | 后 p50 | 提速 | 前 p95 | 后 p95 | 计划 |
|---|---|---:|---:|---:|---:|---:|---|
| 学生缓考记录 | `request.service.ts:31` | 0.37 | 0.016 | **23.0×** | 1.74 | 0.097 | 索引查找（idx_mit_student_dt） |
| 教师授课名单 | `teach.service.ts:28` | 5.36 | 0.32 | **16.95×** | 11.0 | 1.54 | 索引查找（idx_enrollment_course） |
| 有效注册时间票 | `enrollment.service.ts:140` | 0.10 | 0.007 | **14.57×** | 0.57 | 0.064 | 索引查找（idx_ticket_holder_window） |
| 课程任课教师 | `course.service.ts:45` | 0.035 | 0.006 | **5.83×** | 0.15 | 0.033 | 索引查找（idx_teach_course） |
| 专业学生名单 | `enrollment.service.ts:62` | 0.14 | 0.067 | **2.03×** | 0.42 | 0.19 | 索引查找（idx_pme_programme / idx_pmin_programme） |
| 学生成绩单 | `enrollment.service.ts:72` | 0.049 | 0.043 | 1.14× | 0.19 | 0.28 | 未变 |
| 教职工列表 | `staff.service.ts:8` | 1.33 | 1.21 | 1.1× | 3.70 | 3.01 | 未变 |
| 培养方案课程 | `programme.service.ts:219` | 0.038 | 0.035 | 1.09× | 0.19 | 0.19 | 未变 |
| 课程目录 | `course.service.ts:78` | 2.63 | 2.56 | 1.02× | 5.49 | 5.36 | 索引全扫描（idx_teach_course） |
| 我的超修申请 | `request.service.ts:82` | 0.011 | 0.011 | 1.0× | 0.039 | 0.053 | 未变 |
| 登录查询 | `auth.service.ts:22` | 0.010 | 0.010 | 1.0× | 0.040 | 0.032 | 未变 |
| 无专业学生 | `enrollment.service.ts:10` | 1.33 | 1.44 | 0.93× | 3.28 | 2.83 | 未变 |
| 全部缓考申请 | `request.service.ts:42` | 30.4 | 32.4 | **0.94×** | 46.7 | 62.9 | 索引全扫描（idx_mit_student_dt） |

*时间单位为毫秒。加粗为提速 1.5× 以上或明确回退。“无专业学生”的 0.93× 计划未变，绝对差 0.1 ms，按噪声处理。*

## 索引清单

| 索引 | 表 | 列 | 支撑查询 | p50 提速 |
|---|---|---|---|---:|
| `idx_mit_student_dt` | `Mitigation_Requests` | `Submitted_Student_ID, Submit_DT DESC` | 学生缓考记录 | 23.0× |
| `idx_enrollment_course` | `Course_Enrollments` | `Course_Code, Student_ID` | 教师授课名单 | 16.95× |
| `idx_ticket_holder_window` | `Time_Tickets` | `Holder_Student_ID, From_DT, To_DT` | 有效注册时间票 | 14.57× |
| `idx_teach_course` | `Teach` | `Course_Code, Staff_ID` | 课程任课教师 | 5.83× |
| `idx_pme_programme` | `Programme_Major_Enrollments` | `Programme_Code, Student_ID, Status` | 专业学生名单（主修） | 2.03× |
| `idx_pmin_programme` | `Programme_Minor_Enrollments` | `Programme_Code, Student_ID, Status` | 专业学生名单（辅修） | 2.03× |

DDL 见 `database/indexes.sql`，`create.sql` 第 20 节保持同步。

## 方法与复现

- 同一份 `create.sql` 建两个库；基线删除全部 `idx_%` 索引，优化库执行索引迁移，数据行相同。
- 13 条查询取自 service SQL；128 MB page cache、双向预热、5 轮交错采样，取 p50 / p95 / p99。
- 写入测试交错执行并关闭 fsync，单独观察索引维护成本；库文件放在本地临时目录。
- 只测数据库层，不含 HTTP 与序列化。

```bash
python3 scripts/benchmark.py
python3 scripts/make_report.py
sqlite3 pjDB.db < database/indexes.sql
```

演示库 `pjDB.db` 已应用这 6 条索引，时间票与选课查询的 `EXPLAIN QUERY PLAN` 已确认走索引。
完整图表与执行计划：`reports/optimization-report.html`。
