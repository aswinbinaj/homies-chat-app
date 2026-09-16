# 🤙 HomiesOnly - Private Ephemeral Real-Time Friends Chat

A secure, modern, OLED black, mobile-responsive private group chat application for friends built with **React + Vite + Tailwind CSS + Supabase**.

Designed for ultimate privacy and simplicity: **invite-only registration**, **real-time messages**, **online presence**, **typing indicators**, **permanent Privacy Guard (anti-screenshot & window-blur protections)**, and **strict 1-hour message expiration** where expired messages automatically disappear and are permanently deleted.

---

## 🌟 Key Features

* 🔐 **Invite-Only Registration**: Prevents unauthorized signups. Verification is enforced at the database level.
* ⏳ **1-Hour Message Expiration**: Every message is automatically given an `expires_at = created_at + 1 hour`. The database and frontend strictly filter and purge expired messages.
* ⚡ **Supabase Realtime**: Instant message delivery using PostgreSQL publication changes. No manual page refresh.
* 👥 **Online Presence**: Track who's online and display last-seen timestamps for offline friends using Supabase Presence.
* ⌨️ **Live Typing Indicators**: See who is typing in real time via temporary Realtime Broadcast (never stored in the database).
* 🛡️ **Row Level Security (RLS)**: Fine-grained security on PostgreSQL tables (`profiles`, `invites`, `messages`).
* 👑 **Admin Dashboard (`/admin`)**: Create invite codes, view active/expired invites, revoke invites, and manage member accounts.
* 📱 **Mobile & Desktop Responsive**: Sticky message input, mobile keyboard handling, and slide-out member drawer.
* 🌓 **Dark / Light Theme**: Clean dark and light modes with localStorage persistence.
* 🔒 **XSS & Injection Safe**: Plain-text message rendering with strict character limits (max 1,000 characters).

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, React Router DOM v6
* **Backend / Database**: Supabase (PostgreSQL 15+)
* **Authentication**: Supabase Auth (Email + Password + Invite Code verification)
* **Realtime**: Supabase Realtime (Postgres Changes, Presence, Broadcast)
* **Client Library**: `@supabase/supabase-js`
* **Hosting Target**: Cloudflare Pages, Vercel, or Netlify (Zero paid services required)

---

## 📁 Project Structure

```
chat-app/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx          # Email & password login
│   │   │   └── RegisterForm.jsx       # Registration with invite code check
│   │   ├── Chat/
│   │   │   ├── ChatArea.jsx           # Main chat viewport layout
│   │   │   ├── MessageInput.jsx       # Sticky input with 1000 char counter
│   │   │   ├── MessageItem.jsx        # Rounded bubble with expiration countdown
│   │   │   ├── MessageList.jsx        # Message list with day dividers & auto-scroll
│   │   │   └── TypingIndicator.jsx    # Bouncing typing indicators
│   │   ├── Layout/
│   │   │   ├── Navbar.jsx             # Top bar with member badge & theme switch
│   │   │   └── Sidebar.jsx            # Online/offline friends drawer
│   │   └── UI/
│   │       ├── Badge.jsx              # Status badges
│   │       ├── Button.jsx             # Reusable buttons with loading state
│   │       ├── Card.jsx               # Container cards
│   │       ├── Input.jsx              # Text inputs with icon and error handling
│   │       └── Modal.jsx              # Accessible modal dialog
│   ├── context/
│   │   ├── AuthContext.jsx            # Supabase session, user, and profile state
│   │   └── ThemeContext.jsx           # Dark/light theme management
│   ├── hooks/
│   │   ├── useAuth.js                 # Auth hook
│   │   ├── useMessages.js             # Real-time messages & client-side expiration
│   │   ├── usePresence.js             # Real-time presence & last_seen tracking
│   │   └── useTyping.js               # Real-time typing broadcast
│   ├── lib/
│   │   └── supabase.js                # Supabase client initialization
│   ├── pages/
│   │   ├── Admin.jsx                  # Admin invite & member management
│   │   ├── Chat.jsx                   # Main chat route (/chat)
│   │   ├── Login.jsx                  # Sign in route (/login)
│   │   ├── Profile.jsx                # Profile route (/profile)
│   │   └── Register.jsx               # Sign up route (/register)
│   ├── utils/
│   │   ├── formatters.js              # Time and expiration helpers
│   │   └── helpers.js                 # Text validation & avatar generators
│   ├── App.jsx                        # React Router configuration
│   ├── main.jsx                       # React DOM entrypoint
│   └── index.css                      # Tailwind styling & custom scrollbars
├── supabase/
│   ├── migrations/
│   │   └── 20260914000000_init_schema.sql # Complete database migration script
│   └── functions/
│       └── cleanup-expired/
│           └── index.ts               # Scheduled cleanup Edge Function
├── tests/
│   └── app.test.js                    # Automated validation & expiration tests
├── .env.example                       # Environment variable template
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🗄️ Supabase Setup & Database Migration

### 1. Create a Supabase Project
1. Go to [https://database.new](https://database.new) and create a free Supabase project.
2. Note your **Project URL** and **Anon Public Key** from **Project Settings -> API**.

### 2. Run Database Migration
1. In your Supabase Dashboard, open the **SQL Editor**.
2. Copy the entire contents of [`supabase/migrations/20260914000000_init_schema.sql`](file:///e:/DIGITAL/chat-app/supabase/migrations/20260914000000_init_schema.sql).
3. Paste into the SQL Editor and click **Run**.

This migration script sets up:
* `profiles`, `invites`, `messages`, and `invite_check_attempts` tables.
* Database indexes for fast querying on `expires_at`, `created_at`, `user_id`, and `code`.
* Row Level Security (RLS) policies on all tables.
* Database trigger `on_auth_user_created` on `auth.users`:
  * Atomically verifies the invite code during registration.
  * Marks the invite code as used by the new user.
  * Automatically grants admin privileges to the very first registered user.
* Enables Realtime on the `messages` table.
* Adds two default bootstrap invite codes:
  * `WELCOME-FRIENDS-2026`
  * `VIP-GROUP-CHAT`

---

## 🛡️ Database Schema & RLS Policies

### Tables
| Table | Description | Columns |
| :--- | :--- | :--- |
| `profiles` | Member profiles linked to `auth.users` | `id`, `username`, `avatar_url`, `is_admin`, `is_disabled`, `created_at`, `last_seen` |
| `invites` | Invite codes for registration | `id`, `code`, `created_at`, `expires_at`, `used`, `used_by`, `created_by` |
| `messages` | Group chat messages with 1-hour expiration | `id`, `user_id`, `message`, `created_at`, `expires_at` |

### Row Level Security (RLS) Rules
1. **Profiles**:
   * `SELECT`: Authenticated members can view profiles of other members.
   * `UPDATE`: Users can update only their own profile (`avatar_url`, `username`). They cannot escalate `is_admin` or change `id`.
   * Admins can update any profile (e.g. deactivate an account).
2. **Messages**:
   * `SELECT`: Authenticated members can only select messages where `expires_at > NOW()`. Expired messages are invisible.
   * `INSERT`: Users can only insert messages as themselves (`auth.uid() = user_id`), non-empty, max 1,000 characters.
   * `UPDATE`: Disallowed for all users.
   * `DELETE`: Restricted to admins or database cleanup functions.
3. **Invites**:
   * Normal users cannot view, insert, or delete from the `invites` table.
   * Only admin users (`is_admin = TRUE`) can view and manage invites.
   * Registration invite verification uses the secure function `check_invite_valid(code)` and trigger `handle_new_user()`.

---

## ⏳ One-Hour Message Expiration Architecture

Every message expires exactly 1 hour after creation:

```
Message Sent: 2026-09-14 13:00:00
Expires At:   2026-09-14 14:00:00
```

1. **Database Default**:
   `expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '1 hour')`
2. **Database Query Filtering**:
   All message queries enforce `.gt('expires_at', new Date().toISOString())`.
3. **RLS Database Policy**:
   `USING (expires_at > NOW())` ensures no client can query expired messages even if requested.
4. **Client-side Purge**:
   The chat window runs an in-memory interval every 2 seconds. When a message's expiration passes, it is immediately removed from the chat UI without requiring a page refresh.
5. **Scheduled Permanent Deletion**:
   * **With `pg_cron`**: Runs every 5 minutes:
     ```sql
     SELECT cron.schedule('cleanup-expired-messages', '*/5 * * * *', 'SELECT public.cleanup_expired_messages();');
     ```
   * **With Supabase Edge Function**: Documented in [`supabase/functions/cleanup-expired/index.ts`](file:///e:/DIGITAL/chat-app/supabase/functions/cleanup-expired/index.ts). Can be triggered via a GitHub Action or free cron service (e.g., cron-job.org).

---

## 🚀 Local Development

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd chat-app
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and provide your Supabase details:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> [!WARNING]
> Never include `SUPABASE_SERVICE_ROLE_KEY` in `.env` or any frontend file.

### 3. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run Automated Tests
```bash
npm test
```

---

## 👑 First Admin Setup

1. Open [http://localhost:5173/register](http://localhost:5173/register).
2. Enter your desired email, password, username, and use the initial bootstrap invite code:
   ```
   WELCOME-FRIENDS-2026
   ```
3. Because you are the first user registered in the database, the trigger automatically assigns you `is_admin = TRUE`.
4. Navigate to `/admin` to generate fresh invite codes for your friends!

---

## 🌐 Production Deployment

### Deploy to Cloudflare Pages
1. Push your repository to GitHub or GitLab.
2. In Cloudflare Dashboard, go to **Workers & Pages** -> **Create application** -> **Pages**.
3. Connect your repository.
4. Build settings:
   * **Framework preset**: Vite
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
5. Under **Environment variables**, add:
   * `VITE_SUPABASE_URL`: Your Supabase Project URL
   * `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
6. Click **Save and Deploy**.

### Deploy to Vercel
1. Install Vercel CLI or import the repository in the Vercel Web Dashboard.
2. Settings:
   * **Framework Preset**: Vite
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to **Project Environment Variables**.
4. Deploy.

---

## 🔒 Security Checklist

* [x] **No Service-Role Key on Frontend**: Only public Anon Key and Project URL used.
* [x] **Row Level Security**: Enabled on `profiles`, `invites`, and `messages`.
* [x] **Invite Verification**: Handled atomically in PostgreSQL during `auth.users` creation.
* [x] **XSS Protection**: All message content rendered as raw text strings through React elements. No `dangerouslySetInnerHTML`.
* [x] **Message Limits**: Checked on both frontend and database constraints (`CHECK (char_length(trim(message)) > 0 AND char_length(message) <= 1000)`).
* [x] **Privileged Actions**: Creating/revoking invites and deactivating users requires `is_admin = TRUE` verified via `auth.uid()`.
* [x] **Ephemeral Data**: Expired messages hidden via RLS and physically deleted via scheduled cleanup.
