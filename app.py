import os
import pandas as pd
import dash
from dash import dcc, html, Input, Output
from google.cloud import bigquery
import plotly.express as px

# Authenticate with Google Cloud
import json
from google.oauth2 import service_account

service_account_info = json.loads(os.environ["GOOGLE_APPLICATION_CREDENTIALS_JSON"])
credentials = service_account.Credentials.from_service_account_info(service_account_info)
client = bigquery.Client(credentials=credentials)

# Load data from BigQuery
def load_data():
    query = """
        SELECT
          vol.PatientID,
          demo.gender_description,
          demo.race_description,
          demo.age,
          demo.stage_description AS clinical_stage,
          demo.cigsmok_description AS smoking_status,
          img.ClinicalTrialTimePointID,
          vol.structure,
          vol.segmentationSeriesUID,
          vol.sourceSegmentedSeriesUID,
          vol.StudyInstanceUID,
          SAFE_CAST(vol.volume_mm3 AS FLOAT64) AS volume_mm3
        FROM `idc-external-031.nlst_capstone2025.volume_measurements` vol
        JOIN `idc-external-031.nlst_capstone2025.nlst_imaging_characteristics` img
          ON vol.sourceSegmentedSeriesUID = img.sourceSegmentedSeriesUID
        JOIN `idc-external-031.nlst_capstone2025.clinical_data_mapping` demo
          ON vol.PatientID = demo.PatientID
    """
    df = client.query(query).to_dataframe()

    # Add viewer URL
    df["viewer_url"] = (
        "https://viewer.imaging.datacommons.cancer.gov/v3/viewer/?StudyInstanceUIDs=" +
        df["StudyInstanceUID"].astype(str) +
        "&SeriesInstanceUIDs=" +
        df["sourceSegmentedSeriesUID"].astype(str) + "," +
        df["segmentationSeriesUID"].astype(str)
    )
    return df

# Load + clean
df = load_data()
df = df[df['ClinicalTrialTimePointID'].isin(['T0', 'T1', 'T2'])]
df['ClinicalTrialTimePointID'] = pd.Categorical(df['ClinicalTrialTimePointID'], categories=['T0', 'T1', 'T2'], ordered=True)

# Dash app
app = dash.Dash(__name__)
app.title = "Aorta Volume Dashboard"

# Layout
app.layout = html.Div([
    html.H1("\U0001F9E0 Anatomical Structure Volume Distribution Over Time"),
    html.P("Explore volume distributions by structure and timepoint with demographic and clinical filters."),

    html.Label("\U0001F9EC Select Anatomical Structure"),
    dcc.Dropdown(
        id='structure-dropdown',
        options=[{'label': s, 'value': s} for s in sorted(df['structure'].dropna().unique())],
        value='Aorta',
        clearable=False,
        style={'marginBottom': '20px'}
    ),

    html.Div([
        dcc.Dropdown(
            id='smoking-filter',
            options=[{'label': s, 'value': s} for s in sorted(df['smoking_status'].dropna().unique())],
            placeholder="Filter by Smoking Status",
            multi=True
        ),
        dcc.Dropdown(
            id='gender-filter',
            options=[{'label': g, 'value': g} for g in sorted(df['gender_description'].dropna().unique())],
            placeholder="Filter by Gender",
            multi=True
        ),
        dcc.Dropdown(
            id='race-filter',
            options=[{'label': r, 'value': r} for r in sorted(df['race_description'].dropna().unique())],
            placeholder="Filter by Race",
            multi=True
        ),
        dcc.Dropdown(
            id='stage-filter',
            options=[{'label': s, 'value': s} for s in sorted(df['clinical_stage'].dropna().unique())],
            placeholder="Filter by Clinical Stage",
            multi=True
        ),
        dcc.RangeSlider(
            id='age-filter',
            min=df['age'].min(),
            max=df['age'].max(),
            step=1,
            value=[df['age'].min(), df['age'].max()],
            marks={int(age): str(int(age)) for age in range(int(df['age'].min()), int(df['age'].max())+1, 10)},
            tooltip={"placement": "bottom", "always_visible": False}
        )
    ], style={'marginBottom': '25px'}),

    html.Div(id='segmentation-count', style={'marginBottom': '10px', 'fontWeight': 'bold'}),

    dcc.Graph(id='volume-boxplot')
])

# Callback
@app.callback(
    [Output('volume-boxplot', 'figure'),
     Output('segmentation-count', 'children')],
    [Input('structure-dropdown', 'value'),
     Input('smoking-filter', 'value'),
     Input('gender-filter', 'value'),
     Input('race-filter', 'value'),
     Input('stage-filter', 'value'),
     Input('age-filter', 'value')]
)
def update_boxplot(structure, smoking, gender, race, stage, age_range):
    filtered = df[df['structure'] == structure].copy()

    if smoking:
        filtered = filtered[filtered['smoking_status'].isin(smoking)]
    if gender:
        filtered = filtered[filtered['gender_description'].isin(gender)]
    if race:
        filtered = filtered[filtered['race_description'].isin(race)]
    if stage:
        filtered = filtered[filtered['clinical_stage'].isin(stage)]
    if age_range:
        filtered = filtered[(filtered['age'] >= age_range[0]) & (filtered['age'] <= age_range[1])]

    for col in ['gender_description', 'race_description', 'clinical_stage', 'viewer_url']:
        filtered[col] = filtered[col].fillna('N/A')

    fig = px.box(
        filtered,
        x='ClinicalTrialTimePointID',
        y='volume_mm3',
        color='smoking_status',
        points='all',
        category_orders={'ClinicalTrialTimePointID': ['T0', 'T1', 'T2']},
        labels={
            'volume_mm3': f'{structure} Volume (mm³)',
            'ClinicalTrialTimePointID': 'Time Point',
            'smoking_status': 'Smoking Status'
        },
        hover_data={
            'gender_description': True,
            'race_description': True,
            'clinical_stage': True,
            'viewer_url': True
        },
        title=f'Distribution of {structure} Volume by Time Point and Smoking Status'
    )

    fig.update_layout(
        showlegend=True,
        height=550,
        hovermode='closest'
    )

    segmentation_count = f"📦 Unique Segmentations: {filtered['segmentationSeriesUID'].nunique():,}"

    return fig, segmentation_count

# Run app
if __name__ == '__main__':
    print("Running at http://127.0.0.1:8050")
    app.run(debug=True, port=8050, use_reloader=False)
