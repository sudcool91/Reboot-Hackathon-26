package utils

import (
	"errors"
	"strings"

	"trustledger/model"
)

// ValidateCustomer validates mandatory customer fields.
func ValidateCustomer(customer model.Customer) error {

	if strings.TrimSpace(customer.CustomerID) == "" {
		return errors.New("customer ID is required")
	}

	if strings.TrimSpace(customer.FullName) == "" {
		return errors.New("full name is required")
	}

	if strings.TrimSpace(customer.Email) == "" {
		return errors.New("email is required")
	}

	if strings.TrimSpace(customer.Phone) == "" {
		return errors.New("phone number is required")
	}

	if strings.TrimSpace(customer.NationalID) == "" {
		return errors.New("national ID is required")
	}

	if strings.TrimSpace(customer.IssuingBank) == "" {
		return errors.New("issuing bank is required")
	}

	return nil
}