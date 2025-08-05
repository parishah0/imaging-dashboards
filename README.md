# About

This repository implements interactive dashboard for exploring the content of the [`TotalSegmentator-CT-Segmentations` analysis results collection](https://doi.org/10.5281/zenodo.8347011) available from [NCI Imaging Data Commons](https://portal.imaging.datacommons.cancer.gov/explore/filters/?analysis_results_id=TotalSegmentator-CT-Segmentations). This collection includes volumetric segmentations generated using [`TotalSegmentator`](https://github.com/wasserth/TotalSegmentator) v1.6 model, an radiomics features extracted using [`pyradiomics`](https://github.com/AIM-Harvard/pyradiomics/). These analysis results augment the Computed Tomography (CT) images collected in the National Lung Screening Trial (NLST). To learn more about this dataset, check out the following references:

> Thiriveedhi, V. K., Krishnaswamy, D., Clunie, D., & Fedorov, A. (2024). TotalSegmentator-CT-Segmentations: TotalSegmentator segmentations and radiomics features for NCI Imaging Data Commons CT images [Data set]. Zenodo. https://doi.org/10.5281/zenodo.13900142

> Thiriveedhi, V. K., Krishnaswamy, D., Clunie, D., Pieper, S., Kikinis, R. & Fedorov, A. Cloud-based large-scale curation of medical imaging data using AI segmentation. Research Square (2024). https://doi.org/10.21203/rs.3.rs-4351526/v1
  
For a quick demonstration of the capabilities of this dashboard (limited to 15K records) see https://imaging-dashboards.vercel.app/.

Using this dashboard you can:
* examine the distributions of segmented organ volumes
* evaluate differences longitudinaly and across the sub-populations
* identify problematic segmentations
* use it as a basis for developing more advanced dashboard and demonstrations

Note that the dashboard relies on SQL queries against a Google BigQuery table containing the actual data. You will need to have credentials for a service account that is authorized to access that table if you would like to deploy this dashboard locally.

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
