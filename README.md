# Patient Dashboard Setup Guide

This project includes a backend (FastAPI) and frontend (React) for the Patient Dashboard. Follow the steps below to get started.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/parishah0/imaging-dashboards.git
cd patient-dashboard-new
```

---

### 2. Install Dependencies

#### 🧩 Node and NPM Versions

This project requires:

- **Node.js:** v23.11.1  
- **npm:** v10.9.2

To install the correct versions:

1. Go to the official Node.js download helper at [https://nodejs.org/en/download/package-manager](https://nodejs.org/en/download/package-manager)
2. Select the following parameters:
   - **Node.js version:** `v23.11.1`
   - **OS:** Your operating system (e.g., macOS, Linux, Windows)
   - **Installer:** `nvm`
   - **Package manager:** `npm`
3. Follow the installation instructions provided on the page.

Once installed, verify your versions:

```bash
node -v      # Should print "v23.11.1"
npm -v       # Should print "10.9.2"
```

#### 📦 Backend Dependencies

Navigate to the backend folder and install the required Python packages:

```bash
cd backend
pip3 install -r requirements.txt
```

#### 🎨 Frontend Dependencies

Navigate to the frontend folder and install the required Node modules:

```bash
cd ../frontend
npm install
```

---

## 🔐 Add Credentials

### 1. `.json` File

Place your service account key JSON file (e.g., `Pari-idc-external-031-c40d20a271c3.json`) in the `backend` directory.

### 2. `.env` File

In the `backend` directory, create a `.env` file and add the following line:

```env
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/your/json/file.json
```

Replace `/absolute/path/to/your/json/file.json` with the actual full path to your `.json` credentials file.

---

## ▶️ Running the Code

### Backend

```bash
cd backend
uvicorn app:app --reload
```

### Frontend

```bash
cd frontend
npm run dev
```

---

## ✅ You're Ready!

Once both the backend and frontend are running, the application will be accessible in your browser.
