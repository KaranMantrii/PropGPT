# ============================================================
# PropGPT R Plumber Backend Dockerfile
# Optimized for Render, Railway, Fly.io, and Docker Hub
# ============================================================

FROM rstudio/plumber:latest

# Install Linux system dependencies for building R packages
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install statistical & ML libraries
RUN R -e "install.packages(c('dplyr', 'stringr', 'xgboost', 'ranger', 'jsonlite'), repos='https://cloud.r-project.org/')"

# Set working directory
WORKDIR /app

# Copy all backend code, models, and datasets
COPY . /app

# Expose default port (Render & Railway inject $PORT at runtime)
ENV PORT=8000
EXPOSE 8000

# Run Plumber API
CMD ["Rscript", "API.R"]
