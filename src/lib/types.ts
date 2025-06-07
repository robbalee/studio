import type { AssessFraudRiskOutput } from '@/ai/flows/fraud-assessment';

export type ClaimStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Information Requested';

export interface Claim {
  id: string;
  claimantName: string;
  policyNumber: string;
  incidentDate: string;
  incidentDescription: string;
  documentName?: string;
  documentUri?: string; // Store as data URI
  imageNames?: string[];
  imageUris?: string[]; // Store as data URIs for multiple images
  status: ClaimStatus;
  extractedInfo?: Record<string, string>;
  fraudAssessment?: AssessFraudRiskOutput;
  submissionDate: string; // ISO string
  lastUpdatedDate: string; // ISO string
  notes?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string; // ISO string
  read: boolean;
  claimId?: string; // Optional link to a claim
}
