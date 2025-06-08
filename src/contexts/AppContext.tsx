
"use client";

import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Claim, AppNotification, ClaimStatus, ConsistencyReport, ExtractedFieldWithOptionalBox, AssessFraudRiskOutput } from '@/lib/types';
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
    claimantName: 'Alice Wonderland',
    policyNumber: 'POL-001',
    incidentDate: '2024-07-15',
    incidentDescription: 'Minor fender bender in parking lot. Scratches on rear bumper.',
    documentName: 'AccidentReport.pdf',
    documentUri: '', 
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
    claimantName: 'Bob The Builder',
    policyNumber: 'POL-002',
    incidentDate: '2024-07-18',
    incidentDescription: 'Water damage from burst pipe in kitchen.',
    documentName: 'PlumberInvoice.pdf',
    documentUri: '', 
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
  {
    claimantName: 'Charles Xavier',
    policyNumber: 'POL-003',
    incidentDate: '2024-07-20',
    incidentDescription: 'Claim for damages to specialized electronic equipment during a power surge. Multiple items affected, detailed list attached.',
    documentName: 'EquipmentDamageReport.docx',
    documentUri: '', 
    imageNames: ['damaged_equipment_1.jpg', 'surge_protector.jpg', 'invoice_scan.jpg'],
    imageUris: ['https://placehold.co/150x100.png?text=Equip1', 'https://placehold.co/150x100.png?text=SurgeP', 'https://placehold.co/150x100.png?text=InvoiceScan'],
    videoName: 'security_cam_surge.mp4',
    videoUri: 'https://placehold.co/160x90.png?text=SurgeVid',
    status: 'Under Review',
    extractedInfo: {
      affectedItems: { value: { "item1": { "name": "Custom Server Rack", "damage": "Fried motherboard", "estimatedCost": "$2500" }, "item2": { "name": "Precision Sensor Array", "damage": "Unresponsive", "estimatedCost": "$1800" } }, boundingBox: null },
      incidentLocation: { value: "Client Office Building A", boundingBox: { x: 0.1, y: 0.15, width: 0.4, height: 0.03, page: 1 } },
      reportedPowerCompany: { value: "City Electric Co.", boundingBox: null }
    },
    fraudAssessment: { riskScore: 0.55, fraudIndicators: ["High value of claimed items", "Previous claim for similar equipment 2 years ago (minor)", "Vague description of surge event details"], summary: "Moderate risk due to high claim value and past history. Documented damage appears consistent with a power surge. Recommend verification of equipment ownership and purchase dates." },
    consistencyReport: {
      status: 'Partial',
      summary: "Policy number matches internal records. Reported incident date consistent with power outage logs in the area. However, specific equipment serial numbers not found in submitted documents for cross-referencing with purchase invoices on file.",
      details: [
        { documentA: 'EquipmentDamageReport.docx', documentB: 'Internal Policy Record', field: 'Policy Number', valueA: 'POL-003', valueB: 'POL-003', finding: 'Match' },
        { documentA: 'EquipmentDamageReport.docx', documentB: 'Purchase Invoices (on file)', field: 'Equipment Serial Numbers', valueA: 'Not Provided', valueB: 'SN-XYZ-123, SN-ABC-456', finding: 'Missing in A' }
      ]
    },
    notes: 'Adjuster contacted claimant for serial numbers and proof of purchase.',
  },
  {
    claimantName: 'Diana Prince',
    policyNumber: 'POL-004',
    incidentDate: '2024-07-21',
    incidentDescription: 'Theft of rare artifact from private collection. No forced entry, security system mysteriously offline.',
    documentName: 'TheftStatement_DP.zip',
    documentUri: '', 
    imageNames: ['empty_display_case.jpg'],
    imageUris: ['https://placehold.co/150x100.png?text=EmptyCase'],
    status: 'Rejected',
    extractedInfo: {
      claimedItem: { value: "Ancient Amazonian Shield", boundingBox: { x: 0.2, y: 0.3, width: 0.5, height: 0.04, page: 1 } },
      estimatedValue: { value: "$500,000", boundingBox: { x: 0.2, y: 0.35, width: 0.2, height: 0.04, page: 1 } },
      securityStatus: { value: "Offline - reason unknown", boundingBox: null }
    },
    fraudAssessment: { riskScore: 0.88, fraudIndicators: ["Extremely high value for a single item with limited provenance", "Security system conveniently offline", "No signs of forced entry reported", "Claimant has multiple recent high-value item insurance policies taken out.", "Similar MO to an unsolved case in another jurisdiction."], summary: "High probability of fraud. The circumstances of the alleged theft are highly suspicious and lack credible evidence. Multiple red flags. Recommend immediate rejection and referral to SIU." },
    consistencyReport: {
      status: 'Inconsistent',
      summary: "Significant discrepancies found. The claimed artifact is not listed on the policy schedule. The reported incident date conflicts with travel records showing claimant was out of the country.",
      details: [
        { documentA: 'TheftStatement_DP.zip', documentB: 'Policy Schedule POL-004', field: 'Insured Item "Ancient Amazonian Shield"', valueA: 'Claimed', valueB: 'Not Listed', finding: 'Mismatch' },
        { documentA: 'TheftStatement_DP.zip', documentB: 'Travel Records (External System)', field: 'Claimant Location on Incident Date', valueA: 'At Residence', valueB: 'Overseas (Themyscira)', finding: 'Mismatch' }
      ]
    },
    notes: 'Claim rejected due to strong evidence of misrepresentation and potential fraud. Referred to Special Investigations Unit.',
  }
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
  isLoading: boolean; 
  isContextLoading: boolean; 
  isKycVerifiedForSession: boolean;
  completeKycSession: () => void;
  resetKycSession: () => void;
  askQuestionOnDocument: (documentDataUri: string, question: string, claimId?: string) => Promise<string | null>;
  qaAnswer: string | null;
  isAskingQuestion: boolean;
  clearQaAnswer: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default objects for AI-derived fields to prevent Firestore 'undefined' errors
const defaultExtractedInfo: Record<string, ExtractedFieldWithOptionalBox> = {
  processingStatus: { value: "Extraction not performed, failed, or no document provided." }
};

const defaultFraudAssessment: AssessFraudRiskOutput = {
  riskScore: 0, // Neutral/default score
  fraudIndicators: ["Assessment Not Performed"],
  summary: "Fraud assessment was not performed or encountered an error."
};

const defaultConsistencyReport: ConsistencyReport = {
  status: 'Not Run',
  summary: 'Consistency check was not performed or encountered an error.'
};


export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(true); 
  const [isKycVerifiedForSession, setIsKycVerifiedForSession] = useState(false);
  const notificationIdCounter = useRef(initialNotifications.length);

  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);

  useEffect(() => {
    const fetchAndSeedClaims = async () => {
      setIsLoading(true);
      const claimsCollectionRef = collection(db, "claims");
      const q = query(claimsCollectionRef, orderBy("submissionDate", "desc"));

      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          const batch = writeBatch(db);
          const seededClaimIds = [
            'clm_1749303123456_abc', 
            'clm_1749303123789_def',
            'clm_1749303300000_ghi',
            'clm_1749303400000_jkl'
          ];

          initialClaimsSeed.forEach((claimData, index) => {
            const claimId = seededClaimIds[index] || `clm_seed_${Date.now()}_${index}`; 
            const docRef = doc(db, "claims", claimId);
            const now = Timestamp.now();
            const submissionDate = Timestamp.fromDate(new Date(Date.now() - (initialClaimsSeed.length - 1 - index) * 24 * 60 * 60 * 1000 * 2)); 
            const lastUpdatedDate = claimData.status !== 'Pending' ? 
                                     Timestamp.fromDate(new Date(submissionDate.toDate().getTime() + (Math.random() * 24 + 12) * 60 * 60 * 1000)) : 
                                     submissionDate;

            let finalDocumentUri = claimData.documentUri;
            const documentNameLower = claimData.documentName?.toLowerCase() || '';
            const isProblematicTypeForSeedMedia = documentNameLower.endsWith('.docx') || documentNameLower.endsWith('.doc') || documentNameLower.endsWith('.zip');

            if (!finalDocumentUri || isProblematicTypeForSeedMedia) {
                 const textContent = `Document Name: ${claimData.documentName}\nDocument Type: ${documentNameLower.endsWith('.pdf') ? 'PDF Document' : documentNameLower.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? 'Image' : documentNameLower.endsWith('.zip') ? 'ZIP Archive' : 'General Document'}\nClaimant: ${claimData.claimantName}\nPolicy Number: ${claimData.policyNumber}\nIncident Date: ${claimData.incidentDate}\nDescription: ${claimData.incidentDescription}\nExtracted Info Sample (if any): ${JSON.stringify(Object.keys(claimData.extractedInfo || {}).slice(0,2).reduce((acc, key) => { acc[key] = (claimData.extractedInfo as any)[key].value; return acc; }, {} as any))}`;
                 finalDocumentUri = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(textContent)))}`;
            }
            
            batch.set(docRef, {
              ...claimData,
              id: claimId,
              documentUri: finalDocumentUri,
              submissionDate: submissionDate,
              lastUpdatedDate: lastUpdatedDate,
            });
          });
          await batch.commit();
          addNotification({title: "Sample Claims Seeded", message: "Initial sample claims have been added to the database.", type: "info"});
          const seededSnapshot = await getDocs(q);
          const fetchedClaims = seededSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              submissionDate: (data.submissionDate as Timestamp)?.toDate().toISOString(),
              lastUpdatedDate: (data.lastUpdatedDate as Timestamp)?.toDate().toISOString(),
            } as Claim;
          });
          setClaims(fetchedClaims);

        } else {
          const fetchedClaims = querySnapshot.docs.map(doc => {
            const data = doc.data();
             let finalDocumentUri = data.documentUri;
             if (!finalDocumentUri && data.documentName) { 
                const textContent = `Document: ${data.documentName}\nClaimant: ${data.claimantName}\nPolicy Number: ${data.policyNumber}\nIncident Date: ${data.incidentDate}\nDescription: ${data.incidentDescription}`;
                finalDocumentUri = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(textContent)))}`;
             }

            return {
              ...data,
              id: doc.id,
              documentUri: finalDocumentUri,
              submissionDate: (data.submissionDate as Timestamp)?.toDate().toISOString(),
              lastUpdatedDate: (data.lastUpdatedDate as Timestamp)?.toDate().toISOString(),
            } as Claim;
          });
          setClaims(fetchedClaims);
        }
      } catch (error) {
        console.error("Error fetching or seeding claims from Firestore:", error);
        addNotification({ title: "Database Error", message: `Could not load claims data. Details: ${error instanceof Error ? error.message : String(error)}`, type: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSeedClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


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
    
    let currentExtractedInfoResult: Record<string, ExtractedFieldWithOptionalBox> | undefined;
    let fraudAssessmentResult: AssessFraudRiskOutput | undefined;
    let consistencyReportResult: ConsistencyReport | undefined;
    
    let docTypeForProcessing: string | undefined;
    let isDocDirectlyProcessableForMedia = false;

    try {
      if (newClaimData.documentUri && newClaimData.documentName) {
        const docNameLower = newClaimData.documentName.toLowerCase();
        docTypeForProcessing = docNameLower.endsWith('.pdf') ? 'PDF Document' :
                               docNameLower.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? 'Image' :
                               docNameLower.endsWith('.zip') ? 'ZIP Archive' : 
                               (docNameLower.endsWith('.doc') || docNameLower.endsWith('.docx')) ? 'General Document' :
                               'Other Document';
        
        const mimeTypeMatch = newClaimData.documentUri.match(/^data:(.+?);base64,/);
        if (mimeTypeMatch && mimeTypeMatch[1]) {
          const mimeType = mimeTypeMatch[1];
          const supportedMimeTypesForMediaHelper = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'application/pdf', 'text/plain',
          ];
          if (supportedMimeTypesForMediaHelper.includes(mimeType)) {
            isDocDirectlyProcessableForMedia = true;
          }
        }
        if (docTypeForProcessing === 'General Document' || docTypeForProcessing === 'ZIP Archive' || docTypeForProcessing === 'Other Document') {
            isDocDirectlyProcessableForMedia = false;
        }

        try {
          const extractionOutput = await extractDocumentInformation({
            documentDataUri: newClaimData.documentUri,
            documentType: docTypeForProcessing,
            documentName: newClaimData.documentName,
            isDirectlyProcessableMedia: isDocDirectlyProcessableForMedia,
          });
          if (extractionOutput.extractedFieldsJson) {
             try {
                const parsedJson = JSON.parse(extractionOutput.extractedFieldsJson);
                currentExtractedInfoResult = parsedJson as Record<string, ExtractedFieldWithOptionalBox>;
                addNotification({ title: 'Document Processed', message: `Info extracted from ${newClaimData.documentName}.`, type: 'success', claimId: newClaimId });
              } catch (e) {
                console.error("Failed to parse extractedFieldsJson string:", e);
                currentExtractedInfoResult = { parsingError: { value: "Failed to parse AI response for extracted information." } };
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

      try {
        const assessmentInput = {
          claimDetails: `${newClaimData.claimantName} - ${newClaimData.incidentDescription}. Policy: ${newClaimData.policyNumber}. Incident Date: ${newClaimData.incidentDate}. Extracted Info: ${JSON.stringify(currentExtractedInfoResult || {})}`,
          supportingDocumentUri: newClaimData.documentUri,
          supportingDocumentName: newClaimData.documentName,
          supportingDocumentType: docTypeForProcessing,
          isSupportingDocumentDirectlyProcessable: isDocDirectlyProcessableForMedia,
          imageEvidenceUris: newClaimData.imageUris,
          videoEvidenceUri: newClaimData.videoUri,
        };
        const aiOutput = await assessFraudRisk(assessmentInput);
        if (aiOutput) {
            fraudAssessmentResult = aiOutput;
            addNotification({ title: 'Fraud Assessment Complete', message: `Risk score: ${fraudAssessmentResult.riskScore.toFixed(2)} for claim by ${newClaimData.claimantName}.`, type: 'info', claimId: newClaimId });
        } else {
            addNotification({ title: 'Fraud Assessment Incomplete', message: `AI returned no data for fraud assessment of ${newClaimData.claimantName}'s claim.`, type: 'warning', claimId: newClaimId });
        }
      } catch (error) {
        console.error("Error assessing fraud risk:", error);
        addNotification({ title: 'Fraud Assessment Failed', message: `Could not assess fraud risk for ${newClaimData.claimantName}. Details: ${error instanceof Error ? error.message : String(error)}`, type: 'error', claimId: newClaimId });
      }

      if (newClaimData.documentUri && currentExtractedInfoResult && fraudAssessmentResult) {
        const isConsistent = Math.random() > 0.4;
        const primaryDocName = newClaimData.documentName || "Submitted Claim Document";
        const secondaryDocTypes = ["Police Report (on file)", "Witness Statement (on file)", "Internal System Record"];
        const secondaryDocName = secondaryDocTypes[Math.floor(Math.random() * secondaryDocTypes.length)];
        const commonFields = ["Incident Date", "Claimant Name", "Policy Number"];
        const fieldForComparison = commonFields[Math.floor(Math.random() * commonFields.length)];
        
        const getExtractedValue = (fieldName: string) => {
            const key = Object.keys(currentExtractedInfoResult || {}).find(k => k.toLowerCase().replace(/\s/g, '') === fieldName.toLowerCase().replace(/\s/g, ''));
            return key ? String((currentExtractedInfoResult?.[key] as ExtractedFieldWithOptionalBox)?.value || "N/A") : String(newClaimData[fieldName.toLowerCase().replace(/\s/g, '') as keyof NewClaimFormData] || "N/A");
        };

        if (isConsistent) {
          consistencyReportResult = {
            status: 'Consistent',
            summary: `Key details (e.g., Claimant Name, ${fieldForComparison}) appear consistent between ${primaryDocName} and ${secondaryDocName}.`,
            details: [ { documentA: primaryDocName, documentB: secondaryDocName, field: fieldForComparison, valueA: getExtractedValue(fieldForComparison), valueB: getExtractedValue(fieldForComparison), finding: 'Match' } ]
          };
        } else {
          const valueA = getExtractedValue(fieldForComparison);
          let valueB = "Different Value B - " + Math.random().toString(36).substring(7);
          if (fieldForComparison === "Incident Date" && newClaimData.incidentDate) { valueB = new Date(Date.parse(newClaimData.incidentDate) - (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; }
          else if (fieldForComparison === "Claimant Name") { valueB = newClaimData.claimantName.split(" ")[0] + " Smithson"; }
          consistencyReportResult = { status: 'Inconsistent', summary: `Discrepancy noted in "${fieldForComparison}" between ${primaryDocName} and ${secondaryDocName}. Review recommended.`, details: [{ documentA: primaryDocName, documentB: secondaryDocName, field: fieldForComparison, valueA: valueA, valueB: valueB, finding: 'Mismatch', }], };
        }
        addNotification({ title: 'Consistency Check Simulated', message: `Consistency: ${consistencyReportResult.status} for ${newClaimData.claimantName}'s claim.`, type: 'info', claimId: newClaimId });
      } else if (newClaimData.documentUri) {
          consistencyReportResult = { status: 'Not Run', summary: 'Consistency check requires full AI analysis of all related documents. Main document uploaded.', };
      }

      const now = Timestamp.now();
      const newClaimForDb = {
        id: newClaimId,
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
        submissionDate: now,
        lastUpdatedDate: now,
        extractedInfo: currentExtractedInfoResult || defaultExtractedInfo,
        fraudAssessment: fraudAssessmentResult || defaultFraudAssessment,
        consistencyReport: consistencyReportResult || defaultConsistencyReport,
        notes: '',
      };

      await setDoc(doc(db, "claims", newClaimId), newClaimForDb);

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
      console.error("Error adding claim to Firestore or during AI processing:", error);
      addNotification({ title: 'Claim Submission Failed', message: `There was an error saving the claim or processing AI tasks. Details: ${error instanceof Error ? error.message : String(error)}`, type: 'error', claimId: newClaimId });
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
        isLoading: isLoading, 
        isContextLoading: isLoading, 
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

