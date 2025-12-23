# RBAC Configurator

RBAC Configurator is an internal web application for defining and managing **roles** and **permissions** for a larger system. It provides a simple dashboard where authenticated administrators can create permissions, create roles, and link them together using a relational RBAC schema.

---

## Features

- **Custom authentication**
  - Email/password signup and login
  - Password hashing with bcrypt
  - JWT-based sessions
  - Only authenticated users can access the dashboard

- **Permission management**
  - Create, read, update, and delete permissions
  - Each permission has a unique name and optional description
  - “Reverse view” to see which roles are associated with a permission

- **Role management**
  - Create, read, update, and delete roles
  - Attach and detach permissions from a role
  - Overview of all roles configured in the system

- **Admin access control**
  - Seeded primary admin account
  - Admin-only page for managing who can log into the tool (optional)
- **Bonus**
  - Natural-language input box that can interpret simple commands to create permissions or assign them to roles

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Auth:** JWT + bcrypt

---

## Getting Started

### Prerequisites

- Node.js (LTS)
- PostgreSQL database (Neon connection string)

### Installation

npm install

text

### Environment variables

Create a `.env` file in the project root:

DATABASE_URL=postgresql://...
JWT_SECRET=your_long_random_secret
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_ADMIN_EMAIL=admin@rbac.it
ADMIN_EMAIL=admin@rbac.it
ADMIN_PASSWORD=rabc@admin
ADMIN_USER_ID=admin

text

- `DATABASE_URL` – PostgreSQL connection string used by Prisma  
- `JWT_SECRET` – secret key used to sign JWTs  
- `NEXT_PUBLIC_API_BASE_URL` – base URL for API calls (leave empty for local dev)  
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` – initial administrator credentials  
- `NEXT_PUBLIC_ADMIN_EMAIL` – email allowed to access the admin “Login Access” page  
- `ADMIN_USER_ID` – fixed ID used for the seeded admin user

### Database setup

Run Prisma migrations:

npx prisma migrate dev --name init
npx prisma generate

text

Optionally seed an initial admin user and base roles/permissions if a seed script is provided.

---

## Running the application

npm run dev

text

- Frontend: http://localhost:5173  
- Backend API: http://localhost:4000

---

## Application Routes

### Frontend routes

- `/login` – sign in with email and password  
- `/signup` (optional) – register a new account  
- `/dashboard/permissions` – manage permissions and view reverse mappings  
- `/dashboard/roles` – manage roles and their assigned permissions  
- `/dashboard/access` – manage admin logins (restricted to main admin)

All `/dashboard/*` routes are protected and require a valid JWT.

### API endpoints (summary)

- `POST   /api/auth/login`
- `POST   /api/auth/signup` (if enabled)
- `GET    /api/auth/users`
- `POST   /api/auth/users`
- `PUT    /api/auth/users/:id/password`
- `DELETE /api/auth/users/:id`

- `GET    /api/permissions`
- `POST   /api/permissions`
- `PUT    /api/permissions/:id`
- `DELETE /api/permissions/:id`
- `GET    /api/permissions/:id/roles`

- `GET    /api/roles`
- `POST   /api/roles`
- `PUT    /api/roles/:id`
- `DELETE /api/roles/:id`
- `GET    /api/roles/:id/permissions`
- `PUT    /api/roles/:id/permissions`

---

## RBAC Concept (brief)

Role-Based Access Control (RBAC) links **users → roles → permissions**.  
Users are assigned one or more roles, roles group one or more permissions, and the application checks permissions before allowing sensitive actions. This configurator provides the interface and persistence layer for that mapping.