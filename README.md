# NoticeIQ — Tax Notice Analyzer
### by BizExpress · Powered by Claude AI

AI-powered analysis of GST and Income Tax notices. Upload a notice, get a full structured breakdown in seconds.

---

# COMPLETE SETUP GUIDE
## Written for Non-Developers (CA / Tax Professionals)

This guide walks you through everything — from zero to a live working app. It involves 5 services:
1. **GitHub** — stores your code
2. **Firebase** — stores user accounts, sessions, and uploaded files
3. **Anthropic** — the AI that reads and analyzes notices
4. **Vercel** — hosts your app on the internet (free)
5. **Your Computer** — only needed once to upload the code

Estimated time: **45–60 minutes** for first-time setup.

---

## PART 1 — Create a GitHub Account and Upload the Code

### Step 1.1 — Create a GitHub Account
1. Open your browser and go to: **https://github.com**
2. Click **"Sign up"** (top right)
3. Enter your email, create a password, choose a username (e.g. `bizexpress-noticeiq`)
4. Complete the verification and create your free account

### Step 1.2 — Create a New Repository (Code Storage)
1. After logging in, click the **"+"** icon at top right → **"New repository"**
2. Name it: `noticeiq` (all lowercase)
3. Set it to **Private** (so others can't see your code)
4. Leave all other settings as default
5. Click **"Create repository"**
6. GitHub shows you a page with a URL like `https://github.com/YOUR-USERNAME/noticeiq`
   - **Copy and save this URL** — you'll need it in Vercel

### Step 1.3 — Upload Your Code Files to GitHub
1. On the new repository page, you'll see a link that says **"uploading an existing file"** — click it
2. You'll see a large area that says "Drag files here"
3. Open the ZIP file you downloaded from this project
4. **Important:** Upload the files maintaining the folder structure. GitHub lets you drag and drop entire folders.
5. Drag the following into GitHub (maintain exact folder names):
   ```
   api/
   public/
   src/
   .env.example
   .gitignore
   firestore.rules
   index.html
   package.json
   postcss.config.js
   storage.rules
   tailwind.config.js
   vercel.json
   vite.config.js
   ```
6. Scroll down, add a commit message like "Initial upload"
7. Click **"Commit changes"**

✅ Your code is now on GitHub.

---

## PART 2 — Set Up Firebase (Database + Auth + File Storage)

Firebase is Google's service that stores your users, their sessions, and uploaded notice files.

### Step 2.1 — Create a Firebase Project
1. Go to: **https://console.firebase.google.com**
2. Log in with your Google account
3. Click **"Add project"**
4. Name it: `noticeiq-prod`
5. Disable Google Analytics (not needed) → click **Continue**
6. Wait 30 seconds for project creation → click **Continue**

### Step 2.2 — Enable Authentication (User Login)
1. In the left sidebar, click **"Authentication"**
2. Click **"Get started"**
3. Click **"Email/Password"** → toggle it **ON** → click **Save**
4. Click **"Add new provider"** → click **"Google"**
5. Toggle Google **ON**, enter a support email (your email) → click **Save**

### Step 2.3 — Enable Firestore Database (Session Storage)
1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in production mode"** → click **Next**
4. For location, select **"asia-south1 (Mumbai)"** → click **Enable**
5. Wait for it to set up (30–60 seconds)

### Step 2.4 — Set Firestore Security Rules
1. In Firestore, click the **"Rules"** tab
2. Delete all existing text
3. Copy and paste the following exactly:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /sessions/{sessionId} {
      allow read, update, delete: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```
4. Click **"Publish"**

### Step 2.5 — Enable Storage (File Uploads)
1. In the left sidebar, click **"Storage"**
2. Click **"Get started"**
3. Click **"Next"** (Production mode is fine)
4. Select **"asia-south1 (Mumbai)"** → click **Done**

### Step 2.6 — Set Storage Security Rules
1. In Storage, click the **"Rules"** tab
2. Delete all existing text
3. Copy and paste the following exactly:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /notices/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 20 * 1024 * 1024
        && (request.resource.contentType.matches('application/pdf')
            || request.resource.contentType.matches('image/.*'));
    }
  }
}
```
4. Click **"Publish"**

### Step 2.7 — Get Your Firebase Configuration Keys
1. In the top-left, click the **gear icon ⚙️** → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click the **web icon (</>)**
4. App nickname: `noticeiq-web` → click **"Register app"**
5. You will see a code block that looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "noticeiq-prod.firebaseapp.com",
  projectId: "noticeiq-prod",
  storageBucket: "noticeiq-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```
6. **Copy each value** — you will need all 6 values in Vercel later
7. Click **"Continue to console"**

✅ Firebase is fully set up.

---

## PART 3 — Get Your Anthropic API Key (AI Engine)

The Anthropic API key is what allows the app to read and analyze notices using Claude AI.

### Step 3.1 — Create an Anthropic Account
1. Go to: **https://console.anthropic.com**
2. Click **"Sign up"** and create an account
3. Verify your email

### Step 3.2 — Add Billing (Required for API use)
1. Click on your account name → **"Billing"**
2. Add a credit card
3. Add credits — **$10 is plenty to start** (approximately 50–100 notice analyses)
   - Each analysis costs roughly $0.05–$0.15 depending on notice length

### Step 3.3 — Create an API Key
1. In the left sidebar, click **"API Keys"**
2. Click **"Create Key"**
3. Name it: `noticeiq-production`
4. Click **"Create Key"**
5. **IMMEDIATELY COPY the key** — it starts with `sk-ant-api...`
   - ⚠️ You will never be able to see this key again after closing the window
   - Save it in a secure place (e.g. a password manager or private note)

✅ Anthropic API key is ready.

---

## PART 4 — Deploy on Vercel (Go Live!)

Vercel hosts your app on the internet for free and connects to your GitHub automatically.

### Step 4.1 — Create a Vercel Account
1. Go to: **https://vercel.com**
2. Click **"Sign up"**
3. Choose **"Continue with GitHub"** — this links your GitHub to Vercel automatically

### Step 4.2 — Import Your Project
1. After logging in, click **"Add New…"** → **"Project"**
2. You'll see your GitHub repositories listed
3. Find `noticeiq` and click **"Import"**

### Step 4.3 — Add All Environment Variables
This is the most important step. Before clicking Deploy, you must add all your secret keys.

Click **"Environment Variables"** and add each of the following one by one:

| Variable Name | Value (from where) |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase apiKey value |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase authDomain value |
| `VITE_FIREBASE_PROJECT_ID` | Firebase projectId value |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storageBucket value |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messagingSenderId value |
| `VITE_FIREBASE_APP_ID` | Firebase appId value |
| `ANTHROPIC_API_KEY` | Your Anthropic key starting with sk-ant... |
| `VITE_BIZEXPRESS_CONTACT` | https://bizexpress.in/contact (or your actual contact URL) |
| `VITE_BIZEXPRESS_PHONE` | Your phone number e.g. +91-9876543210 |

For each variable:
1. Type the name in the "Name" field
2. Paste the value in the "Value" field
3. Make sure **all 3 environments** are checked (Production, Preview, Development)
4. Click **"Add"**

### Step 4.4 — Deploy
1. After adding all variables, click **"Deploy"**
2. Vercel will build your app — this takes 2–4 minutes
3. When done, you'll see **"Congratulations! Your project has been deployed"**
4. Click the URL shown (it will be something like `noticeiq-xxx.vercel.app`)
5. Your app is LIVE! 🎉

### Step 4.5 — Add Your Domain (Optional but Recommended)
1. In your Vercel project, click **"Settings"** → **"Domains"**
2. Add your own domain e.g. `noticeiq.bizexpress.in`
3. Follow Vercel's instructions to add a DNS record at your domain registrar

---

## PART 5 — Add Firebase Authorized Domain

After deploying, you need to tell Firebase your app's URL so Google login works.

1. Go back to **Firebase Console** → **Authentication** → **Settings** tab
2. Scroll to **"Authorized domains"**
3. Click **"Add domain"**
4. Add your Vercel URL: `noticeiq-xxx.vercel.app` (the URL Vercel gave you)
5. If you added a custom domain, add that too
6. Click **"Add"**

---

## PART 6 — Test Your App

1. Open your app URL in a browser
2. Click **"Sign up free"**
3. Create an account with your details
4. Try uploading a sample notice (PDF or image)
5. Watch the AI analyze it!

---

## HOW UPDATES WORK (Future Changes)

Any time you want to make changes to the app:
1. Edit the files in your GitHub repository (click a file → pencil icon to edit)
2. Click **"Commit changes"**
3. Vercel automatically detects the change and redeploys in 2–3 minutes

That's it — no manual deployment needed.

---

## COSTS SUMMARY

| Service | Free Tier | When you'll need paid |
|---|---|---|
| GitHub | Free (private repos included) | Never for this use |
| Firebase | 10GB storage, 50k reads/day free | When you get 1000+ users |
| Anthropic | Pay per use | From day 1 (~₹4–12 per analysis) |
| Vercel | Free (100GB bandwidth/month) | If you get massive traffic |

---

## FOLDER STRUCTURE REFERENCE

```
noticeiq/
├── api/
│   └── analyze.js          ← AI analysis engine (Claude API call)
├── public/
│   └── favicon.svg         ← App icon
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx  ← Login/signup logic
│   │   └── ThemeContext.jsx ← Dark/light mode
│   ├── pages/
│   │   ├── AuthPage.jsx     ← Login/signup page
│   │   ├── Dashboard.jsx    ← Main dashboard with sessions
│   │   ├── NewSessionPage.jsx ← Upload notice page
│   │   └── SessionPage.jsx  ← Full analysis results
│   ├── components/
│   │   ├── Navbar.jsx       ← Top navigation bar
│   │   └── LoadingScreen.jsx ← Loading animation
│   ├── styles/
│   │   └── globals.css      ← All styling
│   ├── firebase.js          ← Firebase connection
│   ├── App.jsx              ← App routing
│   └── main.jsx             ← App entry point
├── .env.example             ← Template for your secret keys
├── .gitignore               ← Files not uploaded to GitHub
├── firestore.rules          ← Database security rules
├── storage.rules            ← File storage security rules
├── index.html               ← App HTML shell
├── package.json             ← App dependencies list
├── tailwind.config.js       ← Design system config
├── vercel.json              ← Deployment config
└── vite.config.js           ← Build tool config
```

---

## TROUBLESHOOTING

**"Firebase: Error (auth/unauthorized-domain)"**
→ Go to Firebase → Authentication → Settings → Authorized domains → add your Vercel URL

**"Analysis failed" when uploading notice**
→ Check that ANTHROPIC_API_KEY is correctly set in Vercel environment variables
→ Check your Anthropic account has billing/credits set up

**Google login not working**
→ Firebase → Authentication → Sign-in method → Google → ensure it's enabled
→ Add your app's URL to Firebase authorized domains (Part 5)

**App shows blank white page**
→ Usually means a Firebase config variable is missing or wrong
→ Check all VITE_FIREBASE_* values in Vercel → Settings → Environment Variables

---

## SUPPORT

Built by **BizExpress** — India's Business Compliance Partner
Website: https://bizexpress.in

*NoticeIQ is for informational purposes only. It does not constitute legal or tax advice.
Always consult a qualified CA or tax professional before responding to any notice from tax authorities.*
