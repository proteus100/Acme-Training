# Use Node.js 20 Alpine image
FROM node:20-alpine AS base

# Install dependencies for Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Accept build arguments from Railway
ARG RESEND_API_KEY
ARG NEXTAUTH_SECRET
ARG JWT_SECRET
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_APP_URL
ARG DATABASE_URL

# Set as environment variables for build (NOT NODE_ENV yet)
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV JWT_SECRET=$JWT_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV DATABASE_URL=$DATABASE_URL

# Copy everything first
COPY . .

# Build the application
WORKDIR /app/acme-training-website

# Configure npm to use legacy-peer-deps globally
RUN npm config set legacy-peer-deps true

# Install ALL dependencies (including devDependencies for TypeScript)
RUN npm install

# Clean npm cache and remove any cached Resend
RUN npm cache clean --force
RUN rm -rf node_modules/resend node_modules/@react-email/render 2>/dev/null || true

# Now set NODE_ENV for the build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true

# Generate Prisma client
RUN npx prisma generate

# Build Next.js - skip static page generation
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies for Prisma
RUN apk add --no-cache openssl

# Accept runtime environment variables
ARG DATABASE_URL
ARG NEXTAUTH_SECRET
ARG JWT_SECRET
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_APP_URL

# Set runtime environment variables
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV JWT_SECRET=$JWT_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

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
