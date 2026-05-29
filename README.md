# AgroEzuran — Web Admin Panel

A browser-based admin dashboard for managing the AgroEzuran IoT Smart Farm platform. Built as a single-page application using vanilla JavaScript and Tailwind CSS, backed entirely by Firebase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | Vanilla HTML + JavaScript (no build step) |
| Styling | Tailwind CSS v3 (CDN, JIT) |
| Icons | Google Material Symbols |
| Charts | Chart.js (sensor analytics) |
| Date/Time Picker | Flatpickr (calendar + time) |
| Auth | Firebase Auth (Email/Password, admin role gated) |
| Database | Cloud Firestore |
| Realtime Data | Firebase Realtime Database |
| Hosting | Firebase Hosting / any static host |

---

## Project Structure

```
public/admin/
├── index.html          # Full SPA — all pages rendered as toggled sections (2 168 lines)
├── app.js              # All logic — auth, data loading, charts, forms (5 032 lines)
└── firebase-config.js  # Firebase project credentials (not committed)
```

No build step. No package manager. Drop the three files on any static host and it works.

---

## Pages & Features

### Dashboard (Overview)
- KPI cards: Total Users, Total Farms, Total Crops, Active Devices
- Device status donut chart (online / offline / error)
- Support tickets status chart (open / in_progress / resolved)
- Recent users table (last 5 registered)
- Recent farms table (last 5 added)
- Announcements section (admin-posted messages to all users)
- Crop distribution bar chart per farm (selectable farm dropdown)

### Users
- Full user table with search + role badge
- View user details modal (tabbed: Profile, Farm, Crops, Devices, Notifications)
- Copy UID / email to clipboard
- Edit user role
- Delete user

### Farms
- All farms with owner name, location, size, type
- View farm details modal (farm info + linked crops + map pin)
- Farm location map preview (opens OSM in new tab)

### Notifications
- Send notification form:
  - **Send Now** — dispatches immediately to all users or a specific user
  - **Schedule** — saves to `scheduled_notifications` with Flatpickr calendar/time picker
  - Quick templates: System Maintenance, System Down, System Update
  - Recipient: All Users or specific user (dropdown populated from Firestore)
  - Type: Info / Warning / Alert / Success
- Scheduled Notifications card — lists pending items with Send Now / Cancel per item
- Notifications History table — all past sent notifications

### Analytics
- Per-device sensor graphs: Soil Moisture, Temperature, Water Level, Humidity, pH
- Time range filter: 24h / 7d / 30d / All / Custom date (Flatpickr)
- Device selector dropdown
- Real-time Chart.js line graphs from Firebase RTDB history

### Support
- All support tickets table (filter: open / in_progress / resolved)
- View ticket + full chat thread in modal
- Reply to ticket, update status, close ticket

### Settings
- Admin profile (name, email display)
- Global crop thresholds editor (soil, pH, temp, humidity min/max per crop type)
- Database statistics (document counts per collection)
- Export database backup (JSON download)

---

## Architecture

```
Browser
  └─ index.html  (layout + all page HTML, sections hidden/shown by JS)
       └─ app.js
            ├─ Firebase Auth  ─── role check → admin only
            ├─ Firestore      ─── users, farms, crops, tickets, notifications
            ├─ RTDB           ─── live sensor readings for analytics charts
            └─ Pages
                 ├─ loadDashboardData()
                 ├─ loadAllUsers()
                 ├─ loadAllFarms()
                 ├─ loadAllNotifications()  +  sendNotification()
                 ├─ loadScheduledNotifications()
                 ├─ loadAnalyticsData()     +  initializeDatePicker()
                 ├─ loadSupportTickets()
                 └─ loadSettingsPage()
```

Page navigation is handled by `navigateToPage(pageName)` which shows/hides the relevant `<section>` and calls the matching load function.

---

## Admin Role Setup

Only users with `role: "admin"` in their Firestore `users` document can access the panel. All other users are shown an "Access Denied" error and signed out.

To grant admin access:
1. Go to Firestore → `users` → find the document for the target user
2. Set the field `role` to `"admin"`

---

## Setup & Deployment

### 1. Firebase Config

Create `public/admin/firebase-config.js`:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "YOUR_PROJECT",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db   = firebase.firestore();
const rtdb = firebase.database();
```

### 2. Firestore Indexes

Required composite indexes (create via Firebase Console → Firestore → Indexes):

| Collection | Fields | Order |
|---|---|---|
| `support_tickets` | `farmer_uid` ASC + `updated_at` DESC | — |
| `notifications` | `farmer_id` ASC + `sentBy` ASC | — |
| `scheduled_notifications` | `status` ASC | — |

### 3. Deploy

**Firebase Hosting (recommended):**
```bash
firebase deploy --only hosting
```

**Any static host:** Upload the entire `public/` folder. No server required.

---

## Notification Scheduling

When the admin switches to **Schedule** mode:
1. A Flatpickr calendar pops up — pick date and time (AM/PM)
2. On submit, the notification is saved to `scheduled_notifications` with `status: "scheduled"`
3. The Scheduled Notifications card lists all pending items
4. Click **Send Now** on any scheduled item to dispatch it immediately to the target users
5. Click **Cancel** to delete the scheduled item

Scheduled notifications are NOT auto-dispatched by the panel — they require a manual "Send Now" click (or a Cloud Function trigger if you extend the system).

---

## Firestore Collections Used

| Collection | Used For |
|---|---|
| `users` | User management, admin role check, notification targeting |
| `users/{id}/farm/details` | Farm info per user |
| `users/{id}/farm/location` | Farm GPS coordinates |
| `crops` | Crop list per user |
| `support_tickets` | Support ticket list + status |
| `support_tickets/{id}/messages` | Chat messages per ticket |
| `notifications` | Sent admin notifications (appears in mobile app inbox) |
| `notifications/{uid}/items` | Per-user personal notifications |
| `scheduled_notifications` | Pending scheduled notification queue |
| `crop_thresholds` | Global optimal sensor ranges per crop type |

---

## Notes

- No framework, no build pipeline — safe to edit and reload directly in browser
- All admin actions (send notification, delete user, update status) write directly to Firestore
- Analytics charts read historical data from Firebase RTDB under `devices/{deviceId}/history/`
- The panel is intentionally single-file per concern (`index.html` + `app.js`) for simplicity of deployment and review

---

*Part of the AgroEzuran IoT Smart Farm system — Built for PutraHack 2026*
