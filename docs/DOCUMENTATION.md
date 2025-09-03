# Tranquil: AI-Powered Journaling Companion

## Project Overview
A locally-hosted journaling application that helps users maintain a consistent journaling practice through AI-powered prompts, sentiment analysis, and personalized insights, with a focus on privacy and ease of use.

## Problem Statement
Users struggle with maintaining a consistent journaling practice due to:
- "Blank page" anxiety
- Lack of guidance on what to write
- Difficulty identifying patterns in their thoughts and emotions
- Privacy concerns with existing solutions

## Solution
A private, locally-hosted journaling companion that provides:
- Context-aware, empathetic prompts
- On-device sentiment and theme analysis
- Personalized insights and reflections
- Easy-to-use interface with quick actions

## Technical Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI Library**: Shadcn UI + Tailwind CSS
- **State Management**: React Context API
- **Audio Processing**: Web Audio API
- **Speech-to-Text**: Web Speech API
- **Local Storage**: For offline functionality

### Backend
- **Framework**: Django 4.2 with Django REST Framework
- **Database**: SQLite (local development)
- **Authentication**: Django REST Framework Simple JWT
- **API**: RESTful endpoints
- **File Storage**: Local file system

### AI/ML Components
- **Sentiment Analysis**: TextBlob
- **Keyword Extraction**: NLTK
- **Prompt Generation**: Rule-based system

## Architecture

### System Design
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Next.js       │ ◄──►│   Django        │ ◄──►│   SQLite        │
│   Frontend      │     │   Backend       │     │   Database      │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Data Flow
1. User interacts with the Next.js frontend
2. Frontend makes API calls to Django backend
3. Django processes requests and interacts with SQLite database
4. AI components analyze journal entries locally
5. Results are stored and displayed to the user

## Key Features

### Implemented
- [ ] Basic journal entry creation and management
- [ ] User authentication
- [ ] Mood tracking with emoji selection
- [ ] Local storage for offline use
- [ ] Basic sentiment analysis

### In Progress
- [ ] Voice-to-text journaling
- [ ] Guided breathing exercises
- [ ] Prompt suggestions

### Future Enhancements
- [ ] Weekly insights generation
- [ ] Theme and pattern detection
- [ ] Export functionality
- [ ] Local backup/restore

## Development Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- pipenv

### Installation
1. Clone the repository
2. Set up frontend:
   ```bash
   cd frontend
   npm install
   ```
3. Set up backend:
   ```bash
   cd ../backend
   pipenv install
   pipenv shell
   python manage.py migrate
   ```

### Running Locally
1. Start backend:
   ```bash
   cd backend
   python manage.py runserver
   ```
2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Security & Privacy
- All data stored locally
- No third-party tracking
- Optional encryption for sensitive data
- Clear data management options

## License
MIT License
