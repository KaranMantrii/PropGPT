# ============================================================
# PropGPT R Plumber Backend Dockerfile
# Optimized with precompiled Linux binaries (No C++ compilation OOM)
# Compatible with Render (Free 512MB RAM), Hugging Face Spaces (16GB RAM), and Fly.io
# ============================================================

FROM rstudio/plumber:latest

# Install minimal system runtime dependencies
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

# Install precompiled Linux binaries via Posit Package Manager (P3M)
# Avoids GCC C++ compilation overhead and eliminates OOM during Docker build
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); install.packages(c('dplyr', 'stringr', 'xgboost', 'ranger', 'jsonlite'))"

# Set working directory
WORKDIR /app

# Copy all backend code, models, and datasets
COPY . /app

# Default port (Render, Hugging Face, and Cloud Run inject $PORT)
ENV PORT=8000
EXPOSE 8000

# Run Plumber API
CMD ["Rscript", "API.R"]
