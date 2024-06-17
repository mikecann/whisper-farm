FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS whisper

# Install necessary packages and clean up to reduce size
RUN apt-get update && apt-get install -y \
    wget \
    p7zip-full \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Download and extract whisper
RUN wget -O Faster-Whisper-XXL_r192.3.1_linux.7z https://github.com/Purfview/whisper-standalone-win/releases/download/Faster-Whisper-XXL/Faster-Whisper-XXL_r192.3.1_linux.7z \
    && 7z x Faster-Whisper-XXL_r192.3.1_linux.7z -o/usr/src/app/whisper \
    && rm Faster-Whisper-XXL_r192.3.1_linux.7z \
    && chmod -R 755 /usr/src/app/whisper \
    && chmod -R a+w /usr/src/app/whisper

# Download the model by running it on an example
COPY example/sn0976-clip-mini.mp3 /usr/src/app/whisper/example.mp3
RUN /usr/src/app/whisper/Whisper-Faster-XXL/whisper-faster-xxl example.mp3

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies)
RUN cd /temp/dev && bun install --frozen-lockfile --production

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY convex ./convex
COPY shared ./shared
COPY worker ./worker
COPY package.json .
COPY tsconfig.json .

# Copy production dependencies and source code into final image
FROM base AS release

ARG WORKER_API_KEY
ENV WORKER_API_KEY=$WORKER_API_KEY
ARG VITE_CONVEX_URL
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL

COPY --from=whisper /usr/src/app/whisper/Whisper-Faster-XXL /usr/src/app/whisper
COPY example/sn0976-clip-mini.mp3 /usr/src/app/whisper/example.mp3

COPY --from=install /temp/dev/node_modules node_modules
COPY --from=prerelease /usr/src/app/convex convex
COPY --from=prerelease /usr/src/app/shared shared
COPY --from=prerelease /usr/src/app/worker worker
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/tsconfig.json .
COPY docker_entry.sh .

# Add whisper directory to PATH
ENV PATH="/usr/src/app/whisper:$PATH"

# Run the app
EXPOSE 3000
ENTRYPOINT [ "/usr/src/app/docker_entry.sh" ]
