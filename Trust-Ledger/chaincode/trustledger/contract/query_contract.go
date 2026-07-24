package contract

import (
	"encoding/json"
	"fmt"

	"trustledger/model"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)


// GetAllCustomers returns every customer stored on the ledger.
func (s *SmartContract) GetAllCustomers(
	ctx contractapi.TransactionContextInterface,
) ([]*model.Customer, error) {

	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var customers []*model.Customer

	for resultsIterator.HasNext() {

		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var customer model.Customer

		err = json.Unmarshal(queryResult.Value, &customer)
		if err != nil {
			return nil, err
		}

		customers = append(customers, &customer)
	}

	return customers, nil
}


// GetCustomerHistory returns every modification made to a customer.
func (s *SmartContract) GetCustomerHistory(
	ctx contractapi.TransactionContextInterface,
	customerID string,
) ([]map[string]interface{}, error) {

	historyIterator, err := ctx.GetStub().GetHistoryForKey(customerID)
	if err != nil {
		return nil, err
	}
	defer historyIterator.Close()

	var history []map[string]interface{}

	for historyIterator.HasNext() {

		record, err := historyIterator.Next()
		if err != nil {
			return nil, err
		}

		var customer model.Customer

		if len(record.Value) > 0 {
			_ = json.Unmarshal(record.Value, &customer)
		}

		history = append(history, map[string]interface{}{
			"txId":      record.TxId,
			"timestamp": record.Timestamp.String(),
			"isDelete":  record.IsDelete,
			"customer":  customer,
		})
	}

	if len(history) == 0 {
		return nil, fmt.Errorf("no history found for customer %s", customerID)
	}

	return history, nil
}