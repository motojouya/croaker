FROM node:22.2.0-bookworm-slim
# FROM node:22.2.0-bookworm
ARG UID
ARG GID
ARG USERNAME
ARG GROUPNAME
run apt update -y && apt upgrade -y
RUN apt install -y sqlite3
RUN groupadd -g ${GID} ${GROUPNAME} -f && \
    useradd -m -s /bin/bash -u ${UID} -g ${GID} ${USERNAME}
USER ${USERNAME}
WORKDIR /srv
