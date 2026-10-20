# Logic-Q1 CRM frontend

A responsive React + Vite dashboard wired to the endpoints in the provided OpenAPI document.

## Run locally

1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to your backend origin (default in the example: `http://3.85.210.31:8000`).
3. Run `npm install` then `npm run dev`.
4. Open the URL printed by Vite.

## Included areas
- Login, registration, forgot-password flow, current-user profile
- Dashboard overview and organization activity feed
- Leads: list/create/view/update/delete, convert to contact, send email
- Contacts: owner/org lists, create/update/delete, import CSV/file, export
- Deals: list/create/view/update/delete
- Tasks: list, board, create, view/update/delete, move between statuses
- Organizations: list/create/view
- Users: paginated list, view/update, activate/deactivate
- Organization invites: create and validate/register from invite
- Watchlist: read/create/delete
- Activity timeline: entity timeline and organization feed
- API Console: all routes from the supplied OpenAPI schema for less common operations

## Notes
- The backend's response schemas are often generic (`object`), so the UI normalizes arrays and common `content`/`data` wrappers.
- JWT is stored in `localStorage` as `crm_token` and sent as `Authorization: Bearer ...`. Use **API Settings** to set the token manually if your login response shape differs.
- The backend must allow CORS from the Vite origin. If the browser reports a CORS error, configure CORS in Spring Boot or use a development proxy.
- Some request DTOs in the OpenAPI document have optional properties that may be required by backend validation. Adjust the form payload to match backend validation if needed.
- This UI does not assume unsupported list endpoints for single-record resources; it uses the documented list endpoints where available.
