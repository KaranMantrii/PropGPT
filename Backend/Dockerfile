
# ============================================================
# PropGPT R Plumber Backend
# ============================================================

FROM rstudio/plumber:latest

# System dependencies
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

# Install required R packages
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); install.packages(c('dplyr', 'stringr', 'xgboost', 'ranger', 'jsonlite', 'httr2'))"

# Backend directory
WORKDIR /app

# Copy backend files, datasets and models
COPY . /app

# Render provides PORT
ENV PORT=8000
ENV HOST=0.0.0.0

EXPOSE 8000

# Start Plumber API
CMD ["Rscript", "API.R"]
