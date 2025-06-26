FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Create package.json with all required dependencies
RUN echo '{\
  "name": "terraform-dashboard",\
  "version": "1.0.0",\
  "private": true,\
  "scripts": {\
    "dev": "next dev",\
    "build": "next build",\
    "start": "next start"\
  },\
  "dependencies": {\
    "next": "15.2.4",\
    "react": "^19",\
    "react-dom": "^19",\
    "d3": "^7.8.5",\
    "tailwindcss": "^3.4.17",\
    "postcss": "^8",\
    "autoprefixer": "^10.4.20",\
    "next-themes": "^0.2.1",\
    "lucide-react": "^0.454.0",\
    "@google-cloud/storage": "^7.7.0",\
    "clsx": "^2.1.1",\
    "tailwind-merge": "^2.5.5",\
    "class-variance-authority": "^0.7.1",\
    "tailwindcss-animate": "^1.0.7",\
    "@radix-ui/react-tabs": "^1.1.2",\
    "@radix-ui/react-dropdown-menu": "^2.1.4",\
    "@radix-ui/react-scroll-area": "^1.2.2",\
    "@radix-ui/react-slider": "^1.2.2",\
    "@radix-ui/react-slot": "^1.1.1",\
    "@radix-ui/react-progress": "^1.0.3"\
  },\
  "devDependencies": {\
    "@types/node": "^22",\
    "@types/react": "^19",\
    "@types/react-dom": "^19",\
    "typescript": "^5"\
  }\
}' > package.json

# Install dependencies
RUN npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set the correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000

# Start the server
CMD ["npm", "start"]
