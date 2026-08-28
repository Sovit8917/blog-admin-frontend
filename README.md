# Blog Admin — Phase 1

Next.js 14 (App Router) + TypeScript + Tailwind admin dashboard for the existing
NestJS blog backend. **No backend files were modified.**

## Covers (Phase 1)
- Authentication (login, auto access-token refresh, role gate: SUPER_ADMIN / ADMIN / EDITOR / AUTHOR)
- Dashboard overview (stats + recent posts + recent activity, from `GET /admin/dashboard`)
- Posts — list (search/filter/paginate), create, edit, delete (`/cms/posts`)
- Categories — full CRUD, parent/order/active toggle (`/categories`)
- Tags — create/list/delete (`/tags`)
- Comments — moderation queue by status: approve / reject / spam / delete (`/cms/comments`)
- Users — list/search/filter by role, change role, activate/suspend, delete (`/admin/users`)
- Media Library — drag-and-drop upload, grid gallery, copy URL, delete (`/media`)
- Settings — general / social links / default SEO (`/cms/settings`)

Not in Phase 1 (planned for Phase 2): Jobs & Applications, Companies, Skills,
Ads, Affiliate Links, Sponsors, Newsletter, Analytics, Audit Log, SEO tools.

## Setup

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL to your backend
npm run dev                        # runs on http://localhost:3001
```

`NEXT_PUBLIC_API_URL` must point at your backend's API root **including** its
global prefix, e.g. `http://localhost:4000/api/v1`.

## Backend requirements
- Set `ADMIN_URL=http://localhost:3001` (or wherever this app is deployed) in
  the backend's `.env` — it's included in the CORS allow-list and the refresh
  cookie is `sameSite: lax`, so this only works cleanly when both apps share
  a top-level domain (e.g. both on `localhost`, or both on `*.yourdomain.com`).
- Log in with a SUPER_ADMIN, ADMIN, EDITOR, or AUTHOR account — USER-role
  accounts are rejected at login.

## Notes
- API responses are unwrapped from the backend's `{ success, data }` envelope
  automatically (`src/lib/api.ts`).
- 401s trigger a silent `/auth/refresh` (using the httpOnly cookie) and retry
  the original request once before redirecting to `/login`.
- The UI kit (`src/components/ui`) is hand-built with Tailwind — no external
  component library — so it's easy to restyle.
