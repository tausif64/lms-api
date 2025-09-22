# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install ALL dependencies, including devDependencies for Prisma CLI
RUN npm install

# Copy the Prisma schema file
COPY prisma ./prisma/

# Generate the Prisma Client for the container's OS (Alpine Linux)
RUN npx prisma generate

# Copy the rest of the application code (including the new entrypoint.sh)
COPY . .

# Make the entrypoint script executable
# RUN chmod +x /app/entrypoint.sh

# Set the entrypoint script to be executed when the container starts
# ENTRYPOINT ["/app/entrypoint.sh"]

# Expose the port your app runs on
EXPOSE 5000

# This is the command that the entrypoint script will execute after migrations
CMD [ "npm", "start" ]