# Use Node.js 20 Alpine image
FROM node:20-alpine AS base

# Install dependencies for Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy root package.json
COPY package*.json ./

# Install dependencies for the monorepo
RUN npm install

# Copy everything
COPY . .

# Build the application
WORKDIR /app/acme-training-website
RUN npm install --legacy-peer-deps
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies for Prisma
RUN apk add --no-cache openssl

# Copy built application
COPY --from=base /app/acme-training-website/.next ./acme-training-website/.next
COPY --from=base /app/acme-training-website/public ./acme-training-website/public
COPY --from=base /app/acme-training-website/package*.json ./acme-training-website/
COPY --from=base /app/acme-training-website/node_modules ./acme-training-website/node_modules
COPY --from=base /app/acme-training-website/prisma ./acme-training-website/prisma

# Set working directory
WORKDIR /app/acme-training-website

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]
