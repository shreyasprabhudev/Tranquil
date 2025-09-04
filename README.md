# Tranquil - AI-Powered Journaling Application

## 📝 Project Overview
Tranquil is a modern, AI-powered journaling application designed to help users reflect on their thoughts and emotions through intelligent writing assistance and mood tracking. The application leverages natural language processing to provide personalized insights and writing prompts, making journaling more engaging and personal.

## ✨ Key Features
- **AI-Powered Journaling**: Get intelligent writing suggestions and prompts
- **Mood Tracking**: Visualize your emotional journey over time
- **Sentiment Analysis**: Gain insights into your writing patterns
- **Secure & Private**: End-to-end encryption for your personal thoughts
- **Responsive Design**: Seamless experience across all devices

## 🎥 Video Presentation
[Insert YouTube/Vimeo link here]

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 13+ with App Router
- **UI**: ShadCN/UI with Tailwind CSS
- **State Management**: React Context API
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Custom JWT-based auth with refresh tokens

### Backend
- **Framework**: Django REST Framework
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: Custom JWT authentication
- **AI/ML**: Sentiment analysis and prompt generation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tranquil.git
   cd tranquil
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Environment Variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Frontend
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

## 🖼️ Screenshots

### Dashboard
<!-- Add dashboard screenshot here -->
![Dashboard](/screenshots/dashboard.png)

### Journal Entry
<!-- Add journal entry screenshot here -->
![Journal Entry](/screenshots/journal-entry.png)

### Mood Insights
<!-- Add mood insights screenshot here -->
![Mood Insights](/screenshots/mood-insights.png)

## 🧩 Features in Detail

### 1. Journaling System
- Create, read, update, and delete journal entries
- Rich text formatting support
- Automatic saving and versioning
- Tagging and categorization

### 2. AI Features
- Smart writing prompts based on your mood and writing history
- Sentiment analysis of entries
- Personalized writing suggestions
- Mood trend analysis

### 3. Authentication & Security
- JWT-based authentication
- Secure password hashing
- Session management
- Role-based access control

## 🚀 Future Enhancements

### Core Features
- [ ] **Voice & Multimedia Journaling**
  - Voice-to-text with emotion detection
  - Photo/video entries with location tagging
  - Mood boards and visual timelines

### Smart Insights
- [ ] **Sentiment & Mood Analytics**
  - Visual sentiment timeline and pattern recognition
  - AI-powered wellness check-ins
  - Customizable mood metrics and triggers

### Integration
- [ ] **Smart Calendar Integration**
  - Link entries to events and schedule prompts
  - Event-based mood tracking
  - AI assistant with contextual follow-ups

### Advanced Functionality
- [ ] **Offline & Data Tools**
  - Full offline support with auto-sync
  - Secure export and reporting tools
  - Therapist dashboard with progress tracking
