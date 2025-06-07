"use client";

import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Claim, AppNotification, ClaimStatus } from '@/lib/types';
import { assessFraudRisk } from '@/ai/flows/fraud-assessment';
import { extractDocumentInformation } from '@/ai/flows/document-processing';

interface AppContextType {
  claims: Claim[];
  notifications: AppNotification[];
  addClaim: (newClaimData: Omit<Claim, 'id' | 'status' | 'submissionDate' | 'lastUpdatedDate' | 'fraudAssessment' | 'extractedInfo'>) => Promise<Claim | null>;
  updateClaimStatus: (claimId: string, status: ClaimStatus, notes?: string) => void;
  getClaimById: (claimId: string) => Claim | undefined;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Sample initial data (can be empty for a real app)
const initialClaims: Claim[] = [
  {
    id: 'clm_001',
    claimantName: 'Alice Wonderland',
    policyNumber: 'POL-12345',
    incidentDate: '2023-10-15',
    incidentDescription: 'Minor fender bender in parking lot. Scratches on rear bumper.',
    documentName: 'accident_photos.zip',
    status: 'Approved',
    submissionDate: new Date('2023-10-16T10:00:00Z').toISOString(),
    lastUpdatedDate: new Date('2023-10-18T14:30:00Z').toISOString(),
    extractedInfo: { "Vehicle Model": "Toyota Camry", "Damage Area": "Rear Bumper" },
    fraudAssessment: { riskScore: 0.1, fraudIndicators: ["Low impact collision"], summary: "Low fraud risk." },
    notes: "Standard procedure, photos clear."
  },
  {
    id: 'clm_002',
    claimantName: 'Bob The Builder',
    policyNumber: 'POL-67890',
    incidentDate: '2023-11-01',
    incidentDescription: 'Water damage due to burst pipe in kitchen. Affects flooring and cabinets.',
    documentName: 'plumber_report.pdf',
    status: 'Pending',
    submissionDate: new Date('2023-11-02T09:15:00Z').toISOString(),
    lastUpdatedDate: new Date('2023-11-02T09:15:00Z').toISOString(),
  },
  {
    id: 'clm_003',
    claimantName: 'Charlie Brown',
    policyNumber: 'POL-24680',
    incidentDate: '2023-11-05',
    incidentDescription: 'Stolen laptop from car. Police report filed.',
    documentName: 'police_report_CHB110523.pdf',
    status: 'Under Review',
    submissionDate: new Date('2023-11-06T11:00:00Z').toISOString(),
    lastUpdatedDate: new Date('2023-11-07T16:00:00Z').toISOString(),
    extractedInfo: { "Item Stolen": "Laptop", "Police Report Number": "CHB110523" },
    fraudAssessment: { riskScore: 0.6, fraudIndicators: ["High value item", "Frequent claims area"], summary: "Moderate fraud risk, requires further checks." },
  },
];


export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [claims, setClaims] = useState<Claim[]>(initialClaims);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addClaim = useCallback(async (newClaimData: Omit<Claim, 'id' | 'status' | 'submissionDate' | 'lastUpdatedDate' | 'fraudAssessment' | 'extractedInfo'>): Promise<Claim | null> => {
    setIsLoading(true);
    try {
      const id = `clm_${Date.now().toString()}`;
      const submissionDate = new Date().toISOString();
      
      let extractedInfo: Record<string, string> | undefined;
      if (newClaimData.documentUri && newClaimData.documentName) {
        // Simple document type inference from name for demo
        const docType = newClaimData.documentName.endsWith('.pdf') ? 'PDF Document' : 
                        newClaimData.documentName.match(/\.(jpeg|jpg|png|gif)$/i) ? 'Image' : 'General Document';
        try {
          const extractionResult = await extractDocumentInformation({
            documentDataUri: newClaimData.documentUri,
            documentType: docType,
          });
          extractedInfo = extractionResult.extractedInformation;
          addNotification({ title: 'Document Processed', message: `Successfully extracted info from ${newClaimData.documentName}.`, type: 'success', claimId: id });
        } catch (error) {
          console.error("Error processing document:", error);
          addNotification({ title: 'Document Processing Failed', message: `Could not extract info from ${newClaimData.documentName}.`, type: 'error', claimId: id });
        }
      }

      let fraudAssessmentResult;
      try {
        const assessmentInput = {
          claimDetails: `${newClaimData.claimantName} - ${newClaimData.incidentDescription}. Policy: ${newClaimData.policyNumber}. Incident Date: ${newClaimData.incidentDate}. Extracted Info: ${JSON.stringify(extractedInfo || {})}`,
          supportingDocuments: newClaimData.documentUri,
          // claimHistory: "Previous claim for minor accident in 2022, paid out." // Example, would come from DB
        };
        fraudAssessmentResult = await assessFraudRisk(assessmentInput);
        addNotification({ title: 'Fraud Assessment Complete', message: `Risk score: ${fraudAssessmentResult.riskScore.toFixed(2)} for claim by ${newClaimData.claimantName}.`, type: 'info', claimId: id });
      } catch (error) {
        console.error("Error assessing fraud risk:", error);
        addNotification({ title: 'Fraud Assessment Failed', message: `Could not assess fraud risk for ${newClaimData.claimantName}.`, type: 'error', claimId: id });
      }

      const fullClaim: Claim = {
        ...newClaimData,
        id,
        status: 'Pending',
        submissionDate,
        lastUpdatedDate: submissionDate,
        extractedInfo,
        fraudAssessment: fraudAssessmentResult,
      };

      setClaims(prevClaims => [fullClaim, ...prevClaims]);
      addNotification({ title: 'Claim Submitted', message: `New claim #${id} by ${fullClaim.claimantName} received.`, type: 'success', claimId: id });
      setIsLoading(false);
      return fullClaim;
    } catch (error) {
      console.error("Error adding claim:", error);
      addNotification({ title: 'Claim Submission Failed', message: 'There was an error submitting the claim.', type: 'error' });
      setIsLoading(false);
      return null;
    }
  }, []);

  const updateClaimStatus = useCallback((claimId: string, status: ClaimStatus, notes?: string) => {
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        claim.id === claimId ? { ...claim, status, notes: notes || claim.notes, lastUpdatedDate: new Date().toISOString() } : claim
      )
    );
    addNotification({ title: 'Claim Updated', message: `Claim #${claimId} status changed to ${status}.`, type: 'info', claimId });
  }, []);

  const getClaimById = useCallback((claimId: string) => {
    return claims.find(claim => claim.id === claimId);
  }, [claims]);

  const addNotification = useCallback((notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notificationData,
      id: `notif_${Date.now().toString()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Keep last 20 notifications
  }, []);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);


  return (
    <AppContext.Provider
      value={{
        claims,
        notifications,
        addClaim,
        updateClaimStatus,
        getClaimById,
        addNotification,
        markNotificationAsRead,
        clearNotifications,
        isLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
