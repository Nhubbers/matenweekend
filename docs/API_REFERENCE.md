# API Reference - PocketBase SDK

## Installation

```bash
npm install pocketbase
```

## Setup

```typescript
// src/lib/pocketbase.ts
import PocketBase from 'pocketbase';

export const pb = new PocketBase('https://matenweekend.nl');

// Enable auto-cancellation for duplicate requests
pb.autoCancellation(false);
```

---

## Authentication

### Login
```typescript
const authData = await pb.collection('users').authWithPassword(
  'user@example.com',
  'password123'
);

console.log(authData.token);
console.log(authData.record); // User data
```

### Check if Logged In
```typescript
const isLoggedIn = pb.authStore.isValid;
const currentUser = pb.authStore.model;
```

### Logout
```typescript
pb.authStore.clear();
```

### Listen to Auth Changes
```typescript
pb.authStore.onChange((token, model) => {
  console.log('Auth changed:', model);
});
```

### Register New User
```typescript
const user = await pb.collection('users').create({
  email: 'new@example.com',
  password: 'password123',
  passwordConfirm: 'password123',
  name: 'John Doe',
});
```

---

## Activities

### Get All Activities
```typescript
const activities = await pb.collection('activities').getFullList({
  sort: '-start_time',
  expand: 'creator',
});
```

### Get Activities with Pagination
```typescript
const result = await pb.collection('activities').getList(1, 20, {
  sort: '-start_time',
  expand: 'creator',
  filter: 'status = "open"',
});

console.log(result.items);      // Activity[]
console.log(result.totalItems); // Total count
console.log(result.totalPages); // Total pages
```

### Get Single Activity
```typescript
const activity = await pb.collection('activities').getOne(activityId, {
  expand: 'creator',
});
```

### Create Activity
```typescript
// With FormData for file upload
const formData = new FormData();
formData.append('title', 'BBQ in the Park');
formData.append('description', 'Bring your own drinks');
formData.append('start_time', '2025-06-15T14:00:00.000Z');
formData.append('status', 'open');
formData.append('points_participant', '10');
formData.append('points_creator', '5');
formData.append('max_participants', '20');
formData.append('image', imageFile); // File object

const activity = await pb.collection('activities').create(formData);
```

### Create Activity (without image)
```typescript
const activity = await pb.collection('activities').create({
  title: 'BBQ in the Park',
  description: 'Bring your own drinks',
  start_time: '2025-06-15T14:00:00.000Z',
  status: 'open',
  points_participant: 10,
  points_creator: 5,
  max_participants: 20,
});
```

### Update Activity
```typescript
const activity = await pb.collection('activities').update(activityId, {
  title: 'Updated Title',
});
```

### Update Activity Status (Admin)
```typescript
// Mark as completed - triggers automatic point distribution
await pb.collection('activities').update(activityId, {
  status: 'completed',
});

// Cancel activity
await pb.collection('activities').update(activityId, {
  status: 'cancelled',
});
```

### Delete Activity (Admin)
```typescript
await pb.collection('activities').delete(activityId);
```

### Get Activity Image URL
```typescript
// Original
const imageUrl = pb.files.getUrl(activity, activity.image);

// Thumbnail
const thumbUrl = pb.files.getUrl(activity, activity.image, { thumb: '400x300' });

// With fallback
const getActivityImageUrl = (activity: Activity) => {
  if (!activity.image) return '/placeholder-activity.jpg';
  return pb.files.getUrl(activity, activity.image, { thumb: '400x300' });
};
```

---

## Participations

### Get Participations for an Activity
```typescript
const participations = await pb.collection('participations').getFullList({
  filter: `activity = "${activityId}"`,
  expand: 'user',
});
```

### Get Current User's Participations
```typescript
const myParticipations = await pb.collection('participations').getFullList({
  filter: `user = "${pb.authStore.model?.id}"`,
  expand: 'activity',
});
```

### Check if Current User Joined Activity
```typescript
const checkIfJoined = async (activityId: string): Promise<string | null> => {
  try {
    const records = await pb.collection('participations').getFullList({
      filter: `activity = "${activityId}" && user = "${pb.authStore.model?.id}"`,
    });
    return records.length > 0 ? records[0].id : null;
  } catch {
    return null;
  }
};
```

### Join Activity
```typescript
// Only need to send activity ID - user is auto-set by server hook
const participation = await pb.collection('participations').create({
  activity: activityId,
});
```

### Leave Activity
```typescript
await pb.collection('participations').delete(participationId);
```

### Remove Participant (Admin)
```typescript
// Find and delete their participation
const participations = await pb.collection('participations').getFullList({
  filter: `activity = "${activityId}" && user = "${userId}"`,
});
if (participations.length > 0) {
  await pb.collection('participations').delete(participations[0].id);
}
```

---

## Point Transactions

### Get All Transactions
```typescript
const transactions = await pb.collection('point_transactions').getFullList({
  sort: '-created',
  expand: 'user,activity,awarded_by',
});
```

### Get Transactions for User
```typescript
const userTransactions = await pb.collection('point_transactions').getFullList({
  filter: `user = "${userId}"`,
  sort: '-created',
  expand: 'activity',
});
```

### Compute Rankings
```typescript
interface UserScore {
  id: string;
  name: string;
  avatar: string;
  totalPoints: number;
}

const computeRankings = async (): Promise<UserScore[]> => {
  // Get all transactions
  const transactions = await pb.collection('point_transactions').getFullList({
    expand: 'user',
  });

  // Sum points per user
  const pointsMap = new Map<string, UserScore>();

  transactions.forEach((tx) => {
    const user = tx.expand?.user;
    if (!user) return;

    const existing = pointsMap.get(user.id);
    if (existing) {
      existing.totalPoints += tx.amount || 0;
    } else {
      pointsMap.set(user.id, {
        id: user.id,
        name: user.name || user.email,
        avatar: user.avatar,
        totalPoints: tx.amount || 0,
      });
    }
  });

  // Sort by points descending
  return Array.from(pointsMap.values())
    .sort((a, b) => b.totalPoints - a.totalPoints);
};
```

### Award Bonus Points (Admin)
```typescript
await pb.collection('point_transactions').create({
  user: userId,
  amount: 25,
  reason: 'Bonus: Best activity of the weekend',
  type: 'bonus',
  awarded_by: pb.authStore.model?.id,
});
```

### Deduct Points (Admin)
```typescript
await pb.collection('point_transactions').create({
  user: userId,
  amount: -10,  // Negative amount
  reason: 'Deduction: No-show penalty',
  type: 'deduction',
  awarded_by: pb.authStore.model?.id,
});
```

---

## News

### Get All News
```typescript
const news = await pb.collection('news').getFullList({
  sort: '-created',
  expand: 'author',
});
```

### Get Single News Item
```typescript
const newsItem = await pb.collection('news').getOne(newsId, {
  expand: 'author',
});
```

### Create News (Admin)
```typescript
const news = await pb.collection('news').create({
  title: 'Welcome to Matenweekend!',
  body: '<p>Get ready for an amazing weekend...</p>',
  author: pb.authStore.model?.id,
});
```

### Update News (Admin)
```typescript
await pb.collection('news').update(newsId, {
  title: 'Updated Title',
  body: '<p>Updated content...</p>',
});
```

### Delete News (Admin)
```typescript
await pb.collection('news').delete(newsId);
```

---

## Real-time Subscriptions (Optional)

### Subscribe to Activity Changes
```typescript
pb.collection('activities').subscribe('*', (e) => {
  console.log(e.action); // 'create', 'update', 'delete'
  console.log(e.record); // The activity record
});

// Unsubscribe
pb.collection('activities').unsubscribe('*');
```

### Subscribe to Specific Record
```typescript
pb.collection('activities').subscribe(activityId, (e) => {
  console.log('Activity updated:', e.record);
});
```

---

## Error Handling

### Standard Error Pattern
```typescript
import { ClientResponseError } from 'pocketbase';

try {
  await pb.collection('participations').create({ activity: activityId });
} catch (error) {
  if (error instanceof ClientResponseError) {
    // PocketBase error
    console.log(error.status);   // HTTP status code
    console.log(error.message);  // Error message
    console.log(error.data);     // Additional error data
    
    // Common errors:
    // 400 - Bad Request (validation failed)
    // 401 - Unauthorized (not logged in)
    // 403 - Forbidden (no permission)
    // 404 - Not Found
    
    if (error.status === 400) {
      // Handle validation error
      // error.data might contain field-specific errors
    }
  }
  throw error;
}
```

### Common Error Messages from Hooks
```typescript
// From participation hooks:
// "Cannot join: Activity is no longer open"
// "Cannot join: Activity is full"
// "Cannot leave: Activity is already completed"
```

---

## React Context Example

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { pb } from '../lib/pocketbase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(pb.authStore.model as User | null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if auth is valid on mount
    setIsLoading(false);
    
    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange((_, model) => {
      setUser(model as User | null);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email, password);
  };

  const logout = () => {
    pb.authStore.clear();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: user?.isAdmin ?? false,
      login,
      logout,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```
