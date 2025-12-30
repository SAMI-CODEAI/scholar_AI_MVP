# 🎓 AI Learning Assistant

A full-stack AI-powered study tool that transforms various content formats into personalized learning materials including summaries, flashcards, and quizzes.

## 🏗️ Architecture

| Layer | Technology | Deployment |
|-------|------------|------------|
| **Frontend** | Angular 21 | Firebase Hosting |
| **Backend API** | Google Functions Framework (Python) | Cloud Run |
| **Authentication** | Firebase Auth | - |
| **AI/ML** | Google Gemini Pro | - |
| **Speech-to-Text** | Google Cloud Speech API | - |
| **Storage** | Google Cloud Storage | - |

## 📁 Project Structure

```
CodeRave_Refactored/
├── frontend-angular/           # Angular SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/     # UI Components
│   │   │   │   ├── auth/       # Login/Signup
│   │   │   │   ├── home/       # File upload page
│   │   │   │   └── guide/      # Study guide view
│   │   │   ├── services/       # API & Auth services
│   │   │   ├── app.config.ts   # App configuration
│   │   │   ├── app.routes.ts   # Routing
│   │   │   └── app.ts          # Root component
│   │   ├── environments/       # Environment configs
│   │   └── index.html
│   ├── firebase.json           # Firebase Hosting config
│   ├── angular.json
│   └── package.json
│
├── backend-functions/          # Cloud Run Backend
│   ├── main.py                 # API endpoints
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile              # Container config
│   └── .env.example            # Environment template
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Google Cloud CLI (`gcloud`)
- Firebase CLI (`firebase-tools`)
- Google Cloud Project with billing enabled

### 1. Clone & Setup

```bash
git clone <repository-url>
cd CodeRave_Refactored
```

### 2. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google Sign-in)
3. Get your Firebase config from Project Settings

### 3. Frontend Setup

```bash
cd frontend-angular

# Install dependencies
npm install --legacy-peer-deps

# Update environment files with your Firebase config
# Edit: src/environments/environment.ts
# Edit: src/environments/environment.prod.ts

# Run locally
npm start
```

### 4. Backend Setup

```bash
cd backend-functions

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Run locally
python main.py
```

---

## 🔧 Configuration

### Frontend Environment Variables

Edit `frontend-angular/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
  },
  apiUrl: 'http://localhost:8080/api'  // Local dev
};
```

For production (`environment.prod.ts`), update `apiUrl` to your Cloud Run URL.

### Backend Environment Variables

```bash
# .env file
GOOGLE_CLOUD_PROJECT=your-project-id
GEMINI_API_KEY=your-gemini-api-key
GCS_BUCKET_NAME=your-storage-bucket
```

---

## 🚢 Deployment

### Deploy Frontend to Firebase Hosting

```bash
cd frontend-angular

# Build for production
npm run build

# Login to Firebase
firebase login

# Initialize (if not done)
firebase init hosting
# Select your project and use dist/frontend-angular/browser as public directory

# Deploy
firebase deploy --only hosting
```

### Deploy Backend to Cloud Run

```bash
cd backend-functions

# Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable speech.googleapis.com
gcloud services enable storage.googleapis.com

# Build and deploy
gcloud run deploy ai-learning-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=your-key,GCS_BUCKET_NAME=your-bucket"
```

After deployment, update your frontend `environment.prod.ts` with the Cloud Run URL.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload file and generate study guide |
| GET | `/api/guide/:id` | Get study guide by ID |
| GET | `/api/guides` | List all guides (authenticated) |
| DELETE | `/api/guide/:id` | Delete guide (authenticated) |
| GET | `/api/export/quiz/:id` | Export quiz as DOCX |
| GET | `/api/export/flashcards/:id` | Export flashcards as DOCX |
| GET | `/api/export/summary/:id` | Export summary as DOCX |

### Authentication

Protected endpoints require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

---

## 🔐 Firebase Authentication

The app supports:
- **Email/Password** authentication
- **Google Sign-in**

Firebase ID tokens are verified in the backend using Firebase Admin SDK.

---

## 📦 Supported File Formats

| Format | Extension | Processing |
|--------|-----------|------------|
| PDF | .pdf | Text extraction |
| Word Document | .docx | Text extraction |
| Text | .txt, .md, .html | Direct read |
| Audio | .mp3, .wav | Speech-to-text |
| Video | .mp4 | Audio extraction → Speech-to-text |

---

## 🛠️ Development

### Frontend Development

```bash
cd frontend-angular
npm start
# Opens at http://localhost:4200
```

### Backend Development

```bash
cd backend-functions
python main.py
# Runs at http://localhost:8080
```

### Testing the API

```bash
# Health check
curl http://localhost:8080/api/health

# Upload a file
curl -X POST http://localhost:8080/api/upload \
  -F "file=@document.pdf"
```

---

## 📝 Features

- ✅ **Multi-format file upload** with drag-and-drop
- ✅ **AI-powered content generation** (Gemini Pro)
- ✅ **Interactive flashcards** with flip animation
- ✅ **Quiz mode** with scoring
- ✅ **Export to DOCX** for all content types
- ✅ **Firebase Authentication** (Email + Google)
- ✅ **Responsive design** for mobile/desktop
- ✅ **Share links** for study guides

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Original CodeRave 2024 hackathon submission
- Google Gemini for AI capabilities
- Firebase for authentication and hosting
- Angular team for the framework
