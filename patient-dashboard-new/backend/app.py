"""
app.py – FastAPI backend for NLST volume-measurement dashboard

Requires: fastapi, uvicorn[standard], python-dotenv, pandas, google-cloud-bigquery
Auth: GOOGLE_APPLICATION_CREDENTIALS (or Secret File on Render) must be configured.
"""

import os
from typing import List, Optional

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from google.cloud import bigquery

# --------------------------------------------------
# Environment & clients
# --------------------------------------------------
load_dotenv()

GCP_PROJECT = os.getenv("GCP_PROJECT", "idc-external-031")
DEFAULT_LIMIT = int(os.getenv("DEFAULT_LIMIT", "15000"))  # cap rows for free-tier RAM

client = bigquery.Client(project=GCP_PROJECT)

# --------------------------------------------------
# FastAPI app + CORS + GZip
# --------------------------------------------------
app = FastAPI(
    title="NLST Volume Box-and-Whisker API",
    version="0.2.0",
    description="Serves clinical and segmentation-volume data for the React dashboard.",
)

# CORS configuration via env:
# - FRONTEND_ORIGINS: comma-separated list of allowed origins (no trailing slashes)
# - ALLOW_ORIGIN_REGEX: optional regex for preview URLs, e.g. https://.*-user\.vercel\.app
# - ALLOW_CREDENTIALS: "true"/"false" (keep false unless you rely on cookies)
_frontend_origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173")
allow_origins = [o.strip() for o in _frontend_origins.split(",") if o.strip()]
allow_origin_regex = os.getenv("ALLOW_ORIGIN_REGEX") or None
allow_credentials = os.getenv("ALLOW_CREDENTIALS", "false").lower() == "true"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# compress JSON responses
app.add_middleware(GZipMiddleware, minimum_size=500)

# --------------------------------------------------
# Health / root
# --------------------------------------------------
@app.get("/")
def read_root():
    return {"status": "ok", "service": "nlst-api"}

@app.get("/healthz")
def health():
    return {"ok": True}

# --------------------------------------------------
# Helper: run a BigQuery SQL string and return DataFrame
# --------------------------------------------------
def bq(sql: str) -> pd.DataFrame:
    """Run a BigQuery query and return a pandas DataFrame."""
    # Avoid optional BigQuery Storage dependency
    return client.query(sql).to_dataframe(create_bqstorage_client=False)

# --------------------------------------------------
# Routes
# --------------------------------------------------
@app.get("/api/patient-data")
def patient_data():
    """
    Basic demographic data for populating summary widgets.
    """
    sql = """
        SELECT 
               PatientID  AS patient_id,
               age,
               gender_description,
               race_description,
               stage_description,
               cigsmok_description
        FROM `idc-external-031.nlst_capstone2025.clinical_data_mapping`
    """
    return bq(sql).to_dict(orient="records")


@app.get("/api/volume-data")
def volume_data(
    structure: str = Query(..., description="Anatomical structure (required)"),
    smoking_status: Optional[List[str]] = Query(None, description="Filter by smoking status"),
    gender: Optional[List[str]] = Query(None, description="Filter by gender"),
    race: Optional[List[str]] = Query(None, description="Filter by race"),
    clinical_stage: Optional[List[str]] = Query(None, description="Filter by clinical stage"),
    min_age: Optional[int] = Query(None, description="Minimum age"),
    max_age: Optional[int] = Query(None, description="Maximum age"),
    limit: int = Query(DEFAULT_LIMIT, ge=1000, le=200000, description="Max rows to return"),
):
    """
    Volume measurements with optional filters, returned as JSON.
    Server-side LIMIT is applied to stay within memory on small instances.
    """
    sql = """
        SELECT
          PatientID,
          gender        AS gender_description,
          race          AS race_description,
          age,
          clinical_stage,
          cigsmok       AS smoking_status,
          ClinicalTrialTimePointID,
          structure,
          segmentationSeriesUID,
          sourceSegmentedSeriesUID,
          StudyInstanceUID,
          SAFE_CAST(volume_ml AS FLOAT64) AS volume_ml
        FROM `idc-external-031.nlst_capstone2025.volume_measurements_joined_table`
        WHERE ClinicalTrialTimePointID IN ('T0', 'T1', 'T2')
    """

    conditions: List[str] = [f"structure = '{structure}'"]  # required

    if smoking_status:
        smoking_sql = "', '".join(smoking_status)
        conditions.append(f"cigsmok IN ('{smoking_sql}')")
    if gender:
        gender_sql = "', '".join(gender)
        conditions.append(f"gender IN ('{gender_sql}')")
    if race:
        race_sql = "', '".join(race)
        conditions.append(f"race IN ('{race_sql}')")
    if clinical_stage:
        stage_sql = "', '".join(clinical_stage)
        conditions.append(f"clinical_stage IN ('{stage_sql}')")
    if min_age is not None:
        conditions.append(f"age >= {min_age}")
    if max_age is not None:
        conditions.append(f"age <= {max_age}")

    if conditions:
        sql += " AND " + " AND ".join(conditions)

    # keep results bounded; stable-ish ordering
    sql += f"\nORDER BY ClinicalTrialTimePointID\nLIMIT {limit}"

    df = bq(sql)

    # Build IDC viewer URL on the fly
    df["viewer_url"] = (
        "https://viewer.imaging.datacommons.cancer.gov/v3/viewer/?StudyInstanceUIDs="
        + df["StudyInstanceUID"].astype(str)
        + "&SeriesInstanceUIDs="
        + df["sourceSegmentedSeriesUID"].astype(str)
        + ","
        + df["segmentationSeriesUID"].astype(str)
    )

    # Replace nulls for cleaner dropdowns
    for col in ("gender_description", "race_description", "clinical_stage", "smoking_status"):
        df[col] = df[col].fillna("N/A")

    return df.to_dict(orient="records")


@app.get("/api/structures")
def get_structures():
    """
    List of distinct anatomical structures in the dataset.
    """
    sql = """
        SELECT DISTINCT structure
        FROM `idc-external-031.nlst_capstone2025.volume_measurements_joined_table`
        WHERE structure IS NOT NULL
        ORDER BY structure
    """
    return bq(sql)["structure"].tolist()


@app.get("/api/filter-options")
def get_filter_options():
    """
    Aggregate endpoint to populate dropdowns and slider ranges.
    """
    base_sql = """
        SELECT DISTINCT
          cigsmok          AS smoking_status,
          gender           AS gender_description,
          race             AS race_description,
          clinical_stage,
          age
        FROM `idc-external-031.nlst_capstone2025.volume_measurements_joined_table`
    """

    df = bq(base_sql)

    response = {
        "smoking_status": sorted(df["smoking_status"].dropna().unique().tolist()),
        "gender": sorted(df["gender_description"].dropna().unique().tolist()),
        "race": sorted(df["race_description"].dropna().unique().tolist()),
        "clinical_stage": sorted(df["clinical_stage"].dropna().unique().tolist()),
    }

    # Age range (use same DF to avoid second query)
    if not df["age"].dropna().empty:
        response["age_range"] = {
            "min": int(df["age"].min()),
            "max": int(df["age"].max()),
        }
    else:
        response["age_range"] = {"min": 0, "max": 100}

    return response


# --------------------------------------------------
# Local development entry-point
# --------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
