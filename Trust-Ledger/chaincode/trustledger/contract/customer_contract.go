package contract

import (
	"encoding/json"
	"fmt"

	"trustledger/model"
	"trustledger/utils"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)


// CustomerExists checks whether a customer exists on the ledger.
func (s *SmartContract) CustomerExists(
	ctx contractapi.TransactionContextInterface,
	customerID string,
) (bool, error) {

	customerJSON, err := ctx.GetStub().GetState(customerID)
	if err != nil {
		return false, fmt.Errorf("failed to read customer: %v", err)
	}

	return customerJSON != nil, nil
}


// CreateCustomer adds a new customer to the blockchain.
func (s *SmartContract) CreateCustomer(
	ctx contractapi.TransactionContextInterface,
	customerID string,
	fullName string,
	dateOfBirth string,
	email string,
	phone string,
	address string,
	nationalID string,
	issuingBank string,
	documentHash string,
) error {

	exists, err := s.CustomerExists(ctx, customerID)
	if err != nil {
		return err
	}

	if exists {
		return fmt.Errorf("customer %s already exists", customerID)
	}

	customer := model.Customer{
		CustomerID:      customerID,
		FullName:        fullName,
		DateOfBirth:     dateOfBirth,
		Email:           email,
		Phone:           phone,
		Address:         address,
		NationalID:      nationalID,
		IssuingBank:     issuingBank,
		KYCStatus:       model.KYCStatusPending,
		ConsentGranted:  false,
		DocumentHash:    documentHash,
		CreatedAt:       utils.GetCurrentTimestamp(),
		UpdatedAt:       utils.GetCurrentTimestamp(),
	}

	if err := utils.ValidateCustomer(customer); err != nil {
		return err
	}

	customerJSON, err := json.Marshal(customer)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(customerID, customerJSON)
}


// ReadCustomer returns a customer from the ledger.
func (s *SmartContract) ReadCustomer(
	ctx contractapi.TransactionContextInterface,
	customerID string,
) (*model.Customer, error) {

	customerJSON, err := ctx.GetStub().GetState(customerID)
	if err != nil {
		return nil, fmt.Errorf("failed to read customer: %v", err)
	}

	if customerJSON == nil {
		return nil, fmt.Errorf("customer %s does not exist", customerID)
	}

	var customer model.Customer

	err = json.Unmarshal(customerJSON, &customer)
	if err != nil {
		return nil, err
	}

	return &customer, nil
}


// UpdateCustomer updates customer details.
func (s *SmartContract) UpdateCustomer(
	ctx contractapi.TransactionContextInterface,
	customerID string,
	fullName string,
	email string,
	phone string,
	address string,
) error {

	customer, err := s.ReadCustomer(ctx, customerID)
	if err != nil {
		return err
	}

	customer.FullName = fullName
	customer.Email = email
	customer.Phone = phone
	customer.Address = address
	customer.UpdatedAt = utils.GetCurrentTimestamp()

	if err := utils.ValidateCustomer(*customer); err != nil {
		return err
	}

	customerJSON, err := json.Marshal(customer)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(customerID, customerJSON)
}


// DeleteCustomer removes a customer from the ledger.
func (s *SmartContract) DeleteCustomer(
	ctx contractapi.TransactionContextInterface,
	customerID string,
) error {

	exists, err := s.CustomerExists(ctx, customerID)
	if err != nil {
		return err
	}

	if !exists {
		return fmt.Errorf("customer %s does not exist", customerID)
	}

	return ctx.GetStub().DelState(customerID)
}
func (s *SmartContract) saveCustomer(
	ctx contractapi.TransactionContextInterface,
	customer *model.Customer,
) error {

	customerJSON, err := json.Marshal(customer)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(customer.CustomerID, customerJSON)
}