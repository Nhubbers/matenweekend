# Claude Code Agent Instructions

## Your Task

Build the complete frontend for **Matenweekend** - a Dutch friends weekend activity tracking app.

## Quick Start

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

## Documentation Files

Read these files in order:

1. **PROJECT_BRIEF.md** - Overview, features, success criteria
2. **TECHNICAL_SPEC.md** - Database schema, TypeScript interfaces
3. **API_REFERENCE.md** - PocketBase SDK usage examples
4. **UI_DESIGN.md** - Page layouts, components, Dutch translations
5. **DEVELOPMENT_GUIDE.md** - Setup, deployment, CI/CD

## Key Technical Details

### Backend API
- **URL:** `https://matenweekend.nl/api`
- **SDK:** PocketBase JavaScript SDK
- **Auth:** Email/password stored in localStorage

### Tech Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS + DaisyUI
- React Router v6
- PocketBase SDK
- date-fns

### Important Behaviors

1. **Activity Creation:**
   - Only send: title, description, start_time, status, points_participant, points_creator, max_participants, image
   - `creator` is auto-set by server hook

2. **Joining Activities:**
   - Only send: `{ activity: activityId }`
   - `user` is auto-set by server hook

3. **Completing Activities (Admin):**
   - Just update `status` to "completed"
   - Server hook automatically awards points to all participants

4. **Rankings:**
   - Computed client-side by summing `point_transactions`
   - No dedicated ranking endpoint

### Current API Rules Issue

⚠️ The PocketBase collections currently have `null` API rules (superuser only).
The frontend should handle 403 errors gracefully.

If you encounter permission errors:
1. Show user-friendly error messages
2. Log the error for debugging
3. Consider implementing retry logic

## Pages to Build

| Route | Page | Auth Required | Admin Only |
|-------|------|---------------|------------|
| `/login` | Login | No | No |
| `/` | Home/News | Yes | No |
| `/activities` | Activity List | Yes | No |
| `/activities/:id` | Activity Detail | Yes | No |
| `/ranking` | Leaderboard | Yes | No |
| `/profile` | User Profile | Yes | No |
| `/admin` | Admin Dashboard | Yes | Yes |

## Component Checklist

### Layout Components
- [ ] Header (logo, admin link, profile)
- [ ] BottomNav (Home, Activities, Ranking, Profile)
- [ ] PageContainer (consistent padding, max-width)
- [ ] ProtectedRoute (redirect to login if not authenticated)

### Feature Components
- [ ] LoginForm
- [ ] ActivityCard
- [ ] ActivityList (with filters)
- [ ] CreateActivityModal
- [ ] ParticipantList
- [ ] RankingList
- [ ] RankingItem
- [ ] NewsList
- [ ] NewsCard
- [ ] AdminActivityList
- [ ] PointsForm
- [ ] NewsManager

### Common Components
- [ ] Avatar
- [ ] LoadingSpinner
- [ ] ErrorMessage
- [ ] EmptyState
- [ ] ConfirmDialog

## UI Guidelines

1. **Mobile-first** - Primary use case is mobile phones
2. **Dutch language** - All UI text in Dutch (see UI_DESIGN.md for translations)
3. **DaisyUI theme** - Use `night` or `dark` theme
4. **Bottom navigation** - For mobile navigation
5. **FAB** - Floating action button for creating activities

## Code Style

```typescript
// Use functional components with TypeScript
export function ActivityCard({ activity }: { activity: Activity }) {
  // ...
}

// Use custom hooks for data fetching
export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ...
}

// Use AuthContext for user state
const { user, isAdmin, login, logout } = useAuth();
```

## Testing Your Work

1. **Login works** - Can log in with existing user
2. **Activities load** - Can see activity list
3. **Create activity** - Form submits successfully
4. **Join/Leave** - Can join and leave activities
5. **Ranking loads** - Can see computed rankings
6. **Admin functions** - Can complete activities, award points (if admin)

## When You're Done

1. Ensure all pages are working
2. Test on mobile viewport (375px)
3. Check for TypeScript errors: `npm run build`
4. Commit and push to trigger deployment

## Getting Help

If you encounter issues with the PocketBase API, you can:
1. Check the PocketBase admin: `https://matenweekend.nl/_/`
2. Look at the API documentation
3. Check browser Network tab for exact request/response

Good luck! 🎉
