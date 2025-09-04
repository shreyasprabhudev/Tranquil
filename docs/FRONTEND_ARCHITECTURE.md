# Frontend Architecture

## 📁 Directory Structure
```
frontend/
├── public/            # Static files
├── src/
│   ├── app/           # Next.js app router pages
│   │   ├── api/       # API route handlers
│   │   ├── auth/      # Authentication pages
│   │   ├── journal/   # Journal feature pages
│   │   └── layout.tsx # Root layout
│   │
│   ├── components/    # Reusable UI components
│   │   ├── ui/        # ShadCN components
│   │   └── journal/   # Journal-specific components
│   │
│   ├── contexts/      # React context providers
│   ├── lib/           # Utility functions and configs
│   └── styles/        # Global styles
```

## 🧩 Core Components

### 1. Journal Page (`/app/journal/page.tsx`)
- Main entry point for the journal feature
- Manages state for entries, loading, and UI state
- Handles data fetching and CRUD operations
- Integrates with SentimentInsights and PromptGenerator

### 2. NewEntryForm (`/components/journal/NewEntryForm.tsx`)
- Handles creation of new journal entries
- Uses React Hook Form with Zod validation
- Props:
  - `open`: boolean to control modal visibility
  - `onClose`: callback when form is closed
  - `onNewEntry`: async callback when entry is submitted

### 3. JournalEntriesList (`/components/journal/JournalEntriesList.tsx`)
- Displays a list of journal entries
- Handles entry deletion
- Implements infinite scrolling
- Responsive grid layout

### 4. SentimentInsights (`/components/journal/SentimentInsights.tsx`)
- Displays mood trends and analysis
- Visualizes sentiment data
- Interactive charts for mood tracking

### 5. PromptGenerator (`/components/journal/PromptGenerator.tsx`)
- Generates AI-powered writing prompts
- Uses TensorFlow.js for client-side AI
- Caches prompts for offline use

## 🔄 State Management

### 1. Authentication Context (`/contexts/AuthContext.tsx`)
- Manages user authentication state
- Handles token refresh
- Provides user profile data
- Methods:
  - `login(email, password)`
  - `register(userData)`
  - `logout()`
  - `refreshToken()`

### 2. Journal Context (Planned)
- Global state for journal entries
- Optimistic UI updates
- Local caching with IndexedDB

## 🛠️ API Integration

### 1. API Client (`/lib/api/client.ts`)
- Axios instance with interceptors
- Handles request/response transformations
- Automatic token refresh
- Error handling

### 2. Services
- `journalService.ts`: CRUD operations for journal entries
- `authService.ts`: Authentication related API calls
- `aiService.ts`: AI features integration

## 🎨 UI Components

### 1. Theme System
- Light/dark mode support
- Custom theming with CSS variables
- Responsive design utilities

### 2. Component Library
- Built with ShadCN/UI
- Custom components:
  - `MoodSelector`: Interactive mood picker
  - `EntryCard`: Journal entry preview card
  - `SentimentChart`: Mood visualization
  - `LoadingSkeleton`: Content loading states

