# React build
FROM node:20.10-alpine as react-build
COPY html/ /usr/src/app
WORKDIR /usr/src/app
RUN npm install
RUN npm run build

# Golang build
FROM golang:1.21.0 AS server
ARG TARGETARCH
ARG TARGETOS

WORKDIR /app

COPY ./gremlin-go ./gremlin-go
COPY ./cmd ./cmd
COPY ./lib ./lib
COPY go.mod go.sum makefile ./

RUN <<EOF
CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} make -B build/server
EOF

FROM ubuntu:22.04

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive \
    apt-get install -y \
      patch \
      curl \
      vim \
      make \
      wget \
      rsync \
      dos2unix \
      file \
      krb5-user

RUN mkdir -p /opt/puppygraph/bin
RUN mkdir -p /opt/puppygraph/html/build
COPY --from=server /app/build/server /opt/puppygraph/bin/server
COPY --from=react-build /usr/src/app/build /opt/puppygraph/html/build
COPY ./docker/entrypoint.sh /opt/puppygraph/entrypoint.sh
COPY ./tool /opt/puppygraph/tool

ENTRYPOINT ["bash", "/opt/puppygraph/entrypoint.sh"]
