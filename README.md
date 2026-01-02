# Matenweekend

Matenweekend is a companion web application designed to gamify and organize a weekend getaway with friends. It features real-time activities, a competitive ranking system based on points, and a news feed for updates.

## ✨ Features

### 👤 User Features
- **Activities**: View upcoming and completed activities.
  - **Create**: Schedule new activities for the group (Earn **5 points**!).
  - **Join**: Participate in activities (Eiarn **10 points**!).
  - **Edit**: Creators can edit their own activity details.
- **Ranking**: Live leaderboard showing who has the most points.
- **News Feed**: Stay updated with announcements. Authors can edit their own posts.
- **Profile**: 
  - View your personal points history.
  - Customize your avatar.
  - Track your position on the leaderboard.

### 🛡️ Admin Features
- **User Management**: Overview of all users.
- **Activity Control**: Complete, cancel, or delete any activity.
- **Points Management**: Manually award or deduct points (e.g., for "Bonus" or "Penalty").
- **News Management**: Create and manage official announcements.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) (v19)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: 
  - [Tailwind CSS](https://tailwindcss.com/) (v4)
  - [DaisyUI](https://daisyui.com/) (v5) component library
- **Routing**: [React Router](https://reactrouter.com/) (v6)
- **State/Auth**: React Context API

### Backend
- **Platform**: [PocketBase](https://pocketbase.io/)
- **Database**: SQLite (embedded in PocketBase)
- **Real-time**: Native PocketBase subscriptions

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd matenweekend
    ```

2.  **Install Frontend Dependencies**
    ```bash
    cd frontend
    npm install
    ```

3.  **Configuration (Optional)**
    By default, the app connects to the production backend at `https://matenweekend.nl`. 
    To use a local backend, create a `.env` file in the `frontend` directory:
    ```env
    VITE_POCKETBASE_URL=http://127.0.0.1:8090
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

### Building for Production

To create a production build:
```bash
cd frontend
npm run build
```
The output will be in the `dist` folder.

## 📂 Project Structure

```
matenweekend/
├── docs/               # Technical specifications and guides
├── frontend/           # React application
│   ├── src/
│   │   ├── assets/     # Static assets (images, global CSS)
│   │   ├── components/ # Reusable UI components
│   │   ├── contexts/   # React Contexts (Auth, etc.)
│   │   ├── hooks/      # Custom React hooks (Data fetching)
│   │   ├── lib/        # Utilities (PocketBase client, translations)
│   │   ├── pages/      # Route pages
│   │   └── types/      # TypeScript interfaces
│   └── ...
└── ...
```

## 🎮 Point System Rules

- **Create Activity**: +5 Points
- **Participate**: +10 Points
- **Bonus/Penalty**: Manually assigned by Admins

## 📄 License
[MIT](LICENSE)