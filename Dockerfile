# BASE
FROM node:22.2.0-bookworm-slim as base
RUN apt update -y && apt upgrade -y
RUN apt install -y sqlite3 imagemagick

# DEVELOP
FROM base as develop
ARG UID
ARG GID
ARG USERNAME
ARG GROUPNAME
RUN groupadd -g ${GID} ${GROUPNAME} -f && \
    useradd -m -s /bin/bash -u ${UID} -g ${GID} ${USERNAME}
USER ${USERNAME}
WORKDIR /srv

# DEPS
FROM base AS deps
# RUN apt install -y libc6-compat # --no-cache
WORKDIR /srv
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# BUILD
FROM base AS build
WORKDIR /srv
COPY --from=deps /srv/node_modules ./node_modules
COPY . .
RUN npm run build

# PRODUCTION
FROM base AS production
WORKDIR /srv

RUN apt install -y tini # --no-cache

RUN groupadd -g 1001 croaker -f
RUN useradd -m -s /bin/bash -u 1001 -g 1001 croaker

RUN mkdir .next
RUN chown croaker:croaker .next
COPY --from=build --chown=croaker:croaker /srv/.next/standalone ./
COPY --from=build --chown=croaker:croaker /srv/.next/static ./.next/static
COPY --from=build --chown=croaker:croaker /srv/public ./public

USER croaker
EXPOSE 3000

ENV NODE_ENV production
ENV PORT 3000
ENV TZ Asia/Tokyo
ENV SQLITE_FILE croaker.sqlite3
ENV STORAGE_BUCKET ""
ENV STORAGE_DIRECTORY ""
ENV NEXT_ORIGIN ""
ENV NEXTAUTH_SECRET ""
ENV NEXTAUTH_URL ""
ENV GITHUB_ID ""
ENV GITHUB_SECRET ""
ENV GOOGLE_CLIENT_ID ""
ENV GOOGLE_CLIENT_SECRET ""

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
# CMD HOSTNAME="0.0.0.0" node server.js
