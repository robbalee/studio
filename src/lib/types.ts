
import type { AssessFraudRiskOutput } from '@/ai/flows/fraud-assessment';

export type ClaimStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Information Requested';

export interface ConsistencyReport {
  status: 'Not Run' | 'Consistent' | 'Inconsistent' | 'Partial';
  summary: string;
  details?: Array<{
    documentA: string; // e.g., "Claim Form"
    documentB: string; // e.g., "Police Report (on file)"
    field: string;     // e.g., "Incident Date"
    valueA: string;
    valueB: string;
    finding: 'Match' | 'Mismatch' | 'Missing in A' | 'Missing in B' | 'Not Compared';
  }>;
}

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
  videoName?: string;
  videoUri?: string; // Store as data URI for a single video
  status: ClaimStatus;
  extractedInfo?: Record<string, any>; // Value can be string or nested object
  fraudAssessment?: AssessFraudRiskOutput;
  consistencyReport?: ConsistencyReport;
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
