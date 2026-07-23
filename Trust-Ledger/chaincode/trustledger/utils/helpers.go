package utils

import (
	"time"
)

// GetCurrentTimestamp returns the current timestamp in RFC3339 format.
func GetCurrentTimestamp() string {
	return time.Now().UTC().Format(time.RFC3339)
}