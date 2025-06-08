
"use client";

import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Claim, AppNotification, ClaimStatus, ConsistencyReport, ExtractedFieldWithOptionalBox } from '@/lib/types';
import { assessFraudRisk } from '@/ai/flows/fraud-assessment';
import { extractDocumentInformation } from '@/ai/flows/document-processing';
import { qaOnDocument } from '@/ai/flows/qa-on-document';
import { db } from '@/lib/firebase'; // Import Firestore instance
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  orderBy,
  Timestamp // Import Timestamp for date fields
} from 'firebase/firestore';

// Initial Data (will be used for one-time seeding if Firestore is empty)
const initialClaimsSeed: Omit<Claim, 'submissionDate' | 'lastUpdatedDate' | 'id'>[] = [
  {
    // id: 'clm_1749303123456_abc', // ID will be auto-generated or set during seed
    claimantName: 'Alice Wonderland',
    policyNumber: 'POL-001',
    incidentDate: '2024-07-15',
    incidentDescription: 'Minor fender bender in parking lot. Scratches on rear bumper.',
    documentName: 'AccidentReport.pdf',
    documentUri: `data:text/plain;base64,${btoa(unescape(encodeURIComponent("Claimant: Alice Wonderland. Policy Number: POL-001. Incident Date: 2024-07-15. Document name: AccidentReport.pdf. Original Incident Description: Minor fender bender in parking lot. Scratches on rear bumper.")))}`,
    imageNames: ['damage_front.jpg', 'damage_side.jpg'],
    imageUris: ['https://placehold.co/150x100.png?text=Img1.1', 'https://placehold.co/150x100.png?text=Img1.2'],
    videoName: 'dashcam_footage.mp4',
    videoUri: 'https://placehold.co/160x90.png?text=Vid1',
    status: 'Pending',
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
    // id: 'clm_1749303123789_def',
    claimantName: 'Bob The Builder',
    policyNumber: 'POL-002',
    incidentDate: '2024-07-18',
    incidentDescription: 'Water damage from burst pipe in kitchen.',
    documentName: 'PlumberInvoice.pdf',
    documentUri: `data:text/plain;base64,${btoa(unescape(encodeURIComponent("Claimant: Bob The Builder. Policy Number: POL-002. Incident Date: 2024-07-18. Document name: PlumberInvoice.pdf. Original Incident Description: Water damage from burst pipe in kitchen. An extracted invoice total might be around $500.")))}`,
    status: 'Approved',
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
  { id: 'notif_1749303223456', title: 'Claim Submitted', message: 'Claim #clm_1749303123456... by Alice Wonderland received.', type: 'success', timestamp: new Date('2024-07-20T10:00:00Z').toISOString(), read: false, claimId: 'clm_1749303123456_abc' },
  { id: 'notif_1749303223789', title: 'Claim Approved', message: 'Claim #clm_1749303123789... for Bob The Builder has been approved.', type: 'success', timestamp: new Date('2024-07-22T09:15:00Z').toISOString(), read: true, claimId: 'clm_1749303123789_def' },
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
  isLoading: boolean; // General loading for claims
  isContextLoading: boolean; // More specific loading, can be combined with isLoading
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
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(true); // True initially for fetching claims
  const [isKycVerifiedForSession, setIsKycVerifiedForSession] = useState(false);
  const notificationIdCounter = useRef(initialNotifications.length);

  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);

  // Fetch claims from Firestore on mount and seed if empty
  useEffect(() => {
    const fetchAndSeedClaims = async () => {
      setIsLoading(true);
      const claimsCollectionRef = collection(db, "claims");
      const q = query(claimsCollectionRef, orderBy("submissionDate", "desc"));

      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          // One-time seed if Firestore collection is empty
          const batch = writeBatch(db);
          const seededClaimIds = ['clm_1749303123456_abc', 'clm_1749303123789_def']; // Use specific IDs for seeded claims for consistency with notifications

          initialClaimsSeed.forEach((claimData, index) => {
            const claimId = seededClaimIds[index] || `clm_seed_${Date.now()}_${index}`;
            const docRef = doc(db, "claims", claimId);
            const now = Timestamp.now();
            const submissionDate = claimData.status === 'Pending' ? now : Timestamp.fromDate(new Date(Date.now() - (2-index) * 24 * 60 * 60 * 1000)); // Earlier for approved
            const lastUpdatedDate = claimData.status === 'Pending' ? submissionDate : Timestamp.fromDate(new Date(submissionDate.toDate().getTime() + 12 * 60 * 60 * 1000));


            batch.set(docRef, {
              ...claimData,
              id: claimId,
              submissionDate: submissionDate,
              lastUpdatedDate: lastUpdatedDate,
            });
          });
          await batch.commit();
          addNotification({title: "Sample Claims Seeded", message: "Initial sample claims have been added to the database.", type: "info"});
          // Fetch again after seeding
          const seededSnapshot = await getDocs(q);
          const fetchedClaims = seededSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              // Convert Firestore Timestamps to ISO strings
              submissionDate: (data.submissionDate as Timestamp)?.toDate().toISOString(),
              lastUpdatedDate: (data.lastUpdatedDate as Timestamp)?.toDate().toISOString(),
            } as Claim;
          });
          setClaims(fetchedClaims);

        } else {
          const fetchedClaims = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              submissionDate: (data.submissionDate as Timestamp)?.toDate().toISOString(),
              lastUpdatedDate: (data.lastUpdatedDate as Timestamp)?.toDate().toISOString(),
            } as Claim;
          });
          setClaims(fetchedClaims);
        }
      } catch (error) {
        console.error("Error fetching or seeding claims from Firestore:", error);
        addNotification({ title: "Database Error", message: "Could not load claims data. Using local fallback (if any).", type: "error" });
        // Optionally, fall back to local initial claims if Firestore fails entirely (though seeding is preferred)
        // setClaims(initialClaimsSeed.map((c,i) => ({...c, id: `local_${i}`, submissionDate: new Date().toISOString(), lastUpdatedDate: new Date().toISOString()} as Claim)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSeedClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


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
    setIsLoading(true); // Use the general isLoading for this operation
    let newClaimId = `clm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let currentExtractedInfo: Record<string, ExtractedFieldWithOptionalBox> | undefined;

    try {
      // AI Processing (Document Extraction, Fraud Assessment, Consistency Check) - This part remains the same
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
          addNotification({ title: 'Document Processing Failed', message: `AI could not extract info from ${newClaimData.documentName}. Details: ${error instanceof Error ? error.message : String(error)}`, type: 'error', claimId: newClaimId });
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
        addNotification({ title: 'Fraud Assessment Failed', message: `Could not assess fraud risk for ${newClaimData.claimantName}. Details: ${error instanceof Error ? error.message : String(error)}`, type: 'error', claimId: newClaimId });
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
            details: [ { documentA: primaryDocName, documentB: secondaryDocName, field: fieldForComparison, valueA: getExtractedValue(fieldForComparison), valueB: getExtractedValue(fieldForComparison), finding: 'Match' } ]
          };
        } else {
          const valueA = getExtractedValue(fieldForComparison);
          let valueB = "Different Value B - " + Math.random().toString(36).substring(7);
          if (fieldForComparison === "Incident Date" && newClaimData.incidentDate) { valueB = new Date(Date.parse(newClaimData.incidentDate) - (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; }
          else if (fieldForComparison === "Claimant Name") { valueB = newClaimData.claimantName.split(" ")[0] + " Smithson"; }
          consistencyReport = { status: 'Inconsistent', summary: `Discrepancy noted in "${fieldForComparison}" between ${primaryDocName} and ${secondaryDocName}. Review recommended.`, details: [{ documentA: primaryDocName, documentB: secondaryDocName, field: fieldForComparison, valueA: valueA, valueB: valueB, finding: 'Mismatch', }], };
        }
        addNotification({ title: 'Consistency Check Simulated', message: `Consistency: ${consistencyReport.status} for ${newClaimData.claimantName}'s claim.`, type: 'info', claimId: newClaimId });
      } else if (newClaimData.documentUri) {
          consistencyReport = { status: 'Not Run', summary: 'Consistency check requires full AI analysis of all related documents. Main document uploaded.', };
      }

      const now = Timestamp.now();
      const newClaimForDb = {
        id: newClaimId, // Store id in the document as well for easier reference
        claimantName: newClaimData.claimantName,
        policyNumber: newClaimData.policyNumber,
        incidentDate: newClaimData.incidentDate,
        incidentDescription: newClaimData.incidentDescription,
        documentName: newClaimData.documentName,
        documentUri: newClaimData.documentUri,
        imageNames: newClaimData.imageNames || [],
        imageUris: newClaimData.imageUris || [],
        videoName: newClaimData.videoName,
        videoUri: newClaimData.videoUri,
        status: 'Pending' as ClaimStatus,
        submissionDate: now, // Firestore Timestamp
        lastUpdatedDate: now, // Firestore Timestamp
        extractedInfo: currentExtractedInfo || {},
        fraudAssessment: fraudAssessmentResult,
        consistencyReport: consistencyReport,
        notes: '',
      };

      await setDoc(doc(db, "claims", newClaimId), newClaimForDb);

      // Convert ClaimForDb to Claim for local state
      const newClaimForState: Claim = {
        ...newClaimForDb,
        submissionDate: now.toDate().toISOString(),
        lastUpdatedDate: now.toDate().toISOString(),
      };
      
      setClaims(prevClaims => [newClaimForState, ...prevClaims].sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()));
      addNotification({ title: 'Claim Submitted to DB', message: `New claim #${newClaimForState.id.substring(0,12)}... by ${newClaimForState.claimantName} saved.`, type: 'success', claimId: newClaimForState.id });
      resetKycSession();
      setIsLoading(false);
      return newClaimForState;

    } catch (error) {
      console.error("Error adding claim to Firestore:", error);
      addNotification({ title: 'Claim Submission Failed', message: `There was an error saving the claim. Details: ${error instanceof Error ? error.message : String(error)}`, type: 'error', claimId: newClaimId });
      setIsLoading(false);
      return null;
    }
  }, [addNotification, resetKycSession]);

  const updateClaimStatus = async (claimId: string, status: ClaimStatus, notes?: string) => {
    setIsLoading(true);
    const claimDocRef = doc(db, "claims", claimId);
    const newLastUpdatedDate = Timestamp.now();
    const updateData: Partial<Claim> & { lastUpdatedDate: Timestamp } = {
        status,
        lastUpdatedDate: newLastUpdatedDate,
    };
    if (notes !== undefined) {
        updateData.notes = notes;
    }

    try {
      await updateDoc(claimDocRef, updateData);
      setClaims(prevClaims =>
        prevClaims.map(claim => {
          if (claim.id === claimId) {
            const updatedClaim = {
              ...claim,
              status,
              lastUpdatedDate: newLastUpdatedDate.toDate().toISOString(),
              notes: notes !== undefined ? notes : claim.notes,
            };
            addNotification({ title: 'Claim Updated in DB', message: `Claim #${claimId.substring(0,12)}... status changed to ${status}.`, type: 'info', claimId });
            return updatedClaim;
          }
          return claim;
        }).sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
      );
    } catch (error) {
        console.error("Error updating claim status in Firestore:", error);
        addNotification({ title: 'DB Update Failed', message: `Could not update claim ${claimId}. Details: ${error instanceof Error ? error.message : String(error)}`, type: 'error', claimId });
    } finally {
        setIsLoading(false);
    }
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
      const errorMsg = "Please provide a document and a question.";
      setQaAnswer(errorMsg);
      return errorMsg;
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
      addNotification({ title: "Q&A Error", message: `The AI could not answer your question. Details: ${error instanceof Error ? error.message : String(error)}`, type: "error", claimId });
      return errorMessage;
    } finally {
      setIsAskingQuestion(false);
    }
  }, [addNotification]);

  const clearQaAnswer = useCallback(() => {
    setQaAnswer(null);
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
        isLoading: isLoading, // General loading for claim operations
        isContextLoading: isLoading, // Can be used if more specific loading is needed or kept same as general
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
    
