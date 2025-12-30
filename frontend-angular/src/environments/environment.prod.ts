export const environment = {
    production: true,
    // Firebase Configuration - Replace with your Firebase project config
    firebase: {
        apiKey: 'YOUR_API_KEY',
        authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
        projectId: 'YOUR_PROJECT_ID',
        storageBucket: 'YOUR_PROJECT_ID.appspot.com',
        messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
        appId: 'YOUR_APP_ID'
    },
    // Backend API URL - Cloud Run production URL
    apiUrl: 'https://YOUR_CLOUD_RUN_URL/api'
};
