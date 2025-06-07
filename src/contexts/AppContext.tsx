
"use client";

import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Claim, AppNotification, ClaimStatus } from '@/lib/types';
import { assessFraudRisk } from '@/ai/flows/fraud-assessment';
import { extractDocumentInformation } from '@/ai/flows/document-processing';

// Define the structure of data coming from ClaimForm
interface NewClaimFormData {
  claimantName: string;
  policyNumber: string;
  incidentDate: string;
  incidentDescription: string;
  documentUri?: string;
  documentName?: string;
  imageUris?: string[];
  imageNames?: string[];
  videoUri?: string;
  videoName?: string;
}

interface AppContextType {
  claims: Claim[];
  notifications: AppNotification[];
  addClaim: (newClaimData: NewClaimFormData) => Promise<Claim | null>;
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
    documentName: 'accident_report.pdf',
    imageNames: ['bumper_scratch.jpg', 'overall_damage.jpg'],
    imageUris: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
    videoName: 'dashcam_clip.mp4',
    videoUri: 'https://placehold.co/600x400.png', // Placeholder, real would be video data URI
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
];

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [claims, setClaims] = useState<Claim[]>(initialClaims);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const notificationIdCounter = useRef(0);
  const claimIdCounter = useRef(initialClaims.length + 100);


  const addNotification = useCallback((notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    notificationIdCounter.current += 1;
    const newNotification: AppNotification = {
      ...notificationData,
      id: `notif_${Date.now().toString()}_${notificationIdCounter.current}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
  }, []);

  const addClaim = useCallback(async (newClaimData: NewClaimFormData): Promise<Claim | null> => {
    setIsLoading(true);
    try {
      claimIdCounter.current += 1;
      const id = `clm_${Date.now().toString()}_${claimIdCounter.current}_${Math.random().toString(36).substring(2, 7)}`;
      const submissionDate = new Date().toISOString();
      
      let extractedInfo: Record<string, any> | undefined;
      if (newClaimData.documentUri && newClaimData.documentName) {
        const docType = newClaimData.documentName.endsWith('.pdf') ? 'PDF Document' : 
                        newClaimData.documentName.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? 'Image' : 
                        newClaimData.documentName.endsWith('.zip') ? 'ZIP Archive' : 'General Document';
        try {
          const extractionResult = await extractDocumentInformation({
            documentDataUri: newClaimData.documentUri,
            documentType: docType,
          });
          if (extractionResult.extractedInformation) {
            try {
              extractedInfo = JSON.parse(extractionResult.extractedInformation);
            } catch (e) {
              console.error("Failed to parse extractedInformation JSON string:", e);
              addNotification({ title: 'Document Parsing Error', message: `Could not parse extracted info for ${newClaimData.documentName}. Invalid JSON.`, type: 'error', claimId: id });
              extractedInfo = { parsingError: "Failed to parse AI response for extracted information." };
            }
          }
          if (extractedInfo && !extractedInfo.parsingError) {
            addNotification({ title: 'Document Processed', message: `Info extracted from ${newClaimData.documentName}.`, type: 'success', claimId: id });
          }
        } catch (error) {
          console.error("Error processing document with AI:", error);
          addNotification({ title: 'Document Processing Failed', message: `AI could not extract info from ${newClaimData.documentName}.`, type: 'error', claimId: id });
        }
      }

      let fraudAssessmentResult;
      try {
        const assessmentInput = {
          claimDetails: `${newClaimData.claimantName} - ${newClaimData.incidentDescription}. Policy: ${newClaimData.policyNumber}. Incident Date: ${newClaimData.incidentDate}. Extracted Info: ${JSON.stringify(extractedInfo || {})}`,
          supportingDocumentUri: newClaimData.documentUri,
          imageEvidenceUris: newClaimData.imageUris,
          videoEvidenceUri: newClaimData.videoUri, // Pass video URI
        };
        fraudAssessmentResult = await assessFraudRisk(assessmentInput);
        addNotification({ title: 'Fraud Assessment Complete', message: `Risk score: ${fraudAssessmentResult.riskScore.toFixed(2)} for claim by ${newClaimData.claimantName}.`, type: 'info', claimId: id });
      } catch (error) {
        console.error("Error assessing fraud risk:", error);
        addNotification({ title: 'Fraud Assessment Failed', message: `Could not assess fraud risk for ${newClaimData.claimantName}.`, type: 'error', claimId: id });
      }

      const fullClaim: Claim = {
        id,
        claimantName: newClaimData.claimantName,
        policyNumber: newClaimData.policyNumber,
        incidentDate: newClaimData.incidentDate,
        incidentDescription: newClaimData.incidentDescription,
        documentName: newClaimData.documentName,
        documentUri: newClaimData.documentUri,
        imageNames: newClaimData.imageNames,
        imageUris: newClaimData.imageUris,
        videoName: newClaimData.videoName,
        videoUri: newClaimData.videoUri,
        status: 'Pending',
        submissionDate,
        lastUpdatedDate: submissionDate,
        extractedInfo,
        fraudAssessment: fraudAssessmentResult,
      };

      setClaims(prevClaims => [fullClaim, ...prevClaims]);
      addNotification({ title: 'Claim Submitted', message: `New claim #${id.substring(0,12)}... by ${fullClaim.claimantName} received.`, type: 'success', claimId: id });
      setIsLoading(false);
      return fullClaim;
    } catch (error) {
      console.error("Error adding claim:", error);
      addNotification({ title: 'Claim Submission Failed', message: 'There was an error submitting the claim.', type: 'error' });
      setIsLoading(false);
      return null;
    }
  }, [addNotification]); 

  const updateClaimStatus = useCallback((claimId: string, status: ClaimStatus, notes?: string) => {
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        claim.id === claimId ? { ...claim, status, notes: notes || claim.notes, lastUpdatedDate: new Date().toISOString() } : claim
      )
    );
    addNotification({ title: 'Claim Updated', message: `Claim #${claimId.substring(0,12)}... status changed to ${status}.`, type: 'info', claimId });
  }, [addNotification]); 

  const getClaimById = useCallback((claimId: string) => {
    return claims.find(claim => claim.id === claimId);
  }, [claims]);


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


  useEffect(() => {
    // Could be used for initial data loading from a backend in a real app
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
