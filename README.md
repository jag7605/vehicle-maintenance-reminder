# VMR — Vehicle Maintenance Reminder

VMR is a proof-of-concept garage management Progressive Web App (PWA) built as a group software development project for our BCIS R&D Project. It is an academic project, scoped for internal testing and a supervisor showcase rather than production deployment.

The app manages customer vehicles, service schedules, automated multi-channel reminders, appointment booking, service history, and job completion tracking for a garage business. The client is an internal AUT client representing a small garage owner's perspective, not an actual garage owner.

## Live Demo

- Frontend: https://vehicle-maintenance-reminder.vercel.app/ 
- Backend health check: https://vmr-api-llz8.onrender.com/api/health 

## Features

- Customer and staff accounts with role-based access from a single login page
- Vehicle management, including custom make/model entry with typo detection
- Service scheduling and appointment booking, with a calendar view
- Automated multi-channel reminders (email, browser push; SMS supported in code but disabled for this deployment)
- Job completion tracking and service history
- Admin dashboard with booking/job summaries and overdue/due-soon service tracking

## Tech Stack

**Frontend**
- React + Vite (PWA)
- Deployed on Vercel

**Backend**
- Node.js / Express (CommonJS)
- Deployed on Render

**Database & Auth**
- Firebase Auth + Firestore

**Notifications**
- Email via Resend
- Push notifications via web-push (VAPID)
- SMS via Vonage (disabled — NZ carrier registration requirement; kept in the codebase as a documented known limitation)

## Project Structure

This is a monorepo containing two applications:

```
Directory structure:
└── vehicle-maintenance-reminder/
    ├── README.md
    ├── client/
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package.json
    │   ├── vercel.json
    │   ├── vite.config.js
    │   ├── .env.example
    │   ├── dev-dist/
    │   │   └── registerSW.js
    │   └── src/
    │       ├── App.jsx
    │       ├── main.jsx
    │       ├── sw.js
    │       ├── component/
    │       │   ├── CustomerLayout.jsx
    │       │   ├── CustomerLayoutShell.css
    │       │   ├── DeliveryStatusBadges.css
    │       │   ├── DeliveryStatusBadges.jsx
    │       │   ├── FormControls.css
    │       │   ├── JobCompleteModal.css
    │       │   ├── JobCompleteModal.jsx
    │       │   ├── MessagePopup.css
    │       │   ├── MessagePopup.jsx
    │       │   ├── NotificationPopup.css
    │       │   ├── NotificationPopup.jsx
    │       │   ├── NotificationPreferenceForm.css
    │       │   ├── NotificationPreferenceForm.jsx
    │       │   ├── Pagination.css
    │       │   ├── Pagination.jsx
    │       │   ├── Sidebar.css
    │       │   ├── Sidebar.jsx
    │       │   ├── StaffLayout.css
    │       │   ├── StaffLayout.jsx
    │       │   ├── TableCard.css
    │       │   ├── TableCard.jsx
    │       │   ├── VehicleNotificationHistory.css
    │       │   ├── VehicleNotificationHistory.jsx
    │       │   ├── adminCustomers/
    │       │   │   ├── CustomerTable.jsx
    │       │   │   ├── SignUpModal.css
    │       │   │   └── SignUpModal.jsx
    │       │   ├── adminNotifications/
    │       │   │   ├── ReminderLog.css
    │       │   │   └── ReminderLog.jsx
    │       │   ├── booking/
    │       │   │   ├── AdminCreateBookingModal.css
    │       │   │   ├── AdminCreateBookingModal.jsx
    │       │   │   ├── BookingCalendar.css
    │       │   │   ├── BookingCalendar.jsx
    │       │   │   ├── BookingDetailModal.css
    │       │   │   └── BookingDetailModal.jsx
    │       │   ├── customerAppointments/
    │       │   │   ├── BookingCalendarPicker.jsx
    │       │   │   ├── SlotBookingForm.css
    │       │   │   ├── SlotBookingForm.jsx
    │       │   │   ├── UpcomingAppointmentsList.css
    │       │   │   └── UpcomingAppointmentsList.jsx
    │       │   └── customerProfile/
    │       │       ├── AddVehicleForm.jsx
    │       │       ├── DeleteVehicleModal.css
    │       │       ├── DeleteVehicleModal.jsx
    │       │       ├── EditVehicleModal.css
    │       │       ├── EditVehicleModal.jsx
    │       │       ├── Sendnotificationmodal.css
    │       │       ├── Sendnotificationmodal.jsx
    │       │       ├── StatusConfirmModal.css
    │       │       ├── StatusConfirmModal.jsx
    │       │       ├── VehicleTable.css
    │       │       └── VehicleTable.jsx
    │       ├── data/
    │       │   └── vehicleMakesModels.js
    │       ├── firebase/
    │       │   ├── appointments.js
    │       │   ├── auth.js
    │       │   ├── firebaseConfig.js
    │       │   ├── logout.js
    │       │   ├── notifications.js
    │       │   ├── users.js
    │       │   └── vehicles.js
    │       ├── hooks/
    │       │   ├── useAdminBookings.js
    │       │   ├── useAdminCustomers.js
    │       │   ├── useAdminJobs.js
    │       │   ├── useCustomerAppointments.js
    │       │   ├── useCustomerProfile.js
    │       │   ├── useDashboardSummary.js
    │       │   ├── useMyVehicles.js
    │       │   ├── useNotificationPreferences.js
    │       │   ├── usePagination.js
    │       │   └── useReminderLog.js
    │       ├── pages/
    │       │   ├── AdminBookingPage.css
    │       │   ├── AdminBookingPage.jsx
    │       │   ├── AdminCustomerProfilePage.css
    │       │   ├── AdminCustomerProfilePage.jsx
    │       │   ├── AdminCustomersPage.css
    │       │   ├── AdminCustomersPage.jsx
    │       │   ├── AdminJobsPage.css
    │       │   ├── AdminJobsPage.jsx
    │       │   ├── AdminNotificationPage.css
    │       │   ├── AdminNotificationPage.jsx
    │       │   ├── CustomerAppointmentsPage.css
    │       │   ├── CustomerAppointmentsPage.jsx
    │       │   ├── CustomerGarageInfoPage.css
    │       │   ├── CustomerGarageInfoPage.jsx
    │       │   ├── CustomerHomepage.css
    │       │   ├── CustomerHomepage.jsx
    │       │   ├── CustomerNotificationPage.css
    │       │   ├── CustomerNotificationPage.jsx
    │       │   ├── CustomerProfilePage.css
    │       │   ├── CustomerProfilePage.jsx
    │       │   ├── CustomerServiceHistoryPage.css
    │       │   ├── CustomerServiceHistoryPage.jsx
    │       │   ├── CustomerVehiclesPage.css
    │       │   ├── CustomerVehiclesPage.jsx
    │       │   ├── LoginPage.css
    │       │   ├── LoginPage.jsx
    │       │   ├── StaffHomepage.css
    │       │   └── StaffHomepage.jsx
    │       ├── routes/
    │       │   ├── ProtectedRoute.css
    │       │   └── ProtectedRoute.jsx
    │       ├── styles/
    │       │   ├── shared.css
    │       │   └── theme.css
    │       └── utils/
    │           ├── formatters.js
    │           ├── pushSubscription.js
    │           ├── pushSubscriptionHelpers.js
    │           └── serviceDateCalculators.js
    └── server/
        ├── index.js
        ├── package.json
        ├── .env.example
        ├── config/
        │   └── workingHours.js
        ├── firebase/
        │   ├── adminConfig.js
        │   └── firestore.rules
        ├── jobs/
        │   └── scheduledReminders.js
        ├── routes/
        │   ├── appointments.js
        │   └── reminders.js
        ├── scripts/
        │   ├── clearMockData.js
        │   ├── clearOldData.js
        │   ├── seedMockData.js
        │   ├── testAppointments.js
        │   ├── testOilChangeCompletion.js
        │   ├── testReminder.js
        │   └── testScheduledReminders.js
        ├── services/
        │   ├── emailService.js
        │   ├── jobCompletionService.js
        │   ├── notificationService.js
        │   ├── pushService.js
        │   └── smsService.js
        └── utils/
            ├── oilChangeCalculator.js
            └── wofCalculator.js

```

## Development Process

- Built using Scrum/Agile, sprint-based, tracked in Jira
- Version control via GitHub, with protected `main`/`develop` branches, merge commits only, and required PR review
- Sprint work integrated via sprint integration branches (e.g. `s6-integration` → `develop` → `main`)
- The team shifted mid-project from a backend/frontend pair split to a vertical-slice full-stack approach to reduce idle time between handoffs

## Team

| Name | Role |
|---|---|
| Jagrith Narayan | Project Manager / Team Lead, Full-stack developer |
| Jin An Lee | Full-stack developer  |
| Ronny Patel | Full-stack developer  |
| Tristan Jasper Gavina | Full-stack developer |
| Olivia Tang | Supervisor |
| Manpreet Dhanjal | Internal client |

## Known Limitations

- SMS notifications are implemented but disabled due to NZ carrier registration requirements for Vonage
- Full analytics/graphing features were cut from scope by mutual agreement with the client
- This is an academic proof-of-concept, not a production-ready system