package contract

import (
	"encoding/json"
	"fmt"

	"trustledger/model"
	"trustledger/utils"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// SmartContract provides functions for managing customers.
type SmartContract struct {
	contractapi.Contract
}

// InitLedger initializes the ledger with sample customers.
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {

	customers := []model.Customer{
		{
			CustomerID:     "CUST001",
			FullName:       "John Doe",
			DateOfBirth:    "1995-01-15",
			Email:          "john.doe@email.com",
			Phone:          "9876543210",
			Address:        "London, UK",
			NationalID:     "AA123456",
			IssuingBank:    model.BankLloyds,
			KYCStatus:      model.KYCStatusVerified,
			ConsentGranted: true,
			DocumentHash:   "HASH123456",
			CreatedAt:      utils.GetCurrentTimestamp(),
			UpdatedAt:      utils.GetCurrentTimestamp(),
		},
	}

	for _, customer := range customers {

		customerJSON, err := json.Marshal(customer)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(customer.CustomerID, customerJSON)
		if err != nil {
			return fmt.Errorf("failed to initialize ledger: %v", err)
		}
	}

	return nil
}