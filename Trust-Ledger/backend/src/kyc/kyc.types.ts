export const KYC_OPERATION_TO_FUNCTION = Symbol('KYC_OPERATION_TO_FUNCTION');

export interface KycOperationToFunction {
  issue: string;
  verify: string;
  getCredential: string;
  revoke: string;
  getHistory: string;
}
