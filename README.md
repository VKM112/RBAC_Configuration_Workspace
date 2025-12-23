# RBAC Configurator (Next.js)

Internal tool for managing roles and permissions with custom JWT auth.

## Development

```bash
npm install
npm run dev
```

## Environment Variables

```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_ADMIN_EMAIL=admin@rbac.it
ADMIN_EMAIL=admin@rbac.it
ADMIN_PASSWORD=rabc@admin
ADMIN_USER_ID=admin
```

`NEXT_PUBLIC_API_BASE_URL` can be left empty for same-origin API requests.
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_USER_ID` default to the values above if omitted.
`NEXT_PUBLIC_ADMIN_EMAIL` controls which account can see the Login Access UI (defaults to `admin@rbac.it`).

## Key Routes

- `/login`
- `/dashboard/permissions`
- `/dashboard/roles`
- `/dashboard/access`

`/dashboard/access` is visible only to the primary admin account.

## API Endpoints

- `POST /api/auth/login`
- `GET/POST /api/auth/users`
- `PUT /api/auth/users/:id/password`
- `DELETE /api/auth/users/:id`
- `GET/POST /api/permissions`
- `PUT/DELETE /api/permissions/:id`
- `GET /api/permissions/:id/roles`
- `GET/POST /api/roles`
- `PUT/DELETE /api/roles/:id`
- `GET/PUT /api/roles/:id/permissions`
