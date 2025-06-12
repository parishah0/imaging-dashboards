import dash
from dash import dcc, html, Input, Output
import pandas as pd
from google.cloud import bigquery
import os

# Auth to BigQuery
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/parishah/Desktop/Capstone_Project/hid502-7ab631613ed3.json"
client = bigquery.Client()

# Query BigQuery
try:
    query = """
        SELECT *
        FROM `hid502.FadwaCapstone2025.Patient_Demographics`
    """
    df = client.query(query).to_dataframe()
except Exception as e:
    print("❌ Error loading data from BigQuery:", e)
    df = pd.DataFrame()

app = dash.Dash(__name__)
app.title = "Patient Demographics Dashboard"

app.layout = html.Div([
    html.H1("📊 Patient Demographics Dashboard"),
    
    dcc.Dropdown(
        id='smoking-filter',
        options=[{'label': s, 'value': s} for s in df['cigsmok'].dropna().unique()],
        value=None,
        placeholder='Filter by Smoking Status',
        clearable=True
    ),
    
    dcc.Graph(id='age-distribution'),
    
    dcc.Graph(id='clinical-stage-count')
])

@app.callback(
    [Output('age-distribution', 'figure'),
     Output('clinical-stage-count', 'figure')],
    [Input('smoking-filter', 'value')]
)
def update_graphs(selected_smoking_status):
    filtered_df = df.copy()
    if selected_smoking_status:
        filtered_df = filtered_df[filtered_df['cigsmok'] == selected_smoking_status]
    
    age_fig = {
        'data': [{
            'x': filtered_df['age'],
            'type': 'histogram',
            'marker': {'color': 'skyblue'}
        }],
        'layout': {
            'title': 'Age Distribution',
            'xaxis': {'title': 'Age'},
            'yaxis': {'title': 'Count'}
        }
    }

    stage_fig = {
        'data': [{
            'x': filtered_df['clinical_stage'].value_counts().index,
            'y': filtered_df['clinical_stage'].value_counts().values,
            'type': 'bar',
            'marker': {'color': 'orange'}
        }],
        'layout': {
            'title': 'Number of Patients by Clinical Stage',
            'xaxis': {'title': 'Clinical Stage'},
            'yaxis': {'title': 'Count'}
        }
    }

    return age_fig, stage_fig

if __name__ == '__main__':
    print("Starting Dash app on http://127.0.0.1:8050")
    app.run(debug=True, port=8050, use_reloader=False)

