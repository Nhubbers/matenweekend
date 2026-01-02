// User interface - from PocketBase users collection
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
    collectionId: string;
    collectionName: string;
}

// Activity interface - from PocketBase activities collection
export interface Activity {
    id: string;
    title: string;
    description: string;
    start_time: string;
    creator: string; // User ID
    status: 'open' | 'completed' | 'cancelled';
    points_participant: number;
    points_creator: number;
    max_participants: number;
    image: string;
    created: string;
    updated: string;
    collectionId: string;
    collectionName: string;
    // Expanded relations
    expand?: {
        creator?: User;
    };
}

// Participation interface - from PocketBase participations collection
export interface Participation {
    id: string;
    activity: string; // Activity ID
    user: string; // User ID
    created: string;
    updated: string;
    collectionId: string;
    collectionName: string;
    // Expanded relations
    expand?: {
        activity?: Activity;
        user?: User;
    };
}

// Point Transaction interface - from PocketBase point_transactions collection
export interface PointTransaction {
    id: string;
    user: string; // User ID
    amount: number;
    reason: string;
    activity: string; // Activity ID (optional)
    awarded_by: string; // User ID (optional)
    type: 'participation' | 'creation' | 'bonus' | 'deduction';
    created: string;
    updated: string;
    collectionId: string;
    collectionName: string;
    // Expanded relations
    expand?: {
        user?: User;
        activity?: Activity;
        awarded_by?: User;
    };
}

// News interface - from PocketBase news collection
export interface News {
    id: string;
    title: string;
    body: string;
    author: string; // User ID
    created: string;
    updated: string;
    collectionId: string;
    collectionName: string;
    // Expanded relations
    expand?: {
        author?: User;
    };
}

// Computed ranking type
export interface UserRanking {
    id: string;
    name: string;
    avatar: string;
    totalPoints: number;
    rank: number;
}

// Activity filter type
export type ActivityFilter = 'upcoming' | 'all' | 'completed';

// Form data for creating activities
export interface CreateActivityData {
    title: string;
    description: string;
    start_time: string;
    points_participant: number;
    points_creator: number;
    max_participants: number;
    image?: File;
}
