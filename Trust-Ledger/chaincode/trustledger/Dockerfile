FROM golang:1.22-alpine AS builder

WORKDIR /go/src/trustledger

# Copy go module files first for better layer caching
COPY go.mod go.sum ./

# Copy vendor directory if it exists
COPY vendor/ vendor/

# Copy source code
COPY . .

# Build the chaincode binary using vendor
RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -o /chaincode .

# Final minimal image
FROM alpine:3.19

WORKDIR /

COPY --from=builder /chaincode /chaincode

# CCaaS default port
EXPOSE 9999

CMD ["/chaincode"]
