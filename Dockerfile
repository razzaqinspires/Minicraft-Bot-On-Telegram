FROM ubuntu:24.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# 1. Update and install basic system utilities and build dependencies
# We include cmake as requested, and dependencies for canvas/native modules.
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    git \
    python3 \
    make \
    g++ \
    gcc \
    cmake \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Node.js 22.x
# Using NodeSource repository for the latest version
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Verify Node version
RUN node -v && npm -v

# 3. Setup Application Directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# 4. Install Project Dependencies
# We install all dependencies (including dev) or production based on need.
# Given the heavy native deps, we ensure everything builds correctly.
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port (if needed for viewer, Heroku handles $PORT automatically)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]