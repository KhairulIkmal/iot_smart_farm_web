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

## Roles & Relationship

The platform operates across two apps — this **Admin Panel** (web) and the **AgroEzuran Mobile App** (Flutter). Admin is the platform operator and device seller. Farmer is the end user. Both connect through the same Firebase backend.

```
╔══════════════════════════════╗          ╔══════════════════════════════╗
║         ADMIN                ║          ║         FARMER               ║
║   (Web Admin Panel)          ║          ║   (AgroEzuran Mobile App)    ║
╠══════════════════════════════╣          ╠══════════════════════════════╣
║                              ║          ║                              ║
║  SETUP PHASE                 ║          ║  ONBOARDING PHASE            ║
║  ─────────────               ║          ║  ────────────────            ║
║  · Generate AGR-XXXX-XXXX   ║─────────▶║  · Enter AGR code to claim  ║
║    codes in batch            ║  device  ║    device                    ║
║  · Copy firmware per device  ║  shipped ║  · Register account          ║
║  · Flash firmware to ESP32   ║          ║  · Set farm location on map  ║
║  · Ship physical device      ║          ║  · Grant permissions         ║
║                              ║          ║                              ║
╠══════════════════════════════╣          ╠══════════════════════════════╣
║                              ║          ║                              ║
║  MONITORING                  ║          ║  DAILY USE                   ║
║  ──────────                  ║          ║  ─────────                   ║
║  · View all farmers'         ║          ║  · Check live sensor tiles   ║
║    profiles, farms, crops    ║          ║    (soil, pH, temp, humidity)║
║  · View device status        ║◀ ─ ─ ─ ─║  · Monitor device online     ║
║    (claimed / available /    ║  data in ║    status                    ║
║     inactive)                ║ Firestore║  · Read weather forecast     ║
║  · Analytics: sensor graphs  ║          ║  · Review notification inbox ║
║    per device & time range   ║          ║                              ║
║                              ║          ║                              ║
╠══════════════════════════════╣          ╠══════════════════════════════╣
║                              ║          ║                              ║
║  NOTIFICATIONS               ║          ║  ALERTS RECEIVED             ║
║  ─────────────               ║          ║  ───────────────             ║
║  · Send immediate alert to   ║─────────▶║  · FCM push notification     ║
║    all users or one farmer   ║   FCM +  ║    appears on phone          ║
║  · Schedule future alerts    ║ Firestore║  · Notification inbox        ║
║  · Use quick templates       ║          ║    (tabbed: All / Critical / ║
║    (maintenance, downtime)   ║          ║     Devices / Weather / etc) ║
║                              ║          ║  · Swipe to archive          ║
║                              ║          ║                              ║
╠══════════════════════════════╣          ╠══════════════════════════════╣
║                              ║          ║                              ║
║  SUPPORT                     ║          ║  SUPPORT                     ║
║  ───────                     ║          ║  ───────                     ║
║  · See all open tickets      ║          ║  · Create support ticket     ║
║    with device + crop info   ║◀────────▶║    (device auto-attached)    ║
║  · Reply in real-time chat   ║  live    ║  · Chat with admin in        ║
║  · Mark resolved / reopen    ║  chat    ║    real time                 ║
║                              ║          ║  · See resolved status       ║
║                              ║          ║                              ║
╠══════════════════════════════╣          ╠══════════════════════════════╣
║                              ║          ║                              ║
║  PLATFORM SETTINGS           ║          ║  AI & AUTOMATION             ║
║  ─────────────────           ║          ║  ────────────────            ║
║  · Edit global crop          ║─────────▶║  · AI Advisor reads global   ║
║    thresholds (soil, pH,     ║  shared  ║    thresholds per crop type  ║
║    temp, humidity min/max)   ║ Firestore║  · Apply thresholds to       ║
║  · Deactivate defective /    ║          ║    irrigation auto-mode      ║
║    lost devices              ║          ║  · Manual or auto pump       ║
║  · Export database backup    ║          ║    control via RTDB command  ║
║                              ║          ║                              ║
╚══════════════════════════════╝          ╚══════════════════════════════╝
```

### Shared Firebase Layer

```
                        FIREBASE
          ┌──────────────────────────────────┐
          │                                  │
          │  Firestore                        │
          │  ├─ users/          ◀── admin reads, farmer writes profile  │
          │  ├─ devices/        ◀── admin creates, farmer claims        │
          │  ├─ crops/          ◀── farmer creates, admin reads         │
          │  ├─ notifications/  ◀── admin writes, farmer reads          │
          │  ├─ support_tickets/◀── farmer creates, admin replies       │
          │  └─ crop_thresholds/◀── admin edits, AI advisor reads       │
          │                                  │
          │  Realtime Database                │
          │  └─ sensors/{deviceId}/  ◀── ESP32 writes, farmer reads    │
          │       └─ history/        ◀── ESP32 writes, admin reads      │
          │                                  │
          │  FCM                              │
          │  └─ push tokens       ◀── admin triggers, farmer receives  │
          └──────────────────────────────────┘
```

---

## System Flow

### Admin Operational Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  ACCESS                                                              │
│                                                                      │
│  Visit /admin → Login (Email + Password)                             │
│    └─ Role check: users/{uid}.role == "admin"                        │
│         ├─ Granted → Dashboard loaded                                │
│         └─ Denied  → "Access Denied" + signed out                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  DEVICE LIFECYCLE                                                    │
│                                                                      │
│  Settings → Device Inventory                                         │
│    ├─ Generate Codes (batch 1–50)                                    │
│    │    └─ AGR-XXXX-XXXX codes written to Firestore devices/         │
│    │         status: "available" · auto-named ESP32_XXX doc ID       │
│    │                                                                 │
│    ├─ Copy Firmware (per device)                                     │
│    │    └─ Full ESP32 sketch copied with #define DEVICE_ID filled    │
│    │         └─ Flash to hardware → ship to farmer                   │
│    │                                                                 │
│    ├─ Farmer claims device → status: "claimed"                       │
│    │    └─ claimed_by, farmer_name, assigned_crop_id recorded        │
│    │                                                                 │
│    └─ Deactivate → status: "inactive"                                │
│         └─ Blocks future claims (defective / lost / end of life)     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  USER MANAGEMENT                                                     │
│                                                                      │
│  Users Page                                                          │
│    ├─ View all registered farmers (search, filter by role)           │
│    ├─ Open farmer detail modal                                       │
│    │    ├─ Profile tab  — name, email, UID, joined date              │
│    │    ├─ Farm tab     — farm info, GPS location                    │
│    │    └─ Crops tab    — crop cards with AGR code + status          │
│    ├─ Edit user role (farmer / admin)                                │
│    └─ Delete account                                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  NOTIFICATIONS                                                       │
│                                                                      │
│  Notifications Page                                                  │
│    ├─ Send Now                                                       │
│    │    ├─ Target: All Users or specific farmer                      │
│    │    ├─ Type: Info / Warning / Alert / Success                    │
│    │    └─ Dispatched immediately → appears in farmer's app inbox    │
│    │                                                                 │
│    ├─ Schedule                                                       │
│    │    ├─ Pick date + time via Flatpickr calendar                   │
│    │    ├─ Saved to scheduled_notifications (status: "scheduled")    │
│    │    └─ Manual "Send Now" to dispatch when ready                  │
│    │                                                                 │
│    └─ Quick Templates                                                │
│         └─ System Maintenance / System Down / System Update          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  ANALYTICS                                                           │
│                                                                      │
│  Analytics Page                                                      │
│    ├─ Select device + time range (24h / 7d / 30d / Custom)          │
│    └─ Chart.js graphs from RTDB devices/{id}/history/               │
│         └─ Soil Moisture · Temperature · Humidity · pH · Water Level │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  SUPPORT                                                             │
│                                                                      │
│  Support Page                                                        │
│    ├─ View all tickets (filter by status)                            │
│    ├─ Open ticket → real-time chat thread                            │
│    │    └─ Device info card auto-shown (AGR code, device status)     │
│    ├─ Reply to farmer                                                │
│    └─ Mark resolved / reopen                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Admin → Farmer System Interaction

```
ADMIN PANEL                                    FARMER APP
───────────────────────────────────────────────────────────────────
Generate AGR-XXXX-XXXX codes
  └─ Firestore: devices/{docId}
       status: available
            │
            │  (device physically shipped to farmer)
            │
            ▼
                                               Farmer enters AGR code
                                                 └─ App claims device
                                                      Firestore: status: claimed
                                                      └─ RTDB listener starts
                                                           sensors/{docId} → live data

Send notification to farmer
  └─ Firestore: notifications/{uid}/items
                                               FCM push received
                                                 └─ Notification inbox updated

Farmer opens support ticket
  └─ Firestore: support_tickets/{id}            
       device + crop auto-attached             
            │
            ▼
Admin sees ticket in Support page
  └─ Reply → Firestore: messages/{msgId}
                                               Farmer receives reply in real-time chat
```

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

*Part of the AgroEzuran IoT Smart Farm system*
