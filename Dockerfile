# Base image with Ubuntu and Node.js
FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt update && \
    apt upgrade -y && \
    apt install -y curl net-tools git sudo gnupg2 build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt install -y nodejs

# Create app directory
WORKDIR /usr/bin

# Clone the GitHub project and rename it
RUN git clone https://github.com/udhaya1148/ot-shield-deployment.git && \
    mv ot-shield-deployment Chiefnet-OT-Shield

# Set working directory to the project folder
WORKDIR /usr/bin/Chiefnet-OT-Shield

# Make scripts executable
RUN chmod +x dependencies.sh && \
    ./dependencies.sh && \
    chmod +x Scripts/*.sh && \
    chmod +x start-service.sh

# Expose the app's port
EXPOSE 5050

# Run the start-service.sh script as the container's entry point
CMD ["./start-service.sh"]
