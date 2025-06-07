
import type { AssessFraudRiskOutput } from '@/ai/flows/fraud-assessment';

export type ClaimStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Information Requested';

export interface BoundingBox {
  x: number; // Top-left x, normalized (0-1)
  y: number; // Top-left y, normalized (0-1)
  width: number; // Width, normalized (0-1)
  height: number; // Height, normalized (0-1)
  page: number; // Page number, 1-indexed
}

export interface ExtractedFieldWithOptionalBox {
  value: string | Record<string, any>; // Value can be string or nested object
  boundingBox?: BoundingBox | null;
}

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
  extractedInfo?: Record<string, ExtractedFieldWithOptionalBox>; 
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
