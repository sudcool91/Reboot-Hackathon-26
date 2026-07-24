package contract

import (
	"fmt"

	"trustledger/model"
	"trustledger/utils"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// IssueKYC marks a customer's KYC as VERIFIED.
func (s *SmartContract) IssueKYC(
	ctx contractapi.TransactionContextInterface,
	customerID string,
) error {

	customer, err := s.ReadCustomer(ctx, customerID)
	if err != nil {
		return err
	}

	if customer.KYCStatus == model.KYCStatusVerified {
		return fmt.Errorf("customer %s is already KYC verified", customerID)
	}

	customer.KYCStatus = model.KYCStatusVerified
	customer.UpdatedAt = utils.GetCurrentTimestamp()

	return s.saveCustomer(ctx, customer)
}

// VerifyKYC allows another bank to verify an existing KYC.
func (s *SmartContract) VerifyKYC(
	ctx contractapi.TransactionContextInterface,
	customerID string,
	requestingBank string,
) error {

	customer, err := s.ReadCustomer(ctx, customerID)
	if err != nil {
		return err
	}

	if customer.KYCStatus != model.KYCStatusVerified {
		return fmt.Errorf("customer KYC has not been issued yet")
	}

	if !customer.ConsentGranted {
		return fmt.Errorf("customer consent has not been granted")
	}

	if customer.IssuingBank == requestingBank {
		return fmt.Errorf("issuing bank cannot verify its own KYC")
	}

	customer.UpdatedAt = utils.GetCurrentTimestamp()

	return s.saveCustomer(ctx, customer)
}

// GrantConsent allows the customer to share KYC with another bank.
func (s *SmartContract) GrantConsent(
	ctx contractapi.TransactionContextInterface,
	customerID string,
) error {

	customer, err := s.ReadCustomer(ctx, customerID)
	if err != nil {
		return err
	}

	if customer.ConsentGranted {
		return fmt.Errorf("consent already granted")
	}

	customer.ConsentGranted = true
	customer.UpdatedAt = utils.GetCurrentTimestamp()

	return s.saveCustomer(ctx, customer)
}

// RevokeConsent revokes customer's consent.
func (s *SmartContract) RevokeConsent(
	ctx contractapi.TransactionContextInterface,
	customerID string,
) error {

	customer, err := s.ReadCustomer(ctx, customerID)
	if err != nil {
		return err
	}

	if !customer.ConsentGranted {
		return fmt.Errorf("consent is already revoked")
	}

	customer.ConsentGranted = false
	customer.UpdatedAt = utils.GetCurrentTimestamp()

	return s.saveCustomer(ctx, customer)
}