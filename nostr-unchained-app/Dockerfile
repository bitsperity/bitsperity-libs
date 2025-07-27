# Single stage for development
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy nostr-unchained library first
COPY ../nostr-unchained/ ./nostr-unchained/
WORKDIR /app/nostr-unchained

# Install and build nostr-unchained
RUN npm ci
RUN npm run build

# Copy app
WORKDIR /app/nostr-unchained-app
COPY ./nostr-unchained-app/ .

# Install dependencies and link local nostr-unchained
RUN npm install
RUN npm install ../nostr-unchained

EXPOSE 3000

# Start the dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]