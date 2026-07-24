package model

// Customer represents a customer stored on the blockchain ledger.
type Customer struct {
	CustomerID      string `json:"customerId"`
	FullName        string `json:"fullName"`
	DateOfBirth     string `json:"dateOfBirth"`
	Email           string `json:"email"`
	Phone           string `json:"phone"`
	Address         string `json:"address"`
	NationalID      string `json:"nationalId"`
	IssuingBank     string `json:"issuingBank"`
	KYCStatus       string `json:"kycStatus"`
	ConsentGranted  bool   `json:"consentGranted"`
	DocumentHash    string `json:"documentHash"`
	CreatedAt       string `json:"createdAt"`
	UpdatedAt       string `json:"updatedAt"`
}