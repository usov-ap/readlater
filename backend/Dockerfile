# Stage 1: Build the Go binary
FROM golang:1.22-alpine3.19 AS builder

WORKDIR /build

# Pre-fetch dependencies
COPY go.mod go.sum* ./
RUN go mod download || true

# Copy source code and build statically linked binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o readlater-api .

# Stage 2: Minimal non-root runtime image
FROM alpine:3.19

# Install ca-certificates and tzdata
RUN apk --no-cache add ca-certificates tzdata \
    && addgroup -g 10001 -S appgroup \
    && adduser -u 10001 -S appuser -G appgroup

WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /build/readlater-api /app/readlater-api

USER appuser

EXPOSE 8080

ENTRYPOINT ["/app/readlater-api"]
