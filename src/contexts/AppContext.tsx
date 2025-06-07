
"use client";

import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Claim, AppNotification, ClaimStatus, ConsistencyReport } from '@/lib/types';
import { assessFraudRisk } from '@/ai/flows/fraud-assessment';
import { extractDocumentInformation } from '@/ai/flows/document-processing';

// Initial Data (can be expanded or fetched from an API later)
const initialClaims: Claim[] = [
  {
    id: 'clm_1749303123456_abc',
    claimantName: 'Alice Wonderland',
    policyNumber: 'POL-001',
    incidentDate: '2024-07-15',
    incidentDescription: 'Minor fender bender in parking lot. Scratches on rear bumper.',
    documentName: 'AccidentReport.pdf',
    documentUri: 'https://placehold.co/200x300.png?text=Doc1',
    imageNames: ['damage_front.jpg', 'damage_side.jpg'],
    imageUris: ['https://placehold.co/150x100.png?text=Img1.1', 'https://placehold.co/150x100.png?text=Img1.2'],
    videoName: 'dashcam_footage.mp4',
    videoUri: 'https://placehold.co/160x90.png?text=Vid1',
    status: 'Pending',
    submissionDate: '2024-07-20T10:00:00Z',
    lastUpdatedDate: '2024-07-20T10:00:00Z',
    extractedInfo: { fromDoc: "some info", policyHolder: "Alice", incidentLocation: "Mall Parking Lot" },
    fraudAssessment: { riskScore: 0.1, fraudIndicators: ["Low impact collision"], summary: "Low risk, standard claim." },
    consistencyReport: {
      status: 'Consistent',
      summary: 'Key details (Claimant Name, Incident Date) appear consistent between AccidentReport.pdf and Police Report (on file).',
      details: [
        { documentA: 'AccidentReport.pdf', documentB: 'Police Report (on file)', field: 'Claimant Name', valueA: 'Alice Wonderland', valueB: 'Alice Wonderland', finding: 'Match' },
        { documentA: 'AccidentReport.pdf', documentB: 'Police Report (on file)', field: 'Incident Date', valueA: '2024-07-15', valueB: '2024-07-15', finding: 'Match'},
      ]
    },
    notes: 'Awaiting adjuster review.',
  },
  {
    id: 'clm_1749303123789_def',
    claimantName: 'Bob The Builder',
    policyNumber: 'POL-002',
    incidentDate: '2024-07-18',
    incidentDescription: 'Water damage from burst pipe in kitchen.',
    documentName: 'PlumberInvoice.pdf',
    documentUri: 'https://placehold.co/200x300.png?text=Doc2',
    status: 'Approved',
    submissionDate: '2024-07-21T14:30:00Z',
    lastUpdatedDate: '2024-07-22T09:15:00Z',
    extractedInfo: { invoiceTotal: "$500", serviceDate: "2024-07-19", plumberName: "FixIt Plumbing" },
    fraudAssessment: { riskScore: 0.05, fraudIndicators: [], summary: "Straightforward water damage claim. Approved." },
    consistencyReport: {
      status: 'Inconsistent',
      summary: 'Discrepancy noted in "Service Date" between PlumberInvoice.pdf and Homeowner Statement (on file). Further review suggested for date alignment.',
      details: [
        { documentA: 'PlumberInvoice.pdf', documentB: 'Homeowner Statement (on file)', field: 'Service Date', valueA: '2024-07-19', valueB: '2024-07-18', finding: 'Mismatch' },
        { documentA: 'PlumberInvoice.pdf', documentB: 'Homeowner Statement (on file)', field: 'Reported Damage', valueA: 'Burst pipe', valueB: 'Water leak', finding: 'Not Compared' }
      ]
    },
    notes: 'Payment processed.',
  },
];


const initialNotifications: AppNotification[] = [
  { id: 'notif_1749303223456', title: 'Claim Submitted', message: 'Claim #clm_1749303123456... by Alice Wonderland received.', type: 'success', timestamp: '2024-07-20T10:00:00Z', read: false, claimId: 'clm_1749303123456_abc' },
  { id: 'notif_1749303223789', title: 'Claim Approved', message: 'Claim #clm_1749303123789... for Bob The Builder has been approved.', type: 'success', timestamp: '2024-07-22T09:15:00Z', read: true, claimId: 'clm_1749303123789_def' },
];


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
  updateClaimStatus: (claimId: string, status: ClaimStatus, notes?: string) => Promise<void>;
  getClaimById: (claimId: string) => Claim | undefined;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  isLoading: boolean;
  isKycVerifiedForSession: boolean;
  completeKycSession: () => void;
  resetKycSession: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [claims, setClaims] = useState<Claim[]>(initialClaims);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(false);
  const [isKycVerifiedForSession, setIsKycVerifiedForSession] = useState(false);
  const notificationIdCounter = useRef(initialNotifications.length); 

  const addNotification = useCallback((notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    notificationIdCounter.current += 1;
    const newNotification: AppNotification = {
      ...notificationData,
      id: `notif_${Date.now()}_${notificationIdCounter.current}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 20)); 
  }, []);

  const resetKycSession = useCallback(() => {
    setIsKycVerifiedForSession(false);
  }, []);

  const addClaim = useCallback(async (newClaimData: NewClaimFormData): Promise<Claim | null> => {
    setIsLoading(true);
    let newClaimId = `clm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
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
                addNotification({ title: 'Document Processed', message: `Info extracted from ${newClaimData.documentName}.`, type: 'success', claimId: newClaimId });
              } catch (e) {
                console.error("Failed to parse extractedInformation JSON string:", e);
                extractedInfo = { parsingError: "Failed to parse AI response for extracted information." };
                addNotification({ title: 'Document Parsing Error', message: `Could not parse extracted info for ${newClaimData.documentName}. Invalid JSON.`, type: 'error', claimId: newClaimId });
              }
          } else {
             addNotification({ title: 'Document Processing Skipped', message: `No information extracted from ${newClaimData.documentName}.`, type: 'info', claimId: newClaimId });
          }
        } catch (error) {
          console.error("Error processing document with AI:", error);
          addNotification({ title: 'Document Processing Failed', message: `AI could not extract info from ${newClaimData.documentName}.`, type: 'error', claimId: newClaimId });
        }
      }

      let fraudAssessmentResult;
      try {
        const assessmentInput = {
          claimDetails: `${newClaimData.claimantName} - ${newClaimData.incidentDescription}. Policy: ${newClaimData.policyNumber}. Incident Date: ${newClaimData.incidentDate}. Extracted Info: ${JSON.stringify(extractedInfo || {})}`,
          supportingDocumentUri: newClaimData.documentUri,
          imageEvidenceUris: newClaimData.imageUris,
          videoEvidenceUri: newClaimData.videoUri,
        };
        fraudAssessmentResult = await assessFraudRisk(assessmentInput);
        addNotification({ title: 'Fraud Assessment Complete', message: `Risk score: ${fraudAssessmentResult.riskScore.toFixed(2)} for claim by ${newClaimData.claimantName}.`, type: 'info', claimId: newClaimId });
      } catch (error) {
        console.error("Error assessing fraud risk:", error);
        addNotification({ title: 'Fraud Assessment Failed', message: `Could not assess fraud risk for ${newClaimData.claimantName}.`, type: 'error', claimId: newClaimId });
      }

      // Simulate Consistency Report Generation
      let consistencyReport: ConsistencyReport | undefined;
      if (newClaimData.documentUri && extractedInfo && fraudAssessmentResult) {
        const isConsistent = Math.random() > 0.4; // 60% chance of being consistent for demo
        const primaryDocName = newClaimData.documentName || "Submitted Claim Document";
        const secondaryDocTypes = ["Police Report (on file)", "Witness Statement (on file)", "Internal System Record"];
        const secondaryDocName = secondaryDocTypes[Math.floor(Math.random() * secondaryDocTypes.length)];
        const commonFields = ["Incident Date", "Claimant Name", "Policy Number", "Vehicle Make/Model"];
        const fieldForComparison = commonFields[Math.floor(Math.random() * commonFields.length)];

        if (isConsistent) {
          consistencyReport = {
            status: 'Consistent',
            summary: `Key details (e.g., Claimant Name, ${fieldForComparison}) appear consistent between ${primaryDocName} and ${secondaryDocName}.`,
            details: [
              { documentA: primaryDocName, documentB: secondaryDocName, field: fieldForComparison, valueA: String(extractedInfo?.[fieldForComparison.toLowerCase().replace(/\s/g, '')] || newClaimData[fieldForComparison.toLowerCase().replace(/\s/g, '') as keyof NewClaimFormData] || "N/A"), valueB: String(extractedInfo?.[fieldForComparison.toLowerCase().replace(/\s/g, '')] || newClaimData[fieldForComparison.toLowerCase().replace(/\s/g, '') as keyof NewClaimFormData] || "N/A"), finding: 'Match' }
            ]
          };
        } else {
          const valueA = String(extractedInfo?.[fieldForComparison.toLowerCase().replace(/\s/g, '')] || newClaimData[fieldForComparison.toLowerCase().replace(/\s/g, '') as keyof NewClaimFormData] || "Value A");
          let valueB = "Different Value B";
          if (fieldForComparison === "Incident Date") {
            valueB = new Date(Date.parse(newClaimData.incidentDate) - (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          } else if (fieldForComparison === "Claimant Name") {
            valueB = newClaimData.claimantName.split(" ")[0] + " Smith"; // Slightly different name
          }

          consistencyReport = {
            status: 'Inconsistent',
            summary: `Discrepancy noted in "${fieldForComparison}" between ${primaryDocName} and ${secondaryDocName}. Review recommended.`,
            details: [{
              documentA: primaryDocName,
              documentB: secondaryDocName,
              field: fieldForComparison,
              valueA: valueA,
              valueB: valueB,
              finding: 'Mismatch',
            }],
          };
        }
        addNotification({ title: 'Consistency Check Simulated', message: `Consistency: ${consistencyReport.status} for ${newClaimData.claimantName}'s claim.`, type: 'info', claimId: newClaimId });
      } else if (newClaimData.documentUri) {
          consistencyReport = {
              status: 'Not Run',
              summary: 'Consistency check requires full AI analysis of all related documents. Main document uploaded.',
          };
      }


      const newClaim: Claim = {
        id: newClaimId,
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
        submissionDate: new Date().toISOString(),
        lastUpdatedDate: new Date().toISOString(),
        extractedInfo: extractedInfo || {},
        fraudAssessment: fraudAssessmentResult,
        consistencyReport: consistencyReport,
        notes: '',
      };

      setClaims(prevClaims => [newClaim, ...prevClaims]);
      addNotification({ title: 'Claim Submitted', message: `New claim #${newClaim.id.substring(0,12)}... by ${newClaim.claimantName} received.`, type: 'success', claimId: newClaim.id });
      resetKycSession(); // Reset KYC after successful claim submission
      setIsLoading(false);
      return newClaim;
    } catch (error) {
      console.error("Error adding claim:", error);
      addNotification({ title: 'Claim Submission Failed', message: 'There was an error submitting the claim.', type: 'error', claimId: newClaimId });
      setIsLoading(false);
      return null;
    }
  }, [addNotification, resetKycSession]);

  const updateClaimStatus = async (claimId: string, status: ClaimStatus, notes?: string) => {
    setIsLoading(true); 
    setClaims(prevClaims =>
      prevClaims.map(claim => {
        if (claim.id === claimId) {
          const updatedClaim = {
            ...claim,
            status,
            lastUpdatedDate: new Date().toISOString(),
            notes: notes !== undefined ? notes : claim.notes,
          };
          addNotification({ title: 'Claim Updated', message: `Claim #${claimId.substring(0,12)}... status changed to ${status}.`, type: 'info', claimId });
          return updatedClaim;
        }
        return claim;
      })
    );
    setIsLoading(false);
  };

  const getClaimById = useCallback((claimId: string): Claim | undefined => {
    return claims.find(claim => claim.id === claimId);
  }, [claims]);

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };
  
  const completeKycSession = useCallback(() => {
    setIsKycVerifiedForSession(true);
  }, []);


  useEffect(() => {
    // On initial load, ensure existing claims also have some consistency report data for the demo
    const claimsWithInitialConsistency = initialClaims.map(claim => {
        if (!claim.consistencyReport) {
            const isConsistent = Math.random() > 0.3;
            const primaryDocName = claim.documentName || "Main Claim Document";
            const secondaryDocName = "Archived Policy Record";
            if (isConsistent) {
                return {
                    ...claim,
                    consistencyReport: {
                        status: 'Consistent' as const,
                        summary: `Historical data for ${claim.claimantName} appears consistent.`,
                    }
                };
            } else {
                 return {
                    ...claim,
                    consistencyReport: {
                        status: 'Inconsistent' as const,
                        summary: `Minor discrepancy found in address history for ${claim.claimantName} when compared to ${secondaryDocName}.`,
                        details: [{ documentA: primaryDocName, documentB: secondaryDocName, field: 'Address', valueA: '123 Main St', valueB: '124 Main St', finding: 'Mismatch' as const }]
                    }
                 }
            }
        }
        return claim;
    });
    setClaims(claimsWithInitialConsistency);
    setNotifications(initialNotifications);
    notificationIdCounter.current = initialNotifications.length;
    setIsKycVerifiedForSession(false); // Ensure KYC is reset on full context re-init
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
        isLoading,
        isKycVerifiedForSession,
        completeKycSession,
        resetKycSession,
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
