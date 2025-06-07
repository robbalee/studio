
"use client";

import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Claim, AppNotification, ClaimStatus } from '@/lib/types';
import { assessFraudRisk } from '@/ai/flows/fraud-assessment';
import { extractDocumentInformation } from '@/ai/flows/document-processing';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  deleteDoc,
  writeBatch,
  where,
  getDocs,
} from 'firebase/firestore';

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
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const convertFirestoreTimestampToString = (timestamp: any): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date().toISOString(); // Fallback
};


export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial load
  const notificationIdCounter = useRef(0);


  const addLocalNotification = useCallback((notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>, id?: string, timestamp?: string) => {
    notificationIdCounter.current += 1;
    const newNotification: AppNotification = {
      ...notificationData,
      id: id || `local_${Date.now()}_${notificationIdCounter.current}`,
      timestamp: timestamp || new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
  }, []);

  const addNotificationToFirestore = async (notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): Promise<AppNotification | null> => {
    try {
      const notificationPayload = {
        ...notificationData,
        timestamp: Timestamp.fromDate(new Date()),
        read: false,
      };
      const docRef = await addDoc(collection(db, 'notifications'), notificationPayload);
      return { ...notificationPayload, id: docRef.id, timestamp: notificationPayload.timestamp.toDate().toISOString() };
    } catch (error) {
      console.error("Error adding notification to Firestore:", error);
      addLocalNotification({title: "Firestore Error", message: "Could not save notification.", type: "error"});
      return null;
    }
  };


  useEffect(() => {
    setIsLoading(true);
    const claimsQuery = query(collection(db, 'claims'), orderBy('submissionDate', 'desc'));
    const unsubscribeClaims = onSnapshot(claimsQuery, (querySnapshot) => {
      const fetchedClaims: Claim[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedClaims.push({
          id: doc.id,
          ...data,
          submissionDate: convertFirestoreTimestampToString(data.submissionDate),
          lastUpdatedDate: convertFirestoreTimestampToString(data.lastUpdatedDate),
          incidentDate: typeof data.incidentDate === 'string' ? data.incidentDate : convertFirestoreTimestampToString(data.incidentDate),
        } as Claim);
      });
      setClaims(fetchedClaims);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching claims:", error);
      addLocalNotification({ title: 'Data Load Error', message: 'Could not load claims from database.', type: 'error' });
      setIsLoading(false);
    });

    const notificationsQuery = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (querySnapshot) => {
      const fetchedNotifications: AppNotification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedNotifications.push({
          id: doc.id,
          ...data,
          timestamp: convertFirestoreTimestampToString(data.timestamp),
        } as AppNotification);
      });
      setNotifications(fetchedNotifications);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      addLocalNotification({ title: 'Data Load Error', message: 'Could not load notifications from database.', type: 'error' });
    });

    return () => {
      unsubscribeClaims();
      unsubscribeNotifications();
    };
  }, [addLocalNotification]);


  const addClaim = useCallback(async (newClaimData: NewClaimFormData): Promise<Claim | null> => {
    setIsLoading(true);
    let claimIdForNotifications: string | undefined; // To be used if initial addDoc fails but we still want to log an error notif

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
            } catch (e) {
              console.error("Failed to parse extractedInformation JSON string:", e);
              extractedInfo = { parsingError: "Failed to parse AI response for extracted information." };
            }
          }
        } catch (error) {
          console.error("Error processing document with AI:", error);
          // Notification for this will be added after claim ID is obtained or if saving fails
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
      } catch (error) {
        console.error("Error assessing fraud risk:", error);
        // Notification for this will be added after claim ID is obtained or if saving fails
      }

      const submissionTimestamp = Timestamp.fromDate(new Date());
      const claimToSave = {
        claimantName: newClaimData.claimantName,
        policyNumber: newClaimData.policyNumber,
        incidentDate: newClaimData.incidentDate,
        incidentDescription: newClaimData.incidentDescription,
        documentName: newClaimData.documentName || null,
        documentUri: newClaimData.documentUri || null,
        imageNames: newClaimData.imageNames || [],
        imageUris: newClaimData.imageUris || [],
        videoName: newClaimData.videoName || null,
        videoUri: newClaimData.videoUri || null,
        status: 'Pending' as ClaimStatus,
        submissionDate: submissionTimestamp,
        lastUpdatedDate: submissionTimestamp,
        extractedInfo: extractedInfo || {},
        fraudAssessment: fraudAssessmentResult || null,
        notes: '',
      };

      const docRef = await addDoc(collection(db, 'claims'), claimToSave);
      claimIdForNotifications = docRef.id; // Set this as soon as we have it

      const fullClaim: Claim = {
        id: docRef.id,
        ...claimToSave,
        submissionDate: submissionTimestamp.toDate().toISOString(),
        lastUpdatedDate: submissionTimestamp.toDate().toISOString(),
      };
      
      if (extractedInfo && !extractedInfo.parsingError && newClaimData.documentName) {
         await addNotificationToFirestore({ title: 'Document Processed', message: `Info extracted from ${newClaimData.documentName}.`, type: 'success', claimId: docRef.id });
      } else if (extractedInfo?.parsingError && newClaimData.documentName){
         await addNotificationToFirestore({ title: 'Document Parsing Error', message: `Could not parse extracted info for ${newClaimData.documentName}. Invalid JSON.`, type: 'error', claimId: docRef.id });
      } else if (!extractedInfo && newClaimData.documentUri && newClaimData.documentName) { // Only notify if an attempt was made
         await addNotificationToFirestore({ title: 'Document Processing Failed', message: `AI could not extract info from ${newClaimData.documentName}.`, type: 'error', claimId: docRef.id });
      }

      if (fraudAssessmentResult) {
        await addNotificationToFirestore({ title: 'Fraud Assessment Complete', message: `Risk score: ${fraudAssessmentResult.riskScore.toFixed(2)} for claim by ${newClaimData.claimantName}.`, type: 'info', claimId: docRef.id });
      } else { // Only notify if an attempt was made
         await addNotificationToFirestore({ title: 'Fraud Assessment Failed', message: `Could not assess fraud risk for ${newClaimData.claimantName}.`, type: 'error', claimId: docRef.id });
      }

      await addNotificationToFirestore({ title: 'Claim Submitted', message: `New claim #${docRef.id.substring(0,12)}... by ${fullClaim.claimantName} received.`, type: 'success', claimId: docRef.id });
      
      setIsLoading(false);
      return fullClaim;

    } catch (error) {
      console.error("Error adding claim to Firestore:", error);
      await addNotificationToFirestore({ title: 'Claim Submission Failed', message: 'There was an error saving the claim to the database.', type: 'error', claimId: claimIdForNotifications });
      setIsLoading(false);
      return null;
    }
  }, [addNotificationToFirestore]);

  const updateClaimStatus = async (claimId: string, status: ClaimStatus, notes?: string) => {
    setIsLoading(true);
    try {
      const claimRef = doc(db, 'claims', claimId);
      const updatePayload: Record<string, any> = {
        status,
        lastUpdatedDate: Timestamp.fromDate(new Date())
      };
      if (notes !== undefined) {
        updatePayload.notes = notes;
      }
      await updateDoc(claimRef, updatePayload);
      await addNotificationToFirestore({ title: 'Claim Updated', message: `Claim #${claimId.substring(0,12)}... status changed to ${status}.`, type: 'info', claimId });
    } catch (error) {
      console.error("Error updating claim status in Firestore:", error);
      await addNotificationToFirestore({ title: 'Update Failed', message: `Could not update status for claim ${claimId.substring(0,12)}...`, type: 'error', claimId });
    }
    setIsLoading(false);
  };

  const getClaimById = useCallback((claimId: string): Claim | undefined => {
    return claims.find(claim => claim.id === claimId);
  }, [claims]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
      // Local state updates via onSnapshot
    } catch (error) {
      console.error("Error marking notification as read:", error);
      addLocalNotification({ title: 'Error', message: 'Could not mark notification as read.', type: 'error', id: `err_${notificationId}` });
    }
  };

  const clearNotifications = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'notifications'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setIsLoading(false);
        return;
      }
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      // Local state will be updated by the onSnapshot listener, but clear immediately for responsiveness
      setNotifications([]); 
    } catch (error) {
      console.error("Error clearing notifications:", error);
       addLocalNotification({ title: 'Error', message: 'Could not clear notifications from database.', type: 'error' });
    }
    setIsLoading(false);
  };
  
  const addNotification = addNotificationToFirestore;


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
