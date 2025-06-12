import os
import streamlit as st
from google.cloud import bigquery
import pandas as pd
import matplotlib.pyplot as plt

# Set up Google Cloud credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/parishah/Desktop/Capstone_Project/hid502-7ab631613ed3.json"
client = bigquery.Client()

# Streamlit config
st.set_page_config(layout="wide")
st.title("🧬 Patient Demographics Dashboard")
st.markdown("Visual insights from the `Patient_Demographics` table.")

# Load data from BigQuery
@st.cache_data
def load_data():
    query = """
        SELECT *, cigsmok FROM `hid502.FadwaCapstone2025.Patient_Demographics`
    """
    return client.query(query).to_dataframe()

df = load_data()

# Optional filters
with st.expander("🔎 Filter options"):
    selected_gender = st.multiselect("Filter by gender", options=sorted(df["gender"].dropna().unique()))
    selected_race = st.multiselect("Filter by race", options=sorted(df["race"].dropna().unique()))
    selected_stage = st.multiselect("Filter by clinical stage", options=sorted(df["clinical_stage"].dropna().unique()))
    selected_smoking = st.multiselect("Filter by smoking status", options=sorted(df["cigsmok"].dropna().unique()))

    if selected_gender:
        df = df[df["gender"].isin(selected_gender)]
    if selected_race:
        df = df[df["race"].isin(selected_race)]
    if selected_stage:
        df = df[df["clinical_stage"].isin(selected_stage)]
    if selected_smoking:
        df = df[df["cigsmok"].isin(selected_smoking)]

# Layout: 3 charts side by side
col1, col2, col3 = st.columns(3)

# Clinical Stage
with col1:
    st.subheader("📊 Patients by Clinical Stage")
    fig1, ax1 = plt.subplots()
    df["clinical_stage"].value_counts().sort_index().plot(kind="bar", ax=ax1, edgecolor='black')
    ax1.set_xlabel("Clinical Stage")
    ax1.set_ylabel("Patient Count")
    st.pyplot(fig1)

# Gender
with col2:
    st.subheader("🧑‍🤝‍🧑 Gender Distribution")
    fig2, ax2 = plt.subplots()
    df["gender"].value_counts().plot(kind="bar", color='skyblue', edgecolor='black', ax=ax2)
    ax2.set_xlabel("Gender")
    ax2.set_ylabel("Patient Count")
    st.pyplot(fig2)

# Race
with col3:
    st.subheader("🌎 Race Distribution")
    fig3, ax3 = plt.subplots()
    df["race"].value_counts().plot(kind="bar", color='lightgreen', edgecolor='black', ax=ax3)
    ax3.set_xlabel("Race")
    ax3.set_ylabel("Patient Count")
    st.pyplot(fig3)

# Layout: 2 charts side by side for Age and Smoking Status
col4, col5 = st.columns(2)

# Age Distribution
with col4:
    st.subheader("📈 Age Distribution")
    fig4, ax4 = plt.subplots()
    ax4.hist(df["age"].dropna(), bins=20, edgecolor='black')
    ax4.set_xlabel("Age")
    ax4.set_ylabel("Frequency")
    st.pyplot(fig4)

# Smoking Status Distribution
with col5:
    st.subheader("🚬 Smoking Status Distribution")
    fig5, ax5 = plt.subplots()
    df["cigsmok"].value_counts().plot(kind="bar", color='orange', edgecolor='black', ax=ax5)
    ax5.set_xlabel("Smoking Status")
    ax5.set_ylabel("Patient Count")
    st.pyplot(fig5)

