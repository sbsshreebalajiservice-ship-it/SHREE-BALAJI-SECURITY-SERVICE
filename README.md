# Shree Balaji Security Services Pvt. Ltd.

Full-stack corporate security agency website with a built-in Admin Panel (`/admin`), PostgreSQL persistence (with automatic local JSON fallback), and Railway-ready deployment.

## Features

- **Public Website (`/`)**:
  - Company hero section, 4-metric credentials strip, dynamic services showcase, compliance & operations overview, 24/7 emergency desk, and validated quote request form.
- **Admin Panel (`/admin`)**:
  - **Inquiries Management**: View incoming quote requests, search and filter by status (`Pending`, `Contacted`, `Completed`), update status, and remove records.
  - **Company & Website Settings**: Live-edit company name, tagline, contact phone/email/address, hero copy, statistics, and "Why Choose Us" compliance points.
  - **Manage Services**: Add, edit, or remove service offerings and select showcase photography.

## Deploying to GitHub + Railway

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Shree Balaji Security website and admin panel"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. **Deploy on Railway**:
   - Create a new project on Railway from your GitHub repository.
   - Add a **PostgreSQL** database plugin in the same Railway project (`DATABASE_URL` is injected automatically).
   - Add an Environment Variable in Railway:
     - `ADMIN_PASSWORD` = your chosen strong admin password.
     - (Optional) `SESSION_SECRET` = a long random string so admin login sessions survive server restarts.
   - Railway builds with `npm run build` and starts with `npm start` (`node server.ts`).
3. **Access Admin Panel**:
   - Visit `https://<your-railway-domain>/admin`.
   - If `ADMIN_PASSWORD` is not configured in environment variables yet, the `/admin` page offers a one-time setup form to create your admin password.
