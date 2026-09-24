
# 🎓 Academic Management Portal

A full-stack application for managing academic workflows, featuring separate frontend and backend architectures.

---
## 🛠️ Tech Stack

* **Frontend:** React JS 
* **Backend:** NestJS Framework
* **Database:** SQLite
* **Package Manager:** `npm`



---
## Database Connection

The database for this project is provided in `pjDB.db` \
The backend is directly connecting to this db file for performing different kinds of DB operations.\
\
For easy manipulation of data, you can download [DB Browser for SQLite] (https://sqlitebrowser.org/dl/) for connecting to the DB.\
If you want to create the same DB from scratch, please refer to `create.sql`, insertion statement can be found in `demoAccount.sql` and `insertCourses.sql` as well

## 📋 Prerequisites

Ensure you have the correct Node.js version installed before running the project.

- **Required Node.js Version:** `v20.20.0`
- [Download Node.js v20.20.0](https://nodejs.org/en/blog/release/v20.20.0)

### Verify Node Version

```bash
node --version
# Output should be: v20.20.0

```

> ⚠️ **Note:** If your version is not `v20.20.0`, please uninstall your current Node.js version and install the required version linked above.

---

## 🚀 How to run

Follow the instructions below to set up and run both the frontend and backend applications in development mode.

### 💻 Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm i

# Start the development server
npm run dev

```

---

### ⚙️ Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm i

# Start the development server
npm run start:dev

```

---

