"""
NLST Lung Cancer Imaging Dashboard

This project is an interactive Dash dashboard that visualizes longitudinal CT segmentation data 
and patient demographics from the NLST dataset hosted on the Imaging Data Commons. 
It supports exploration of organ volume changes across time points, stratified by demographic 
and clinical factors such as smoking status.

--------------------------------------------------------------------------------
GETTING STARTED

Prerequisites:
- Python 3.8+
- Google Cloud SDK (or access to a valid GCP project)
- Access to the `idc-external-031.nlst_capstone2025` BigQuery dataset
- BigQuery and GCP credentials set up

Install required packages:
    pip install dash pandas google-cloud-bigquery plotly

--------------------------------------------------------------------------------
FIRST STEP: Google Cloud Credentials

You must create a Google Cloud service account key JSON file.

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Create a service account and generate a key file
3. Save the JSON file to your machine

Then replace the following line in this script with the correct path to your credentials file:

    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/path/to/your/credentials.json"

Example:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/parishah/Desktop/Capstone_Project/hid502-7ab631613ed3.json"

--------------------------------------------------------------------------------
BIGQUERY ACCESS

Make sure your service account has permission to access the following dataset:
    idc-external-031.nlst_capstone2025

--------------------------------------------------------------------------------
RUN THE DASHBOARD

To run the dashboard:

Option 1: Full File Path
    python3 /full/path/to/app_new_table.py

Option 2: If you're already in the project directory
    python3 app_new_table.py

After running the script, visit the local URL in your terminal (e.g., http://127.0.0.1:8050/) 
to interact with the dashboard.

--------------------------------------------------------------------------------
CONTACT

For questions or access issues, contact: pps42@georgetown.edu
"""
