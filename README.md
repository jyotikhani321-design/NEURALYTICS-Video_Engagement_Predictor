# 📺 YouTube Engagement Rate Predictor (Neuralytics)

An AI-powered multimodal deep learning and GNN-enhanced system designed to predict YouTube video engagement rates. It processes video thumbnails (visual), title/description/tags (textual), and view statistics (tabular) to estimate the engagement rate and provides multi-channel explainability (XAI) overlays.
---

## 🎓 Summer Internship Project
This project was developed as a **Summer Project** during a 6-week **Computer Vision & Deep Learning (CVDL)** internship (from June 2nd to July 11th, 2025) conducted by **Anveshan Foundation, IGDTUW** (Indira Gandhi Delhi Technical University for Women) in our first year of university.

* **Team Members:** 
  * Jyoti
  * Radhika Dwivedi
---

Project Evolution

Phase 1 (July 2025): Core research, data preprocessing, and model development in Jupyter.
Phase 2 (Post-Internship): Development of Dashboard to visualize model predictions and explainability features (XAI).
---

## 🚀 Key Features

* **Multimodal Architecture**: Integrates visual features (ResNet18 CNN), natural language embeddings (Bi-LSTM + Attention), and numerical/categorical metadata (MLP).
* **Graph Neural Network (GNN)**: Utilizes GCN (Graph Convolutional Networks) to propagate video features across a similarity graph constructed based on shared channels and categories.
* **Triple-Channel Explainability (XAI)**:
  * **Grad-CAM**: Generates heatmaps visualizing CNN attention over thumbnails.
  * **Text Attention Mapping**: Highlights high-coefficient words driving prediction in the text parser.
  * **SHAP values**: Plots feature contribution of tabular variables (views, likes, comments).
* **Interactive Dashboard**: A glassmorphic web dashboard built from scratch featuring interactive charts (via Chart.js), simulated model comparison, real-time URL metadata inspector, and SVG network architecture visualization.
---

## 📊 Engagement Rate Formula
The target metric is the video **Engagement Rate (ER)**, defined as:

$$\text{Engagement Rate} = \frac{\text{Likes} + \text{Comment Count}}{\text{View Count}}$$
---

## 🛠️ Tech Stack

### Deep Learning Pipeline (Python)
* **Framework**: PyTorch
* **GNN Engine**: PyTorch Geometric (PyG)
* **Vision Backbone**: ResNet-18 (Pytorch / TorchVision)
* **Text Processor**: Keras Tokenizer & Bidirectional LSTM with Attention Pooling
* **Explainability**: SHAP (SHapley Additive exPlanations), Grad-CAM
* **Data Prep**: Pandas, NumPy, Scikit-learn, yt-dlp

### Dashboard UI (Web)
* **Frontend**: HTML, JavaScript, CSS
---

## 🏗️ Model Architecture

The prediction pipeline extracts features from three distinct modalities, concatenates or merges them using early/late/graph fusion techniques, and maps them to a continuous prediction value (regression task):

```
                     ┌────────────────────────────────┐
                     │     Title, Desc, Tags (Text)   │
                     └───────────────┬────────────────┘
                                     ▼
                           [ Bi-LSTM + Attention ]
                                     │
                                     ▼
 ┌───────────────┐        ┌───────────────────┐        ┌──────────────────┐
 │ Thumbnail Img │        │   Concatenation / │        │Views, Likes (Tab)│
 └───────┬───────┘        │   Early Fusion    │        └────────┬─────────┘
         ▼                └─────────┬─────────┘                 ▼
   [ ResNet-18 ]                    │                     [ MLP + BatchNorm ]
         │                          ▼                           │
         └─────────────────►[ GNN Propagation ]◄────────────────┘
                                    │
                                    ▼
                          ┌───────────────────┐
                          │Predicted Engagement│
                          └───────────────────┘
```

### Model Performance Registry (Mean Absolute Error)
Lower is better:

| Model Architecture | Test MAE | Status |
| :--- | :--- | :--- |
| **Text + Tab Bimodal (Baseline)** | **0.0227** | ⭐ Best Baseline |
| **Tabular-only (MLP)** | 0.0230 | Unimodal |
| **Text-only (Bi-LSTM + Attn)** | 0.0263 | Unimodal |
| **Image-only (ResNet18)** | 0.0329 | Unimodal |
| **Multimodal Late Fusion** | 0.0357 | Fusion |
| **Multimodal Early Fusion** | 0.1135 | Fixed Version Available |
| **Multimodal + GNN** | 0.2105 | Fixed Version Available |

*Note: Feature alignment issues in earlier versions of the Early Fusion and GNN models were fixed to yield errors comparable to the Bimodal baseline.*
---

## 📁 Repository Structure
```
├── Final_Project (2)/
│   ├── Fyoutube_engagement_multimodal (1).ipynb   # Jupyter Notebook with full PyTorch training pipeline
│   └── youtube_10k_sample.csv                     # Cleaned dataset sample of 10,000 trending videos
├── index.html                                     # Dashboard UI Layout
├── style.css                                      # Premium Glassmorphic stylesheet
├── app.js                                         # Navigation, Simulator & chart renderer code
└── README.md                                      # Project documentation
```
---

## ⚡ Setup & Execution

### 1. Training Pipeline (Jupyter Notebook)
Open [Fyoutube_engagement_multimodal (1).ipynb](file:///c:/Users/Jyoti/Desktop/Youtube_Engagement_Rate_pridiction-/Final_Project%20(2)/Fyoutube_engagement_multimodal%20(1).ipynb) in **Google Colab** or setup a local Jupyter instance.

To run locally, install the dependencies:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install torch-scatter torch-sparse torch-cluster torch-spline-conv torch-geometric -f https://data.pyg.org/whl/torch-2.3.0+cu121.html
pip install pandas numpy scikit-learn matplotlib shap yt-dlp transformers tensorflow
```

Run all cells in the notebook to:
1. Preprocess and clean `youtube_10k_sample.csv`.
2. Extract text features, download thumbnails, and run feature extractions.
3. Construct the similarity graph and train bimodal, unimodal, fused, and GNN model architectures.
4. Run SHAP, LSTM attention heatmaps, and Grad-CAM on sample test videos.

### 2. Interactive Web Dashboard
No complex setup is required for the web portal. Since it's built using vanilla web tech:

1. Double-click [index.html](file:///c:/Users/Jyoti/Desktop/Youtube_Engagement_Rate_pridiction-/index.html) to open it directly in any browser.
2. Alternatively, serve it using a simple HTTP server (like VS Code Live Server or python helper):
   ```bash
   python -m http-server 8000
   ```
   Then open `http://localhost:8000` in your browser.
3. Test predictions by selecting any of the preset trending videos or paste your own YouTube URL to inspect calculated values, charts, and simulated heatmaps.
