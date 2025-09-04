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
[Demo Video](https://www.loom.com/share/bdec9684c9654a39a04c83ef2996167f?sid=dc6fbf8e-7b0d-4ad0-a51a-8b07ca649de7)

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 13+ with App Router
- **UI**: ShadCN/UI with Tailwind CSS
- **State Management**: React Context API
- **Authentication**: Custom JWT-based auth with refresh tokens

### Backend
- **Framework**: Django REST Framework
- **Database**: SQLite (development)
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
   git clone https://github.com/shreyasprabhudev/tranquil.git
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

### Home Page
<img width="2003" height="1180" alt="Screenshot 2025-09-04 at 4 00 19 PM" src="https://github.com/user-attachments/assets/3e03c128-26be-4f0d-8a7a-49caf9e2a077" />

### Journal Entry
<!-- Add dashboard screenshot here -->
<img width="2019" height="1172" alt="Screenshot 2025-09-04 at 4 00 02 PM" src="https://github.com/user-attachments/assets/e529e1cb-c8d2-4271-95e3-241d50d3f9c4" />

### Chat
<!-- Add journal entry screenshot here -->
<img width="2008" height="1133" alt="Screenshot 2025-09-04 at 3 59 47 PM" src="https://github.com/user-attachments/assets/ca9809dd-fd37-42e7-ba95-dc0f913f62c5" />

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
