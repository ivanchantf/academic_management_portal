# 学术管理门户：完成度盘点与下一步优化

分析对象：`ivanchantf/academic_management_portal`（main 分支，最新提交 `78984ad`）
分析日期：2026-11-21
方法：CodeGraph 索引 + 代码走查 + SQLite `EXPLAIN QUERY PLAN` + 临时库实测

---

## 一、结论

功能清单基本做完，缺一项 Staff 更新学生档案。演示层面已经够用，但课程项目要拿分，短板集中在四处：

1. 后端只有登录校验，没有角色校验，部分 Staff 接口任何登录用户都能调用。
2. 选课规则写在前端，服务端不设防，且时间票判断存在格式错误。
3. 数据库除主键和唯一约束外没有任何二级索引，热点查询走全表扫描。
4. 没有任何测试文件和性能基线，无法证明 indexing / optimization 的效果。

建议按 P0 安全、P1 正确性、P2 索引、P3 评估的顺序推进。索引和评估放在最后，因为要先有稳定的业务规则，基准才有意义。

---

## 二、功能完成度

| 角色 | 需求 | 状态 | 说明 |
|---|---|---|---|
| Student | Search courses | 部分 | 目录页有前端过滤，无服务端搜索接口与索引 |
| Student | Register / Deregister | 已实现 | 依赖时间票，但服务端不校验学分上限 |
| Student | Update Own Profile | 已实现 | `PUT /profile/student` |
| Student | Check grades released | 已实现 | 成绩单页 |
| Student | Assessment Mitigation | 已实现 | 含附件上传 |
| Student | Credit Overload | 已实现 | 被拒后无法再次申请，见 P1-5 |
| Student | Degree Progress | 已实现 | 规则较粗，只按学分统计 |
| Staff | Assign / Update Grades | 已实现 | 有任课校验，事务写入 |
| Staff | Create Staff / Student Account | 已实现 | 任意 Staff 都能建 Staff 账号 |
| Staff | **Update Student Profile** | **缺失** | 只有学生改自己的接口 |
| Staff | Update Own Profile | 已实现 | `PUT /profile/staff` |
| Staff | Issue Time Tickets | 已实现 | 含批量签发与全量删除 |
| Staff | Create / Update Courses | 已实现 | 无角色校验 |
| Staff | Approve / Reject Mitigation | 已实现 | 无角色校验 |
| Staff | Approve / Reject Overload | 已实现 | 无角色校验 |

---

## 三、问题清单

### P0 安全与隐私

**P0-1 后端缺少角色守卫**

所有控制器只挂 `AuthGuard`，没有 `RolesGuard`。前端 `RequireRole` 只是路由层的显示控制，直接调 API 可以绕过。

已验证可以越权执行的接口：

| 接口 | 后果 |
|---|---|
| `POST /api/enrollment/assign-major` | 任意登录用户给任意学生分配专业 |
| `POST /api/enrollment/assign-minor` | 同上，分配辅修 |
| `POST /api/course/assign-teachers` | 任意登录用户重写课程任课教师 |
| `POST /api/programme/create`、`PUT /api/programme/update` | 任意登录用户新建或修改培养方案与课程覆盖 |
| `DELETE /api/timeticket/delete-all` | 任意登录用户清空全校时间票 |
| `GET /api/request/all-mitigation`、`/all-overload` | 任意学生查看全校申请，含理由与附件路径 |
| `GET /api/enrollment/student-not-enroll-major` | 返回未分配专业学生的姓名、邮箱、HKID |

代码位置：`backend/src/enrollment/enrollment.controller.ts:41`、`backend/src/course/course.controller.ts:81`、`backend/src/programme/programme.controller.ts:55`、`backend/src/timeticket/timeticket.controller.ts:32`、`backend/src/request/request.controller.ts:72`

**P0-2 账号列表泄露密码哈希**

`listAccounts` 查询 `Accounts.*`，把 `PasswordHash`、`HKID`、`DOB`、住址一起返回给 Staff。任何 Staff 账号都能拿到全校密码哈希。

代码位置：`backend/src/auth/auth.service.ts:156`

**P0-3 申请表附件公开可下载**

附件写入 `backend/uploads/mitigation` 和 `overload`，由 `ServeStaticModule` 以 `/api/uploads` 公开静态服务，不经过 `AuthGuard`。同时 `all-mitigation` 把 `File_Path` 返回给任意登录用户。两者组合后，学生可以下载其他学生的病假证明。

代码位置：`backend/src/app.module.ts:29`、`backend/src/request/request.controller.ts:26`

上传本身也没有 `limits` 与 `fileFilter`，可以上传任意大小、任意类型文件。

**P0-4 会话配置偏弱**

- JWT 密钥硬编码回退值 `amp_secret`，仓库里没有 `.env`。
- Cookie 只设了 `maxAge` 和 `path`，没有 `httpOnly`、`secure`、`sameSite`。
- 登录响应把 token 同时放在 JSON body 里，前端用 Cookie，body 里的 token 增加了 XSS 窃取面。
- 登录没有频率限制，`bcrypt` 轮数为 10，可被离线或在线爆破。

代码位置：`backend/src/auth/auth.guard.ts:21`、`backend/src/auth/auth.controller.ts:24`

**P0-5 日志泄露敏感数据**

`login` 里 `console.log(account)` 会打印包含 `PasswordHash` 的整行用户记录。各控制器还大量打印 `req.user`、完整 profile、申请附件路径。生产环境应关闭。

代码位置：`backend/src/auth/auth.service.ts:38`

---

### P1 业务正确性

**P1-1 学分上限只在前端**

`RegisterCourses.jsx` 在提交前计算 18 / 21 学分上限，服务端 `enrollCourses` 完全不检查。直接调 `POST /api/enrollment/enroll-courses` 可以一次注册全部课程。

代码位置：`frontend/src/components/RegisterCourses.jsx:135`、`backend/src/enrollment/enrollment.service.ts:131`

**P1-2 选课写入无事务**

`enrollCourses` 把注册和退课拼成 `Promise.all` 并发执行，没有事务。中途失败会出现部分成功。重复注册会触发主键冲突，前端收到 500。

**P1-3 选课接口永远返回成功**

控制器固定返回 `{ success: true, result }`。服务层返回"没有有效时间票"时，前端仍然显示注册成功。

代码位置：`backend/src/enrollment/enrollment.controller.ts:123`

**P1-4 时间票判断格式错误（已实测）**

时间票存的是 ISO 8601 `2026-11-21T04:00:00.000Z`，比较对象是 SQLite 的 `CURRENT_TIMESTAMP`，格式为 `2026-11-21 12:00:00`。字符串比较时 `T` 大于空格，导致同一天的时间票判断为未生效。

实测：

```sql
SELECT '2026-11-21T04:00:00.000Z' <= '2026-11-21 12:00:00';
-- 结果 0
```

后果：单日时间票永远无法用于选课，跨日时间票只在中间日期生效，与具体时刻无关。

代码位置：`backend/src/enrollment/enrollment.service.ts:140`

**P1-5 过度修课被拒后无法再次申请（已实测）**

`Credit_Overload_Requests` 上有 `UNIQUE (Submitted_Student_ID, Status)`。被拒后状态为 `REJECTED`，再次提交会撞唯一约束。实测报错：

```
UNIQUE constraint failed: Credit_Overload_Requests.Submitted_Student_ID,
Credit_Overload_Requests.Status
```

应改为只对 `PENDING` 建部分唯一索引。

代码位置：`create.sql:128`

**P1-6 Staff 更新学生档案缺失**

需求清单里有 `Update Student Profile`，后端只有 `PUT /profile/student`，且 `user.User_ID` 来自 token，只能改自己。Staff 端没有入口。

**P1-7 成绩值不校验**

`releaseGrades` 接受任意字符串作为成绩，触发器里未知等级按 0.0 计入 GPA，学生看到成绩但 GPA 被静默拉低。应在服务端和数据库层限定 A+ 到 F 的枚举。

**P1-8 学位进度规则过粗**

`AcademicProgress.jsx` 只比较"培养方案课程是否出现在已选课列表"和学分总和。所有剩余课程都标记 `Fulfills Major Requirement`，辅修也一样。没有核心课 / 选修课区分、最低成绩要求、修业年限检查。

**P1-9 错误处理失效**

`listAccounts` 非 Staff 时返回 `{ success: false }`，控制器只判断对象是否为真，于是继续包一层 `{ success: true, accounts: {...} }`。数据没泄露，但错误语义错了。

---

### P2 数据库与检索

**P2-1 零二级索引（已修复，实测见 `reports/optimization-report.md`）**

`create.sql` 原来没有一条 `CREATE INDEX`。实际库里只有主键和唯一约束产生的 `sqlite_autoindex_*`。

加索引前的关键查询计划：

| 查询 | 计划 | 影响 |
|---|---|---|
| 时间票按学生 + 时间窗口 | `SCAN Time_Tickets` | 全表扫描 |
| 按课程查选课记录 | `SCAN ce` | 教师成绩页、课程目录 |
| 按课程查任课教师 | `SCAN Teach` | 课程目录 |
| 按培养方案查学生 | 覆盖索引扫描整表 | 专业分配页 |
| 学生查减免申请并按时间排序 | `SCAN` + `USE TEMP B-TREE FOR ORDER BY` | 每个学生页 |
| 按专业查已选课程 | 主键前导列是 `Student_ID`，反向查询无效 | 课程目录 |

数据量现在很小（11 条选课、60 门课），问题被掩盖。演示数据一放大，课程目录和成绩页会先变慢。

**已落地索引（6 条，均有基准收益）**

```sql
CREATE INDEX IF NOT EXISTS idx_enrollment_course
  ON Course_Enrollments(Course_Code, Student_ID);
CREATE INDEX IF NOT EXISTS idx_teach_course
  ON Teach(Course_Code, Staff_ID);
CREATE INDEX IF NOT EXISTS idx_ticket_holder_window
  ON Time_Tickets(Holder_Student_ID, From_DT, To_DT);
CREATE INDEX IF NOT EXISTS idx_mit_student_dt
  ON Mitigation_Requests(Submitted_Student_ID, Submit_DT DESC);
CREATE INDEX IF NOT EXISTS idx_pme_programme
  ON Programme_Major_Enrollments(Programme_Code, Student_ID, Status);
CREATE INDEX IF NOT EXISTS idx_pmin_programme
  ON Programme_Minor_Enrollments(Programme_Code, Student_ID, Status);
```

实测：5 条查询的 p50 中位提速 14.6×，最高 23.0×。管理端全量缓考列表回退 6%，保留原因与放弃其他候选索引的原因见报告。

**P2-2 SQLite 并发配置**

未开启 WAL 与 `busy_timeout`。并发选课或批量签票时容易出现 `database is locked`。建议启动时执行：

```sql
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
```

**P2-3 课程目录每次全量聚合**

`getCoursesCatalog` 对全库课程、教师、培养方案做多层 `json_group_array`，每次请求都重新计算。数据量上来后应分页或加缓存。这个接口也适合改成服务端搜索。

**P2-4 可避免的重复开销**

- `login` 先对输入密码做一次 `bcrypt.hash`，再 `bcrypt.compare`。每次登录多一次 10 轮哈希，约多几十毫秒。删掉 `hashPassword` 调用。
- `app.module.ts` 配了 `logging: true`，每条 SQL 都打日志。
- 成绩发布逐条 `UPDATE`，可以合并为一条 `CASE` 批量更新。

---

### P3 工程质量与评估

**P3-1 没有测试**

`backend` 与 `frontend` 都没有 `*.spec.ts` / `*.test.*` 文件。`npm test` 配置的 include 为空，跑不出任何用例。现有 `app.e2e-spec.ts` 命名不匹配配置，也不会被执行。

**P3-2 没有性能基线**

没有数据生成脚本、没有接口压测、没有查询计划断言，无法回答"加了索引快了多少"。

**P3-3 前端健壮性**

- 登录页预填演示账号。
- 登录后 `navigate` 再 `window.location.reload()`，整页刷新丢失状态。
- 各页面各自写 `fetch`，返回结构不统一，错误处理重复。
- 前端角色守卫只做显示控制。

---

## 四、下一步路线

### 第 1 周：P0 安全收口

| 任务 | 验收 |
|---|---|
| 新增 `RolesGuard` 与 `@Roles('Staff')`，挂到课程、培养方案、申请审批、时间票、专业分配接口 | 学生 token 调 Staff 接口返回 403 |
| `listAccounts` 去掉 `PasswordHash` 与不必要 PII | 响应中不含 `PasswordHash` |
| 上传改为受控下载：`GET /api/files/:id` 校验归属或 Staff 角色 | 学生无法下载他人附件 |
| 上传加 5MB 限制与 PDF / DOCX / 图片白名单 | 其他类型返回 400 |
| `JWT_SECRET` 启动时必填，Cookie 加 `httpOnly`、`sameSite=lax`、生产环境 `secure` | 缺失密钥时启动失败 |
| 删除敏感 `console.log`，关闭 TypeORM 日志 | 登录日志不含哈希 |
| 登录限流（同一用户名 + IP，5 次/分钟） | 第 6 次返回 429 |

### 第 2 周：P1 正确性

| 任务 | 验收 |
|---|---|
| 服务端校验学分上限，读取已批准 overload 决定 18 / 21 | 直接调 API 超限返回 400 |
| 选课 / 退课放进一个事务，重复注册用 `INSERT OR IGNORE` | 并发与重复请求不产生 500 |
| 控制器返回服务层真实结果 | 无时间票时前端提示失败 |
| 时间票统一存 UTC ISO 或 epoch，查询用 `datetime()` 归一化 | 当天有效票可以选课，单测覆盖 |
| 过度修课唯一约束改为 `CREATE UNIQUE INDEX ... WHERE Status='PENDING'` | 被拒后可重新申请 |
| 增加 Staff 更新学生档案接口与页面 | 需求清单补齐 |
| 成绩枚举校验，未知值拒绝 | 非法成绩返回 400 |
| 学位进度区分主修 / 辅修，标注核心课与选修课 | 页面文案与规则一致 |

### 第 3 周：P2 索引与优化

| 任务 | 验收 |
|---|---|
| 落地上面的 6 条索引 | `EXPLAIN QUERY PLAN` 中热点查询不再出现 `SCAN` |
| 开启 WAL、`busy_timeout`、`synchronous=NORMAL` | 并发压测无 `database is locked` |
| 登录去掉多余哈希；成绩批量更新；目录查询分页 | 登录耗时下降，目录响应裁剪 |
| 写数据迁移脚本，可重复执行 | 旧库执行后索引齐备 |

### 第 4 周：P3 评估与检索

这一块直接对应同学提的 evaluation / indexing / optimization，也最适合写进课程报告。

**评估基线**

1. `scripts/benchmark.py`：2,000 学生、300 课程、40,000 选课、10,000 申请、4,000 时间票，事务批量插入。
2. 同一进程内对比无索引与有索引两个库，预热后 5 轮交错采样，输出 p50 / p95 / p99 与查询计划。
3. `scripts/make_report.py` 生成 `reports/optimization-report.html` 与 `.md`，含前后对比图与完整计划。
4. 后续把 `EXPLAIN QUERY PLAN` 断言接入测试，防止改动退回全表扫描。

**检索增强**

1. 建 FTS5 虚拟表，覆盖课程名、描述、教师名、培养方案名：

```sql
CREATE VIRTUAL TABLE Courses_FTS USING fts5(
  Course_Code UNINDEXED,
  Name,
  Description,
  Teacher_Names,
  Programme_Titles,
  tokenize = 'unicode61'
);
```

2. 用触发器或写入后重建保持同步。
3. 新增 `GET /api/course/search?q=`，按 `bm25()` 排序并返回 `snippet()`。
4. 建 30 条查询的评估集，标注期望课程，比较现有前端子串过滤与 FTS5 的 precision@5、MRR、平均延迟。
5. 报告里给出"子串过滤 vs FTS5"的表格，这是最直观的 storing and retrieval 成果。

**测试**

- Vitest 覆盖鉴权、选课规则、时间票窗口、申请状态流转、成绩发布。
- 目标：核心服务层行覆盖率 70% 以上，P0 与 P1 的每条规则都有对应用例。
- 加一个 GitHub Actions 工作流跑 lint、build、test。

---

## 五、如果 evaluation 指"课程评价"功能

那是一个独立功能，不在 9 月需求清单里。最小实现：

```sql
CREATE TABLE Course_Evaluations (
  Evaluation_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Student_ID INTEGER NOT NULL,
  Course_Code TEXT NOT NULL,
  Term TEXT NOT NULL,
  Teaching_Score INTEGER CHECK (Teaching_Score BETWEEN 1 AND 5),
  Content_Score INTEGER CHECK (Content_Score BETWEEN 1 AND 5),
  Comment TEXT,
  Submit_DT TEXT NOT NULL,
  UNIQUE (Student_ID, Course_Code, Term),
  FOREIGN KEY (Student_ID) REFERENCES Students(Student_ID) ON DELETE CASCADE,
  FOREIGN KEY (Course_Code) REFERENCES Courses(Course_Code) ON DELETE CASCADE
);
```

规则：只有已修完且有成绩的学生可以评价；同一课程同一学期只能提交一次；Staff 只看聚合分与匿名评论，避免关联到学生。

---

## 六、需要先确认的三件事

1. `evaluation` 指系统性能评估，还是学生评教功能。两者工作量与报告写法不同。
2. 是否接受引入 FTS5。SQLite 自带，不增加依赖，但需要重建索引与同步逻辑。
3. 演示数据规模。如果答辩只演示 60 门课，索引收益不明显，需要用生成数据做基准才有说服力。

---

## 七、已经做对的地方

- 全部 SQL 使用参数绑定，没有发现注入点。
- 密码使用 bcrypt，账号创建有事务。
- 成绩发布有任课教师校验，写入有事务。
- 课程目录、教师名单用 JSON 聚合，避免 N+1。
- CGPA 与状态大写用触发器维护，数据口径统一。
- 前端按角色分区路由，页面结构清晰。
