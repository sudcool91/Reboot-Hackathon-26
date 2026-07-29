/**
 * Data Transfer Objects for Fabric SDK
 * 
 * Type-safe interfaces matching the chaincode model
 */

export enum KYCStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum BankType {
  LLOYDS = 'LLOYDS',
  HALIFAX = 'HALIFAX',
}

export interface CustomerDTO {
  customerID: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  nationalID: string;
  issuingBank: string;
  kycStatus: KYCStatus;
  consentGranted: boolean;
  documentHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDTO {
  customerID: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  nationalID: string;
  issuingBank: string;
  documentHash: string;
}

export interface UpdateCustomerDTO {
  customerID: string;
  fullName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  documentHash?: string;
}

export interface CustomerHistoryDTO {
  txId: string;
  timestamp: string;
  isDelete: boolean;
  customer: CustomerDTO;
}

export interface KYCVerificationDTO {
  customerID: string;
  requestingBank: string;
}

export interface ConsentDTO {
  customerID: string;
}

export interface QueryResultDTO<T> {
  success: boolean;
  data?: T;
  error?: string;
  txId?: string;
}

export interface TransactionResultDTO {
  success: boolean;
  txId: string;
  message: string;
  data?: any;
}
