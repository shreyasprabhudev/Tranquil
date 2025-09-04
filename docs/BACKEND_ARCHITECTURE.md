# Backend Architecture

## 📁 Directory Structure
```
backend/
├── config/               # Project configuration
│   ├── __init__.py
│   ├── settings.py      # Django settings
│   ├── urls.py         # Root URL configuration
│   └── wsgi.py         # WSGI config
│
├── journal/             # Journal app
│   ├── migrations/     # Database migrations
│   ├── services/       # Business logic
│   ├── tests/          # Test cases
│   ├── admin.py        # Admin interface
│   ├── models.py       # Data models
│   ├── serializers.py  # API serializers
│   ├── urls.py        # App URL routing
│   └── views.py       # View functions/classes
│
├── manage.py           # Django management script
└── requirements.txt    # Python dependencies
```

## 🗄️ Data Models

### 1. User Model
- Extends Django's AbstractUser
- Custom fields:
  - `bio`: TextField for user biography
  - `avatar`: ImageField for profile picture
  - `timezone`: CharField for user's timezone

### 2. JournalEntry Model
- `user`: ForeignKey to User
- `title`: CharField
- `content`: TextField
- `mood`: CharField with choices (happy, sad, neutral, etc.)
- `entry_type`: CharField (journal, note, idea, etc.)
- `is_private`: BooleanField
- `word_count`: IntegerField
- `sentiment_score`: FloatField (nullable)
- `created_at`: DateTimeField (auto_now_add)
- `updated_at`: DateTimeField (auto_now)

### 3. Tag Model (for entry categorization)
- `name`: CharField (unique)
- `color`: CharField (hex color code)

## 🌐 API Endpoints

### Authentication
```
POST    /api/auth/register/     # Register new user
POST    /api/auth/login/        # Login user
POST    /api/auth/refresh/      # Refresh access token
POST    /api/auth/logout/       # Logout user
GET     /api/auth/me/           # Get current user profile
```

### Journal Entries
```
GET     /api/entries/           # List all entries (filterable)
POST    /api/entries/           # Create new entry
GET     /api/entries/{id}/      # Retrieve entry
PUT     /api/entries/{id}/      # Update entry
DELETE  /api/entries/{id}/      # Delete entry
GET     /api/entries/stats/     # Get entry statistics
```

### AI Features
```
POST    /api/ai/generate-prompt/  # Generate writing prompt
POST    /api/ai/analyze-sentiment/ # Analyze text sentiment
```

## 🔒 Authentication System

### JWT Authentication
- Access token (short-lived, 15 minutes)
- Refresh token (long-lived, 7 days)
- Token rotation on refresh
- Blacklist for revoked tokens

### Permission Classes
- `IsAuthenticated`: User must be logged in
- `IsOwnerOrReadOnly`: Only owner can modify
- `IsAdminUser`: Admin-only access

## 🧠 AI/ML Integration

### 1. Sentiment Analysis
- Uses pre-trained NLP model
- Scores text on -1.0 to 1.0 scale
- Detects emotional tone

### 2. Prompt Generation
- Fine-tuned GPT-2 model
- Context-aware suggestions
- Personalization based on user history

## 📊 Database Schema

### Journal Entry
```sql
CREATE TABLE journal_entry (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user(id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT NOT NULL,
    mood VARCHAR(20),
    entry_type VARCHAR(20),
    is_private BOOLEAN DEFAULT false,
    word_count INTEGER DEFAULT 0,
    sentiment_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
