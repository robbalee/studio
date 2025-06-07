
"use client";

import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Claim, AppNotification, ClaimStatus, ConsistencyReport, ExtractedFieldWithOptionalBox } from '@/lib/types';
import { assessFraudRisk } from '@/ai/flows/fraud-assessment';
import { extractDocumentInformation } from '@/ai/flows/document-processing';
import { qaOnDocument } from '@/ai/flows/qa-on-document'; // Import the new flow

// Initial Data (can be expanded or fetched from an API later)
const initialClaims: Claim[] = [
  {
    id: 'clm_1749303123456_abc',
    claimantName: 'Alice Wonderland',
    policyNumber: 'POL-001',
    incidentDate: '2024-07-15',
    incidentDescription: 'Minor fender bender in parking lot. Scratches on rear bumper.',
    documentName: 'AccidentReport.pdf',
    documentUri: 'data:application/pdf;base64,JVBERi0xLjQKJ...', // Placeholder for actual Data URI
    imageNames: ['damage_front.jpg', 'damage_side.jpg'],
    imageUris: ['https://placehold.co/150x100.png?text=Img1.1', 'https://placehold.co/150x100.png?text=Img1.2'],
    videoName: 'dashcam_footage.mp4',
    videoUri: 'https://placehold.co/160x90.png?text=Vid1',
    status: 'Pending',
    submissionDate: '2024-07-20T10:00:00Z',
    lastUpdatedDate: '2024-07-20T10:00:00Z',
    extractedInfo: { 
      policyNumber: { value: "POL-001", boundingBox: { x: 0.1, y: 0.05, width: 0.2, height: 0.03, page: 1 } },
      claimantName: { value: "Alice Wonderland", boundingBox: { x: 0.1, y: 0.10, width: 0.3, height: 0.03, page: 1 } },
      incidentLocation: { value: "Mall Parking Lot", boundingBox: null },
      vehicleDamage: { value: "Scratches on rear bumper", boundingBox: { x: 0.1, y: 0.25, width: 0.5, height: 0.08, page: 1 } }
    },
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
    documentUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Placeholder 1x1 transparent png
    status: 'Approved',
    submissionDate: '2024-07-21T14:30:00Z',
    lastUpdatedDate: '2024-07-22T09:15:00Z',
    extractedInfo: { 
      invoiceTotal: { value: "$500", boundingBox: { x: 0.7, y: 0.8, width: 0.15, height: 0.04, page: 1 } },
      serviceDate: { value: "2024-07-19", boundingBox: { x: 0.1, y: 0.15, width: 0.2, height: 0.03, page: 1 } },
      plumberName: { value: "FixIt Plumbing", boundingBox: null }
    },
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
  askQuestionOnDocument: (documentDataUri: string, question: string, claimId?: string) => Promise<string | null>;
  qaAnswer: string | null;
  isAskingQuestion: boolean;
  clearQaAnswer: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [claims, setClaims] = useState<Claim[]>(initialClaims);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(false); // General loading for claim submission/update
  const [isKycVerifiedForSession, setIsKycVerifiedForSession] = useState(false);
  const notificationIdCounter = useRef(initialNotifications.length); 

  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);


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
    let currentExtractedInfo: Record<string, ExtractedFieldWithOptionalBox> | undefined;

    try {
      if (newClaimData.documentUri && newClaimData.documentName) {
        const docType = newClaimData.documentName.endsWith('.pdf') ? 'PDF Document' :
                        newClaimData.documentName.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? 'Image' :
                        newClaimData.documentName.endsWith('.zip') ? 'ZIP Archive' : 'General Document';

        try {
          const extractionResult = await extractDocumentInformation({
            documentDataUri: newClaimData.documentUri,
            documentType: docType,
          });

          if (extractionResult.extractedFieldsJson) {
             try {
                const parsedJson = JSON.parse(extractionResult.extractedFieldsJson);
                currentExtractedInfo = parsedJson as Record<string, ExtractedFieldWithOptionalBox>;
                addNotification({ title: 'Document Processed', message: `Info extracted from ${newClaimData.documentName}.`, type: 'success', claimId: newClaimId });
              } catch (e) {
                console.error("Failed to parse extractedFieldsJson string:", e);
                currentExtractedInfo = { parsingError: { value: "Failed to parse AI response for extracted information." } };
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
          claimDetails: `${newClaimData.claimantName} - ${newClaimData.incidentDescription}. Policy: ${newClaimData.policyNumber}. Incident Date: ${newClaimData.incidentDate}. Extracted Info: ${JSON.stringify(currentExtractedInfo || {})}`,
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

      let consistencyReport: ConsistencyReport | undefined;
      if (newClaimData.documentUri && currentExtractedInfo && fraudAssessmentResult) {
        const isConsistent = Math.random() > 0.4; 
        const primaryDocName = newClaimData.documentName || "Submitted Claim Document";
        const secondaryDocTypes = ["Police Report (on file)", "Witness Statement (on file)", "Internal System Record"];
        const secondaryDocName = secondaryDocTypes[Math.floor(Math.random() * secondaryDocTypes.length)];
        const commonFields = ["Incident Date", "Claimant Name", "Policy Number"];
        const fieldForComparison = commonFields[Math.floor(Math.random() * commonFields.length)];
        
        const getExtractedValue = (fieldName: string) => {
            const key = Object.keys(currentExtractedInfo || {}).find(k => k.toLowerCase().replace(/\s/g, '') === fieldName.toLowerCase().replace(/\s/g, ''));
            return key ? String((currentExtractedInfo?.[key] as ExtractedFieldWithOptionalBox)?.value || "N/A") : String(newClaimData[fieldName.toLowerCase().replace(/\s/g, '') as keyof NewClaimFormData] || "N/A");
        };


        if (isConsistent) {
          consistencyReport = {
            status: 'Consistent',
            summary: `Key details (e.g., Claimant Name, ${fieldForComparison}) appear consistent between ${primaryDocName} and ${secondaryDocName}.`,
            details: [
              { documentA: primaryDocName, documentB: secondaryDocName, field: fieldForComparison, valueA: getExtractedValue(fieldForComparison), valueB: getExtractedValue(fieldForComparison), finding: 'Match' }
            ]
          };
        } else {
          const valueA = getExtractedValue(fieldForComparison);
          let valueB = "Different Value B - " + Math.random().toString(36).substring(7);
          if (fieldForComparison === "Incident Date") {
            valueB = new Date(Date.parse(newClaimData.incidentDate) - (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          } else if (fieldForComparison === "Claimant Name") {
            valueB = newClaimData.claimantName.split(" ")[0] + " Smithson"; 
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
        extractedInfo: currentExtractedInfo || {},
        fraudAssessment: fraudAssessmentResult,
        consistencyReport: consistencyReport,
        notes: '',
      };

      setClaims(prevClaims => [newClaim, ...prevClaims]);
      addNotification({ title: 'Claim Submitted', message: `New claim #${newClaim.id.substring(0,12)}... by ${newClaim.claimantName} received.`, type: 'success', claimId: newClaim.id });
      resetKycSession(); 
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

  const askQuestionOnDocument = useCallback(async (documentDataUri: string, question: string, claimId?: string): Promise<string | null> => {
    if (!documentDataUri || !question.trim()) {
      setQaAnswer("Please provide a document and a question.");
      return "Please provide a document and a question.";
    }
    setIsAskingQuestion(true);
    setQaAnswer(null);
    try {
      const result = await qaOnDocument({ documentDataUri, question });
      setQaAnswer(result.answer);
      addNotification({ title: "AI Answer Received", message: "The AI has responded to your question.", type: "success", claimId });
      return result.answer;
    } catch (error) {
      console.error("Error asking question on document:", error);
      const errorMessage = `Sorry, I encountered an error trying to answer that question. The AI model might be unavailable or the document could not be processed. Details: ${error instanceof Error ? error.message : String(error)}`;
      setQaAnswer(errorMessage);
      addNotification({ title: "Q&A Error", message: "The AI could not answer your question.", type: "error", claimId });
      return errorMessage;
    } finally {
      setIsAskingQuestion(false);
    }
  }, [addNotification]);

  const clearQaAnswer = useCallback(() => {
    setQaAnswer(null);
  }, []);


  useEffect(() => {
    const updatedInitialClaims = initialClaims.map(claim => {
      let updatedClaim = { ...claim };

      if (typeof updatedClaim.extractedInfo === 'string') {
        try {
          const parsedOldInfo = JSON.parse(updatedClaim.extractedInfo);
          const newExtractedInfo: Record<string, ExtractedFieldWithOptionalBox> = {};
          for (const key in parsedOldInfo) {
            newExtractedInfo[key] = { value: String(parsedOldInfo[key]), boundingBox: null };
          }
          updatedClaim.extractedInfo = newExtractedInfo;
        } catch (e) {
          console.warn(`Could not parse old extractedInfo for claim ${claim.id}`);
          updatedClaim.extractedInfo = { migrationError: { value: "Could not parse old data.", boundingBox: null } };
        }
      }

      const placeholderPdfUri = 'data:application/pdf;base64,JVBERi0xLjQKJ...'; 
      const placeholderPngUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

      if (updatedClaim.documentUri && (updatedClaim.documentUri.startsWith('https://placehold.co') || updatedClaim.documentUri === placeholderPdfUri || updatedClaim.documentUri === placeholderPngUri )) {
        let representativeText = `This is a placeholder document for claim ID ${claim.id}. `;
        if (claim.id.includes('abc')) { // Alice's claim
            representativeText += `Claimant: Alice Wonderland. Policy Number: POL-001. Incident Date: 2024-07-15. Document name: ${claim.documentName || 'AccidentReport.pdf'}. Original Incident Description: ${claim.incidentDescription}`;
        } else if (claim.id.includes('def')) { // Bob's claim
            representativeText += `Claimant: Bob The Builder. Policy Number: POL-002. Incident Date: 2024-07-18. Document name: ${claim.documentName || 'PlumberInvoice.pdf'}. Original Incident Description: ${claim.incidentDescription}. An extracted invoice total might be around $500.`;
        } else {
            representativeText += `Details for this claim: ${claim.incidentDescription}.`;
        }
        // Safely encode UTF-8 string to Base64 for data URI
        try {
          updatedClaim.documentUri = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(representativeText)))}`;
        } catch (e) {
            // Fallback for environments where unescape or encodeURIComponent might fail with specific characters
            updatedClaim.documentUri = `data:text/plain;base64,${btoa(representativeText)}`;
        }
        updatedClaim.documentName = updatedClaim.documentName || 'placeholder_summary.txt';
      } else if (!updatedClaim.documentUri) {
        const noDocText = "No document content available for this claim.";
        try {
            updatedClaim.documentUri = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(noDocText)))}`;
        } catch (e) {
            updatedClaim.documentUri = `data:text/plain;base64,${btoa(noDocText)}`;
        }
        updatedClaim.documentName = 'no_document_content.txt';
      }
      return updatedClaim;
    });
    setClaims(updatedInitialClaims);
    
    setNotifications(initialNotifications);
    notificationIdCounter.current = initialNotifications.length;
    setIsKycVerifiedForSession(false); 
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
        askQuestionOnDocument,
        qaAnswer,
        isAskingQuestion,
        clearQaAnswer,
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


    