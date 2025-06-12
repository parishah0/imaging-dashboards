import os
import streamlit as st
from google.cloud import bigquery
import pandas as pd
import matplotlib.pyplot as plt

# Authenticate and connect to BigQuery
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/parishah/Desktop/Capstone_Project/hid502-7ab631613ed3.json"
client = bigquery.Client()

# Page config
st.set_page_config(layout="wide")
st.title("🧠 Interactive dashboard for Imaging Data Commons")
st.markdown(
    '[TotalSegmentator-CT-Segmentations collection](https://www.cancerimagingarchive.net/totalsegmentator/)<br>'
    '<small>Select organ/structure and view volume distribution (mm³).</small>',
    unsafe_allow_html=True
)

# Cached data loader
@st.cache_data
def load_data():
    query = """
        SELECT
            segmentationSeriesUID,
            structure,
            SAFE_CAST(volume_mm3 AS FLOAT64) AS volume_mm3,
            StudyInstanceUID,
            sourceSegmentedSeriesUID
        FROM
            `hid502.FadwaCapstone2025.IDC_Table`
    """
    df = client.query(query).to_dataframe()

    # Create viewer URL
    df["viewer_url"] = (
        "https://viewer.imaging.datacommons.cancer.gov/v3/viewer/?StudyInstanceUIDs=" +
        df["StudyInstanceUID"] +
        "&SeriesInstanceUIDs=" +
        df["sourceSegmentedSeriesUID"] + "," +
        df["segmentationSeriesUID"]
    )

    return df

# Load and filter
df = load_data()
structure_list = sorted(df["structure"].dropna().unique())
selected_structure = st.selectbox("🔍 Select anatomical structure", structure_list)
filtered_df = df[df["structure"] == selected_structure]

# Display metrics
col1, col2 = st.columns(2)
col1.metric("📦 Unique Segmentations", f"{filtered_df['segmentationSeriesUID'].nunique():,}")
col2.metric("🔗 Viewer URLs", f"{filtered_df['viewer_url'].nunique():,}")

# Histogram
st.subheader(f"📊 Volume Distribution for {selected_structure}")
fig, ax = plt.subplots()
ax.hist(filtered_df["volume_mm3"], bins=30, edgecolor='black')
ax.set_xlabel("Volume (mm³)")
ax.set_ylabel("Frequency")
st.pyplot(fig)

# Optional: Show sample URLs
st.subheader("🔗 Example Viewer URLs")
st.write(filtered_df[["segmentationSeriesUID", "viewer_url"]].drop_duplicates().head(10))