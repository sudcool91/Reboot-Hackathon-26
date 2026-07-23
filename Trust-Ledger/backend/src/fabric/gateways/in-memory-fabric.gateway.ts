import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { FabricFunctionName, FabricGateway } from '../fabric.types';

type CredentialStatus = 'Active' | 'Revoked';

interface IssuePayload {
  networkIdentityId: string;
  documentHash: string;
  issuer: string;
}

interface CredentialRecord extends IssuePayload {
  credentialId: string;
  status: CredentialStatus;
}

interface CredentialHistoryEvent {
  action: 'Issued' | 'Revoked';
  timestamp: string;
}

interface CredentialRefPayload {
  credentialId: string;
}

@Injectable()
export class InMemoryFabricGateway implements FabricGateway {
  private readonly credentials = new Map<string, CredentialRecord>();
  private readonly history = new Map<string, CredentialHistoryEvent[]>();

  async submit(functionName: FabricFunctionName, payload: unknown) {
    return this.invoke(functionName, payload);
  }

  async evaluate(functionName: FabricFunctionName, payload: unknown) {
    return this.invoke(functionName, payload);
  }

  private invoke(functionName: FabricFunctionName, payload: unknown): unknown {
    switch (functionName) {
      case 'IssueKYC':
        return this.issue(payload);
      case 'VerifyKYC':
        return this.verify(payload);
      case 'GetCredential':
        return this.getCredential(payload);
      case 'RevokeKYC':
        return this.revoke(payload);
      case 'GetHistory':
        return this.getHistory(payload);
      default:
        throw new BadRequestException(
          `Unsupported fabric function: ${functionName}`,
        );
    }
  }

  private issue(payload: unknown) {
    const { networkIdentityId, documentHash, issuer } =
      this.toIssuePayload(payload);

    const existingRecord = Array.from(this.credentials.values()).find(
      (record) =>
        record.networkIdentityId === networkIdentityId &&
        record.documentHash === documentHash,
    );

    if (existingRecord) {
      throw new ConflictException(
        `Credential already exists for network identity ${networkIdentityId}`,
      );
    }

    const credentialId = `KYC-${1001 + this.credentials.size}`;
    const record: CredentialRecord = {
      credentialId,
      networkIdentityId,
      documentHash,
      issuer,
      status: 'Active',
    };

    this.credentials.set(credentialId, record);
    this.history.set(credentialId, [
      {
        action: 'Issued',
        timestamp: new Date().toISOString(),
      },
    ]);

    return {
      message: 'KYC Credential Issued',
      credentialId,
    };
  }

  private verify(payload: unknown) {
    const { credentialId } = this.toCredentialRef(payload);
    const record = this.credentials.get(credentialId);

    if (!record) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    return {
      status: record.status,
      verified: record.status === 'Active',
    };
  }

  private getCredential(payload: unknown) {
    const { credentialId } = this.toCredentialRef(payload);
    const record = this.credentials.get(credentialId);

    if (!record) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    return record;
  }

  private revoke(payload: unknown) {
    const { credentialId } = this.toCredentialRef(payload);
    const record = this.credentials.get(credentialId);

    if (!record) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    record.status = 'Revoked';

    const events = this.history.get(credentialId) ?? [];
    events.push({
      action: 'Revoked',
      timestamp: new Date().toISOString(),
    });
    this.history.set(credentialId, events);

    return {
      message: 'Credential Revoked',
    };
  }

  private getHistory(payload: unknown) {
    const { credentialId } = this.toCredentialRef(payload);
    const record = this.credentials.get(credentialId);

    if (!record) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    return this.history.get(credentialId) ?? [];
  }

  private toIssuePayload(payload: unknown): IssuePayload {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Issue payload is required');
    }

    const candidate = payload as Partial<IssuePayload>;
    if (
      !candidate.networkIdentityId ||
      !candidate.documentHash ||
      !candidate.issuer
    ) {
      throw new BadRequestException(
        'networkIdentityId, documentHash and issuer are required',
      );
    }

    return {
      networkIdentityId: candidate.networkIdentityId,
      documentHash: candidate.documentHash,
      issuer: candidate.issuer,
    };
  }

  private toCredentialRef(payload: unknown): CredentialRefPayload {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('credentialId is required');
    }

    const candidate = payload as Partial<CredentialRefPayload>;
    if (!candidate.credentialId) {
      throw new BadRequestException('credentialId is required');
    }

    return {
      credentialId: candidate.credentialId,
    };
  }
}
