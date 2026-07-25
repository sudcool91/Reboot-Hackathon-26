package utils

import (
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// GetCurrentTimestamp returns the transaction timestamp in RFC3339 format.
// This uses the transaction timestamp from Fabric which is deterministic across all peers.
func GetCurrentTimestamp(ctx contractapi.TransactionContextInterface) string {
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		// Fallback to current time if tx timestamp is not available
		return time.Now().UTC().Format(time.RFC3339)
	}
	return time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)).UTC().Format(time.RFC3339)
}