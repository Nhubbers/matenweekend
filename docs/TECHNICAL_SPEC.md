# Technical Specification

## PocketBase API Base URL

```
https://matenweekend.nl/api
```

## Database Collections & Schema

### 1. users (Auth Collection)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | text | Yes | Auto-generated, 15 chars |
| `email` | email | Yes | Used for login |
| `password` | password | Yes | Min 8 chars |
| `name` | text | No | Display name, max 255 chars |
| `avatar` | file | No | Profile picture (jpeg, png, svg, gif, webp) |
| `isAdmin` | bool | No | Admin flag, default false |
| `emailVisibility` | bool | No | System field |
| `verified` | bool | No | System field |
| `created` | autodate | Yes | Auto-set |
| `updated` | autodate | Yes | Auto-set |

**API Rules:**
- List/View: `id = @request.auth.id` (users can only see themselves directly)
- Create: Open (registration)
- Update: `id = @request.auth.id` (own profile only)
- Delete: `id = @request.auth.id` (own account only)

**Important:** To get user data for other users, always use `expand` on relations. For example, when fetching activities with `expand: 'creator'`, PocketBase includes the creator's user data even though you can't list users directly.

### 2. activities

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | text | Yes | Auto-generated, 15 chars |
| `title` | text | Yes | 1-200 chars |
| `description` | text | Yes | 1-2000 chars |
| `start_time` | date | Yes | ISO datetime |
| `creator` | relation | No | → users (auto-set by hook) |
| `status` | select | No | `open`, `completed`, `cancelled` |
| `points_participant` | number | Yes | Min 0, points for participants |
| `points_creator` | number | Yes | Points for activity creator |
| `max_participants` | number | No | 0 = unlimited |
| `image` | file | No | Activity image (png, jpeg, webp, tiff, bmp, heic) |
| `created` | autodate | Yes | Auto-set |
| `updated` | autodate | Yes | Auto-set |

**Image Thumbnails:** `100x100`, `400x300`

**API Rules:**
- List/View: `@request.auth.id != ""` (any authenticated user)
- Create: `@request.auth.id != ""` (any authenticated user)
- Update: `creator = @request.auth.id || @request.auth.isAdmin = true` (creator or admin)
- Delete: `@request.auth.isAdmin = true` (admin only)

**Status Workflow:**
- `open` -> `completed`: Triggered by creator/admin. Server hook awards points.
- `completed` -> `open` (Reopen): Triggered by creator/admin. MUST remove associated point transactions.

### 3. participations

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | text | Yes | Auto-generated |
| `activity` | relation | Yes | → activities |
| `user` | relation | Yes | → users (auto-set by hook) |
| `created` | autodate | Yes | Auto-set |
| `updated` | autodate | Yes | Auto-set |

**Indexes:** Unique constraint on `(activity, user)` - prevents double-joining

**API Rules:**
- List/View: `@request.auth.id != ""` (any authenticated user)
- Create: `@request.auth.id != ""` (any authenticated user)
- Update: `null` (no updates allowed)
- Delete: `user = @request.auth.id || @request.auth.isAdmin = true` (own record or admin)

### 4. point_transactions

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | text | Yes | Auto-generated |
| `user` | relation | Yes | → users |
| `amount` | number | No | Can be negative for deductions |
| `reason` | text | No | e.g., "Created: BBQ", "Bonus" |
| `activity` | relation | No | → activities (optional link) |
| `awarded_by` | relation | No | → users (admin who awarded) |
| `type` | select | No | `participation`, `creation`, `bonus`, `deduction` |
| `created` | autodate | Yes | Auto-set |
| `updated` | autodate | Yes | Auto-set |

**API Rules:**
- List/View: `@request.auth.id != ""` (any authenticated user)
- Create: `@request.auth.isAdmin = true` (admin only - regular points are created by server hooks)
- Update: `null` (no updates - immutable audit trail)
- Delete: `null` (no deletes - immutable audit trail)

### 5. news

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | text | Yes | Auto-generated |
| `title` | text | No | Max 500 chars |
| `body` | editor | No | Rich text/HTML content |
| `author` | relation | No | → users |
| `created` | autodate | Yes | Auto-set |
| `updated` | autodate | Yes | Auto-set |

**API Rules:**
- List/View: `@request.auth.id != ""` (any authenticated user)
- Create: `@request.auth.isAdmin = true` (admin only)
- Update: `@request.auth.isAdmin = true` (admin only)
- Delete: `@request.auth.isAdmin = true` (admin only)

---

## TypeScript Interfaces

```typescript
// src/types/index.ts

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  emailVisibility: boolean;
  verified: boolean;
  created: string;
  updated: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  start_time: string;
  creator: string;  // User ID
  status: 'open' | 'completed' | 'cancelled';
  points_participant: number;
  points_creator: number;
  max_participants: number;
  image: string;
  created: string;
  updated: string;
  // Expanded relations
  expand?: {
    creator?: User;
  };
}

export interface Participation {
  id: string;
  activity: string;  // Activity ID
  user: string;      // User ID
  created: string;
  updated: string;
  // Expanded relations
  expand?: {
    activity?: Activity;
    user?: User;
  };
}

export interface PointTransaction {
  id: string;
  user: string;      // User ID
  amount: number;
  reason: string;
  activity: string;  // Activity ID (optional)
  awarded_by: string; // User ID (optional)
  type: 'participation' | 'creation' | 'bonus' | 'deduction';
  created: string;
  updated: string;
  // Expanded relations
  expand?: {
    user?: User;
    activity?: Activity;
    awarded_by?: User;
  };
}

export interface News {
  id: string;
  title: string;
  body: string;
  author: string;    // User ID
  created: string;
  updated: string;
  // Expanded relations
  expand?: {
    author?: User;
  };
}

// Ranking computed type
export interface UserRanking {
  user: User;
  totalPoints: number;
  rank: number;
}
```

---

## Server-Side Hooks (Already Implemented)

### Hook 1: Auto-award points on activity completion
When activity status changes to `completed`:
- Creator gets `points_creator` points
- Each participant gets `points_participant` points
- Creates records in `point_transactions`

### Hook 2: Validate participation limits
Before creating participation:
- Checks if activity status is `open`
- Checks if `max_participants` is reached

### Hook 3: Prevent leaving completed activities
Before deleting participation:
- Blocks if activity status is `completed`

### Hook 4: Auto-set creator on activity creation
Before creating activity:
- Sets `creator` to current authenticated user

### Hook 5: Auto-set user on participation creation
Before creating participation:
- Sets `user` to current authenticated user

---

## Important API Behaviors

### Creating an Activity
```typescript
// Frontend only needs to send:
{
  title: "BBQ at the park",
  description: "Bring your own meat",
  start_time: "2025-06-15T14:00:00Z",
  status: "open",
  points_participant: 10,
  points_creator: 5,
  max_participants: 20,  // optional, 0 = unlimited
  image: File            // optional
}
// creator is auto-set by server hook
```

### Joining an Activity
```typescript
// Frontend only needs to send:
{
  activity: "activity_id_here"
}
// user is auto-set by server hook
```

### Leaving an Activity
```typescript
// Delete the participation record
pb.collection('participations').delete(participationId);
// Will fail if activity is already completed
```

### Computing Rankings
Rankings are computed client-side by summing `point_transactions`:
```typescript
const transactions = await pb.collection('point_transactions').getFullList();
const rankings = computeRankings(transactions);
```

---

## File URLs

### Activity Images
```typescript
// Original
pb.files.getUrl(activity, activity.image)
// -> https://matenweekend.nl/api/files/pbc_1262591861/{recordId}/{filename}

// Thumbnail 100x100
pb.files.getUrl(activity, activity.image, { thumb: '100x100' })

// Thumbnail 400x300
pb.files.getUrl(activity, activity.image, { thumb: '400x300' })
```

### User Avatars
```typescript
pb.files.getUrl(user, user.avatar)
```
