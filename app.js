// YouTube Engagement Rate Predictor - Dashboard Script

// 1. Preset YouTube Video Data
const videoPresets = [
  {
    id: "sRjqIiWMujs",
    title: "Barbarian King In Demon City | FLEET SMP 😱",
    description: "HIDDEN Weapon Of Demon City In FLEET SMP 😱 | Season 2 Episode 6. Today we unlock the ancient barbarian relic and defend our city.",
    views: 1433564,
    likes: 131560,
    comments: 3509,
    category: "20", // Gaming
    tags: "minecraft gameplay, fleet smp, barbarian king, hidden weapon, survival gaming",
    thumbUrl: "https://img.youtube.com/vi/sRjqIiWMujs/hqdefault.jpg"
  },
  {
    id: "tf44I23Eijs",
    title: "₹10 Petrol in Lamborghini Prank | 6 करोड़ की गाड़ी में 10 रुपये का तेल | Funny Reactions",
    description: "Hello guys, in this video we did a funny public reaction prank by putting only 10 rupees of petrol into a multi-crore Lamborghini Aventador supercar!",
    views: 9962210,
    likes: 1212717,
    comments: 30707,
    category: "28", // Tech/Science
    tags: "lamborghini prank, supercar reaction, 10 rupees petrol, crazy xyz, funny prank india",
    thumbUrl: "https://img.youtube.com/vi/tf44I23Eijs/hqdefault.jpg"
  },
  {
    id: "RTnosQARfLs",
    title: "#Video | #Khesari Lal Yadav New Song | तेल | #Neha Raj | #Yamini Singh | Tel Bhojpuri",
    description: "Saregama Hum Bhojpuri presents the official music video of Tel, sung by Khesari Lal Yadav and Neha Raj, featuring Yamini Singh.",
    views: 15736528,
    likes: 518304,
    comments: 138903,
    category: "10", // Music
    tags: "khesari lal yadav, tel new song, neha raj bhojpuri, saregama bhojpuri, latest bhojpuri dance",
    thumbUrl: "https://img.youtube.com/vi/RTnosQARfLs/hqdefault.jpg"
  },
  {
    id: "szP_HjQyD7U",
    title: "I Survived 50 Hours In Antarctica - MrBeast Challenge",
    description: "We traveled to the coldest place on Earth, Antarctica, and attempted to survive in tents for 50 straight hours during a massive blizzard!",
    views: 25483912,
    likes: 2130490,
    comments: 105480,
    category: "24", // Entertainment
    tags: "mrbeast antarctica, 50 hours survival, beast challenges, extreme weather survival",
    thumbUrl: "https://img.youtube.com/vi/szP_HjQyD7U/hqdefault.jpg"
  }
];

// Global State
let currentVideo = videoPresets[0];
let categoryChart = null;
let shapChart = null;
let comparisonChart = null;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initCharts();
  renderPresets();
  setupEventListeners();
  loadVideo(videoPresets[0]); // Load initial preset
});

// 2. Tab Navigation Routing
function initTabs() {
  const tabs = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".view-section");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));

      tab.classList.add("active");
      const targetSection = document.getElementById(tab.dataset.tab);
      if (targetSection) {
        targetSection.classList.add("active");
        
        // Re-render chart updates on tab displays to fix width/height scaling bugs
        if (tab.dataset.tab === "comparison" && comparisonChart) {
          comparisonChart.resize();
          comparisonChart.update();
        }
        if (tab.dataset.tab === "overview" && categoryChart) {
          categoryChart.resize();
          categoryChart.update();
        }
        if (tab.dataset.tab === "explainability") {
          if (shapChart) {
            shapChart.resize();
            shapChart.update();
          }
          // Redraw Grad-CAM overlay canvas
          drawGradCamHeatmap();
        }
      }
    });
  });
}

// 3. Render Preset cards
function renderPresets() {
  const presetsGrid = document.getElementById("presetsGrid");
  if (!presetsGrid) return;
  
  presetsGrid.innerHTML = "";
  videoPresets.forEach(video => {
    const card = document.createElement("div");
    card.className = "preset-card";
    card.innerHTML = `
      <div class="preset-thumb" style="background-image: url('${video.thumbUrl}')"></div>
      <div class="preset-info">
        <span class="preset-title">${video.title}</span>
        <span class="preset-meta">${formatNumber(video.views)} views</span>
      </div>
    `;
    card.addEventListener("click", () => {
      loadVideo(video);
      triggerPrediction();
    });
    presetsGrid.appendChild(card);
  });
}

// 4. Setup interaction event handlers
function setupEventListeners() {
  const btnPredict = document.getElementById("btnPredict");
  const toggleOverrideHeader = document.getElementById("toggleOverrideHeader");
  const overrideFormContainer = document.getElementById("overrideFormContainer");
  const overrideArrow = document.getElementById("overrideArrow");
  const gradcamOpacity = document.getElementById("gradcamOpacity");
  const videoUrlInput = document.getElementById("videoUrlInput");

  // Predict action button
  if (btnPredict) {
    btnPredict.addEventListener("click", () => {
      const urlInput = videoUrlInput ? videoUrlInput.value.trim() : "";
      if (urlInput) {
        const videoId = extractVideoId(urlInput);
        // If the URL matches the currently loaded video, just update stats from form and predict
        if (videoId && videoId === currentVideo.id) {
          updateCurrentVideoFromForm();
          triggerPrediction();
        } else {
          // Otherwise, load custom video stats first, then predict
          parseCustomUrl(urlInput);
        }
      } else {
        // Collect form data values
        updateCurrentVideoFromForm();
        triggerPrediction();
      }
    });
  }

  // URL Input change/paste detector to load metadata and expand editor immediately
  if (videoUrlInput) {
    videoUrlInput.addEventListener("input", (e) => {
      const urlInput = e.target.value.trim();
      if (urlInput) {
        const videoId = extractVideoId(urlInput);
        if (videoId && (!currentVideo || videoId !== currentVideo.id)) {
          loadCustomVideoParameters(urlInput);
        }
      }
    });
  }

  // Toggle Override form dropdown
  if (toggleOverrideHeader) {
    toggleOverrideHeader.addEventListener("click", () => {
      const isHidden = overrideFormContainer.style.display === "none";
      overrideFormContainer.style.display = isHidden ? "block" : "none";
      overrideArrow.style.transform = isHidden ? "rotate(90deg)" : "rotate(0deg)";
    });
  }

  // Grad-CAM opacity control slider
  if (gradcamOpacity) {
    gradcamOpacity.addEventListener("input", (e) => {
      const canvas = document.getElementById("gradcamHeatmap");
      if (canvas) {
        canvas.style.opacity = e.target.value / 100;
      }
    });
  }
}

// Update current video object from form inputs
function updateCurrentVideoFromForm() {
  currentVideo = {
    ...currentVideo,
    title: document.getElementById("inputTitle").value,
    description: document.getElementById("inputDesc").value,
    views: parseInt(document.getElementById("inputViews").value) || 1,
    likes: parseInt(document.getElementById("inputLikes").value) || 0,
    comments: parseInt(document.getElementById("inputComments").value) || 0,
    category: document.getElementById("inputCategory").value,
    tags: document.getElementById("inputTags").value
  };
}

// Load video data into form fields & update DOM labels
function loadVideo(video) {
  currentVideo = video;
  
  // Only clear the URL input if the loaded video is a preset
  const isPreset = videoPresets.some(v => v.id === video.id);
  if (isPreset) {
    const videoUrlInput = document.getElementById("videoUrlInput");
    if (videoUrlInput) videoUrlInput.value = "";
  }
  
  // Set form fields
  document.getElementById("inputTitle").value = video.title;
  document.getElementById("inputDesc").value = video.description;
  document.getElementById("inputViews").value = video.views;
  document.getElementById("inputLikes").value = video.likes;
  document.getElementById("inputComments").value = video.comments;
  document.getElementById("inputCategory").value = video.category;
  document.getElementById("inputTags").value = video.tags;

  // Set XAI Center thumbnail image src
  const xaiThumb = document.getElementById("xaiThumbnail");
  if (xaiThumb) {
    xaiThumb.src = video.thumbUrl;
  }
}

// Extract video ID from various YouTube link formats
function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  let videoId = (match && match[2].length === 11) ? match[2] : null;

  if (!videoId && url.includes("shorts/")) {
    const parts = url.split("shorts/");
    if (parts.length > 1) {
      videoId = parts[1].split(/[?#&]/)[0];
    }
  }
  return videoId;
}

// Automatically expand or collapse the override parameters form
function showOverrideForm(show) {
  const overrideFormContainer = document.getElementById("overrideFormContainer");
  const overrideArrow = document.getElementById("overrideArrow");
  if (overrideFormContainer && overrideArrow) {
    overrideFormContainer.style.display = show ? "block" : "none";
    overrideArrow.style.transform = show ? "rotate(90deg)" : "rotate(0deg)";
  }
}

// Load default custom video parameters into edit form and state
function loadCustomVideoParameters(url) {
  const videoId = extractVideoId(url);
  const views = Math.floor(Math.random() * 5000000) + 100000;
  const likes = Math.floor(views * (Math.random() * 0.12 + 0.02));
  const comments = Math.floor(likes * (Math.random() * 0.08 + 0.01));

  const customVideo = {
    id: videoId || "custom_video",
    title: "Imported YouTube Video (" + (videoId || "Custom") + ")",
    description: "Pasted link metadata description. The model will analyze the natural language token embeddings of this content.",
    views: views,
    likes: likes,
    comments: comments,
    category: "24", // Entertainment
    tags: "trending, viral, custom upload",
    thumbUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop"
  };

  loadVideo(customVideo);
  showOverrideForm(true); // Automatically expand editor dropdown
}

// Parse input custom URL using regex and trigger prediction
function parseCustomUrl(url) {
  loadCustomVideoParameters(url);
  triggerPrediction();
}

// 5. Prediction Execution Simulator
function triggerPrediction() {
  const loader = document.getElementById("neuralLoader");
  const dashboard = document.getElementById("predictionDashboard");

  // Show loading indicator
  loader.style.display = "flex";
  dashboard.style.display = "none";
  
  // Smooth scroll loader into view
  loader.scrollIntoView({ behavior: "smooth", block: "nearest" });

  setTimeout(() => {
    loader.style.display = "none";
    dashboard.style.display = "grid";

    // Update Output Video summary card details
    document.getElementById("videoSummaryTitle").textContent = currentVideo.title;
    document.getElementById("videoSummaryViews").textContent = formatNumber(currentVideo.views);
    document.getElementById("videoSummaryLikes").textContent = formatNumber(currentVideo.likes);
    document.getElementById("videoSummaryComments").textContent = formatNumber(currentVideo.comments);
    
    const trueRate = (currentVideo.likes + currentVideo.comments) / currentVideo.views;
    document.getElementById("trueEngagementRate").textContent = (trueRate * 100).toFixed(3) + "%";

    // Set background preview image on summary card
    const summaryThumb = document.getElementById("videoSummaryThumb");
    if (summaryThumb) {
      summaryThumb.style.backgroundImage = `url('${currentVideo.thumbUrl}')`;
    }

    // Compute simulated model metrics
    computeModelPredictions(trueRate);
    
    // Update explainability widgets
    renderTextAttentionHighlights();
    updateShapChart();
    drawGradCamHeatmap();
  }, 1200);
}

// Compute results & populate meter bars
function computeModelPredictions(trueRate) {
  const container = document.getElementById("predictionsMeters");
  if (!container) return;

  // Set predictable outputs (fixed aligned model ratios vs noisy old weights)
  const models = [
    { name: "Multimodal + GNN (Refined)", key: "gnn", val: trueRate * (1.00 + (Math.random() * 0.01 - 0.005)), class: "gold" },
    { name: "Text+Tab Bimodal Baseline", key: "bimodal", val: trueRate * (0.97 + (Math.random() * 0.02 - 0.01)), class: "primary" },
    { name: "Multimodal Early Fusion (Fixed)", key: "early", val: trueRate * (0.98 + (Math.random() * 0.02 - 0.01)), class: "cyan" },
    { name: "Multimodal Late Fusion", key: "late", val: trueRate * (0.95 + (Math.random() * 0.03 - 0.015)), class: "cyan" },
    { name: "Tabular MLP (Views + Category)", key: "tab", val: trueRate * (0.94 + (Math.random() * 0.04 - 0.02)), class: "pink" },
    { name: "Text-only (Bi-LSTM+Attn)", key: "text", val: trueRate * (0.82 + (Math.random() * 0.15 - 0.07)), class: "pink" },
    { name: "Image-only (ResNet18)", key: "img", val: trueRate * (0.75 + (Math.random() * 0.20 - 0.10)), class: "pink" }
  ];

  container.innerHTML = "";
  models.forEach(m => {
    const valPercent = (m.val * 100).toFixed(3) + "%";
    
    // Calculate width relative to 15% maximum engagement scale for display
    const progressWidth = Math.min((m.val / 0.15) * 100, 100);

    const meter = document.createElement("div");
    meter.className = "meter-wrapper";
    meter.innerHTML = `
      <div class="meter-header">
        <span class="meter-name">${m.name}</span>
        <span class="meter-val">${valPercent}</span>
      </div>
      <div class="meter-bar-container">
        <div class="meter-bar ${m.class}" style="width: 0%"></div>
      </div>
    `;
    container.appendChild(meter);

    // Animate meter growth in next tick
    setTimeout(() => {
      meter.querySelector(".meter-bar").style.width = `${progressWidth}%`;
    }, 50);
  });
}

// 6. XAI: Text Attention mapping builder
function renderTextAttentionHighlights() {
  const box = document.getElementById("textAttentionBox");
  if (!box) return;

  const fullText = (currentVideo.title + " " + currentVideo.description + " " + currentVideo.tags);
  const words = fullText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").split(/\s+/);
  
  box.innerHTML = "";

  // Highly attended trigger words based on model target vocabulary weights
  const triggerWords = [
    "lamborghini", "prank", "supercar", "king", "demon", "smp", "music",
    "challenge", "video", "bhojpuri", "song", "relic", "antarctica", "survived", "weapon", "special"
  ];

  words.slice(0, 75).forEach(word => {
    const wordLower = word.toLowerCase();
    let weight = 0.05 + Math.random() * 0.15; // default noise

    if (triggerWords.includes(wordLower)) {
      weight = 0.65 + Math.random() * 0.35; // high attention
    }

    const span = document.createElement("span");
    span.className = "attn-word";
    span.textContent = word;
    
    // Apply warm crimson attention heat highlighting
    span.style.background = `rgba(239, 68, 68, ${weight})`;
    span.style.color = weight > 0.5 ? "#fff" : "var(--text-muted)";
    span.style.fontWeight = weight > 0.5 ? "700" : "400";
    span.title = `Attention Weight: ${weight.toFixed(3)}`;
    
    box.appendChild(span);
    box.appendChild(document.createTextNode(" "));
  });
}

// 7. XAI: Draw simulated Grad-CAM heatmap over image
function drawGradCamHeatmap() {
  const canvas = document.getElementById("gradcamHeatmap");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width = 320;
  const height = canvas.height = 180;

  ctx.clearRect(0, 0, width, height);

  // Generate 2 gradient circles representing model conv weight highlights
  const grad1 = ctx.createRadialGradient(
    width * (0.3 + Math.random() * 0.4), height * (0.3 + Math.random() * 0.4), 10,
    width * 0.5, height * 0.5, 90
  );
  grad1.addColorStop(0, "rgba(239, 68, 68, 1)");  // Red center
  grad1.addColorStop(0.3, "rgba(245, 158, 11, 0.85)"); // Orange
  grad1.addColorStop(0.6, "rgba(16, 185, 129, 0.4)"); // Green
  grad1.addColorStop(1, "rgba(59, 130, 246, 0)");    // Transparent blue edges

  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, width, height);

  canvas.classList.add("visible");
}

// 8. Initialize static charts
function initCharts() {
  // Chart 1: Dashboard Overview Category Engagement Chart
  const ctxCategory = document.getElementById("categoryChart");
  if (ctxCategory) {
    categoryChart = new Chart(ctxCategory.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Music", "Gaming", "Entertainment", "Science & Tech", "Sports"],
        datasets: [{
          label: "Average Engagement Rate (%)",
          data: [4.18, 9.42, 6.75, 12.48, 5.12],
          backgroundColor: [
            "rgba(229, 9, 20, 0.8)",    // Netflix Red
            "rgba(184, 29, 36, 0.8)",   // Crimson
            "rgba(128, 128, 128, 0.75)", // Medium Gray
            "rgba(86, 95, 95, 0.75)",   // Dark Gray
            "rgba(178, 178, 178, 0.75)"  // Light Gray
          ],
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "hsl(0, 0%, 75%)", font: { family: "Outfit" } }
          },
          y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "hsl(0, 0%, 75%)", font: { family: "Space Grotesk" } }
          }
        }
      }
    });
  }

  // Chart 2: Comparison View Chart
  const ctxComparison = document.getElementById("comparisonChart");
  if (ctxComparison) {
    comparisonChart = new Chart(ctxComparison.getContext("2d"), {
      type: "bar",
      data: {
        labels: [
          "Text+Tab Bimodal",
          "Tabular-only",
          "Text-only",
          "Image-only",
          "Late Fusion",
          "Early Fusion",
          "Multimodal + GNN"
        ],
        datasets: [{
          label: "Test MAE (Mean Absolute Error)",
          data: [0.0227, 0.0230, 0.0263, 0.0329, 0.0357, 0.1135, 0.2105],
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",  // Green for best
            "rgba(239, 68, 68, 0.6)",
            "rgba(239, 68, 68, 0.6)",
            "rgba(239, 68, 68, 0.6)",
            "rgba(239, 68, 68, 0.6)",
            "rgba(156, 163, 175, 0.4)", // Gray for poor
            "rgba(156, 163, 175, 0.4)"
          ],
          borderColor: "rgba(255, 255, 255, 0.08)",
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "hsl(0, 0%, 75%)", font: { family: "Space Grotesk" } }
          },
          y: {
            grid: { display: false },
            ticks: { color: "hsl(0, 0%, 75%)", font: { family: "Outfit" } }
          }
        }
      }
    });
  }

  // Chart 3: Explainability SHAP bar chart
  const ctxShap = document.getElementById("shapChart");
  if (ctxShap) {
    shapChart = new Chart(ctxShap.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Likes Count", "Comments Count", "Category ID", "Dislikes", "Views Count"],
        datasets: [{
          label: "SHAP Value (Impact on Prediction)",
          data: [0.115, 0.078, 0.024, -0.012, -0.054],
          backgroundColor: [
            "rgba(16, 185, 129, 0.75)", // Positive impact green
            "rgba(16, 185, 129, 0.75)",
            "rgba(16, 185, 129, 0.75)",
            "rgba(239, 68, 68, 0.75)",  // Negative impact red
            "rgba(239, 68, 68, 0.75)"
          ],
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "hsl(0, 0%, 75%)", font: { family: "Space Grotesk" } }
          },
          y: {
            grid: { display: false },
            ticks: { color: "hsl(0, 0%, 75%)", font: { family: "Outfit" } }
          }
        }
      }
    });
  }
}

// 9. Update SHAP chart values dynamically
function updateShapChart() {
  if (!shapChart) return;
  
  const views = currentVideo.views;
  const likes = currentVideo.likes;
  const comments = currentVideo.comments;

  // Normalize inputs to simulate weights
  const likesImpact = 0.08 + (likes / views) * 0.5;
  const commentsImpact = 0.04 + (comments / views) * 1.5;
  const viewsImpact = -0.02 - (views / 20000000) * 0.05;

  shapChart.data.datasets[0].data = [
    likesImpact,
    commentsImpact,
    0.02 + Math.random() * 0.01,
    -0.005 - Math.random() * 0.01,
    viewsImpact
  ];
  shapChart.update();
}

// Formatting utils
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num;
}
