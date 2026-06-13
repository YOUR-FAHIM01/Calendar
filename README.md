# 📊 WorkTrack

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-emerald?style=for-the-badge" alt="Status Active" />
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Android-indigo?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/Built%20With-React%20%2B%20Vite%20%2B%20Tailwind-blue?style=for-the-badge" alt="Built With" />
</p>

---

### 🌟 About WorkTrack
**WorkTrack** is a modern, offline-first personal attendance and work tracking application designed to simplify logging hours, managing productivity, and monitoring historical schedules. Packed under an elegant responsive UI, the app acts as a companion for freelancers, remote contractors, and dedicated employees alike.

---

## 🛠️ Main Features
*   **📅 Interactive Calendar**: Tap dates to mark attendance (Present, Half Day, Absent, or Leave) and log hours immediately.
*   **🔥 Smart Streaks Tracker**: Stay motivated with detailed work streak statistics and milestone badges.
*   **📊 Rich Graphical Analytics**: View month-over-month graphs, average working hours, and state-of-the-art visual dashboards.
*   **📄 Dynamic Reports**: Generate downloadable spreadsheets and beautiful summarizations of your historical attendance.
*   **👤 Custom Profile & Badge Achievements**: Customize your profile name, email, target goals, and unlock status badges.
*   **🌗 Clean Dark & Light Theme**: Seamless toggle between eyes-safe, premium modes.

---

## 🚀 How to Run Locally

To get WorkTrack running on your machine:

1.  **Clone the directory** (or download the ZIP export).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start development server**:
    ```bash
    npm run dev
    ```
    This launches the dev client locally on `http://localhost:3000`.

---

## 🎨 How to Change the App Icon

Since the template is built on Vite, adding or changing an app icon is extremely easy:

### Step 1: Create a `public` Folder
If it doesn't already exist, create a folder named `public` at the root of your project:
```
├── public/
│   └── favicon.svg   <-- Place your custom app icon here
├── src/
├── index.html
```

### Step 2: Update `index.html`
Open your `/index.html` file and link your icon in the `<head>` tag:
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <title>WorkTrack - Attendance & Work Tracker</title>
</head>
```

---

## 📱 Build for Android & Run on Android Studio (Step-by-Step Guide)

You can convert this React + Tailwind app into an Android mobile app using **Capacitor** by Ionic. Follow this strict guide:

### Step 1: Install Capacitor in Your Project
In your project directory terminal, run the following commands to install Capacitor:
```bash
npm install @capacitor/core @capacitor/cli
```

### Step 2: Initialize Capacitor Config
Initialize your capacitor project setup by executing:
```bash
npx cap init WorkTrack com.yourname.worktrack --web-dir=dist
```
*(You can replace `com.yourname.worktrack` with your preferred package domain).*

### Step 3: Build Your Web Application
Always compile your React web application into a compiled production bundle first:
```bash
npm run build
```
This will compile all static files and place them inside the `/dist` directory.

### Step 4: Add the Android Platform
Install the Capacitor Android integration package and add the platform:
```bash
npm install @capacitor/android
npx cap add android
```

### Step 5: Sync Code to Android
Sync your web app's static files (`/dist`) with your newly created Android platform project:
```bash
npx cap sync
```

### Step 6: Open the Project in Android Studio
Open the project directly inside your local installation of Android Studio:
```bash
npx cap open android
```
This automatically boots Android Studio and imports your Android platform files. Inside Android Studio:
*   Click **Run** (the green play button) to launch the app on an emulator.
*   Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate your final installable `.apk` file.

---

## 🔄 How to Push Updates Once Published

After publishing or deploying your application, here is how you update the system:

### 🌐 For the Web Application (Cloud Run / Vercel / Netlify)
If you deploy your app directly through GitHub, simply push your updated code:
```bash
git add .
git commit -m "feat: updated app feature"
git push origin main
```
If your deployment uses continuous integration, your live web app will rebuild and redeploy within minutes.

### 📱 For the Android Application
Whenever you edit your React code (`src/...`) and want the live updates to reflect in your Android app:

1.  **Re-build your web files**:
    ```bash
    npm run dev  # (or make sure you have saved all changes locally)
    npm run build
    ```
2.  **Sync public files back to Capacitor**:
    ```bash
    npx cap sync
    ```
3.  **Compile/Generate New APK**:
    Open Android Studio again (`npx cap open android`), select **Build > Build APK(s)**, and distribute the updated APK! Alternatively, look into "Capacitor Live Updates" to push code updates to users over-the-air.

---

<p align="center">
  Developed with ❤️ using Google AI Studio Build.
</p>
