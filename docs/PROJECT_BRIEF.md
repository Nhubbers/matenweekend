# Matenweekend Frontend - Project Brief

## Overview

Build a mobile-first React web application for "Matenweekend" (Friends Weekend) - an activity tracking app where friends can create activities, participate in them, and earn points.

## Project Details

| Item | Value |
|------|-------|
| **Repository** | `matenweekend` on GitHub |
| **Frontend Path** | `/frontend` |
| **Backend API** | `https://matenweekend.nl/api` |
| **PocketBase Admin** | `https://matenweekend.nl/_/` |
| **Server IP** | 46.62.164.62 |
| **Domain** | matenweekend.nl |

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **Vite** | Build tool |
| **TypeScript** | Type safety |
| **React Router v6** | Client-side routing |
| **Tailwind CSS** | Styling |
| **DaisyUI** | UI components |
| **PocketBase SDK** | Backend communication |
| **date-fns** | Date formatting |

## Core Features

### For All Logged-in Users
1. **Login/Logout** - Email/password authentication
2. **View Activities** - List of upcoming and past activities
3. **Join Activities** - Participate in activities created by others
4. **Leave Activities** - Withdraw from activities (if not completed)
5. **Create Activities** - Add new activities with title, description, time, points, image
6. **View Ranking** - Leaderboard sorted by points
7. **View News** - Announcements from admins

### For Admin Users Only
1. **Delete Activities** - Remove any activity
2. **Complete Activities** - Mark as done (triggers point distribution)
3. **Cancel Activities** - Cancel without awarding points
4. **Remove Participants** - Kick users from activities
5. **Award Bonus Points** - Give extra points to users
6. **Deduct Points** - Remove points from users
7. **Create News** - Post announcements

## Pages to Build

1. `/login` - Login page
2. `/` - Home/News feed (default after login)
3. `/activities` - Activity list with join/leave/create
4. `/activities/:id` - Activity detail page
5. `/ranking` - Points leaderboard
6. `/admin` - Admin dashboard (protected)
7. `/profile` - User profile view

## Design Requirements

- **Mobile-first** design (primary use case is mobile)
- **Dutch language** UI (it's for Dutch friends)
- **Dark theme** support via DaisyUI
- Use DaisyUI component patterns (cards, modals, buttons, navbar)
- Bottom navigation bar for mobile
- Floating action button (FAB) for creating activities

## Related Documentation

- `TECHNICAL_SPEC.md` - Database schema and API details
- `API_REFERENCE.md` - PocketBase SDK usage examples
- `UI_DESIGN.md` - Component specifications and layouts
- `DEVELOPMENT_GUIDE.md` - Setup, development, and deployment

## Important Notes

1. **API Rules configured**: All collections have proper API rules. Use `expand` on relations to get user data (e.g., `expand: 'creator'` when fetching activities).

2. **Server-side hooks**: Points are awarded automatically when an activity is marked "completed" - the frontend just updates the status.

3. **User field auto-set**: When creating participations, the `user` field is auto-set by a server hook - frontend only needs to provide `activity` ID.

4. **Creator field auto-set**: When creating activities, the `creator` field is auto-set by a server hook.

## Success Criteria

- [ ] Users can log in and stay authenticated
- [ ] Users can view, create, join, and leave activities
- [ ] Users can view the ranking leaderboard
- [ ] Users can view news announcements
- [ ] Admins can manage activities and points
- [ ] App works well on mobile devices
- [ ] App handles errors gracefully with user feedback
