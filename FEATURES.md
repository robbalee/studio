
# ClaimIntel: Implemented Features Showcase

This document outlines the key features implemented in the ClaimIntel application, showcasing its capabilities in intelligent insurance claim processing.

## 1. Core Claim Lifecycle Management

*   **New Claim Submission:**
    *   User-friendly form for claimants to submit new insurance claims.
    *   Collects essential details: claimant name, policy number, incident date, and a detailed description.
    *   Supports uploading a primary supporting document (e.g., PDF, DOC, image, ZIP).
    *   Allows attachment of multiple supporting images (up to 5).
    *   Allows attachment of a supporting video file.
*   **All Claims View:**
    *   A comprehensive table displaying all submitted claims.
    *   Key information at a glance: Claim ID, Claimant, Policy No., Incident Date, Status, AI Risk Score, Submission Date.
    *   Badges for quick visual assessment of claim status and AI-derived risk.
    *   Direct links to view detailed information for each claim.
*   **Detailed Claim View:**
    *   In-depth page for each individual claim, showing all submitted information.
    *   Displays AI-generated fraud assessment and extracted document information.
    *   Shows uploaded images and a playable video if provided.
    *   Allows authorized users (e.g., adjusters) to update the claim status and add internal notes.
*   **User Dashboard:**
    *   Provides an overview of key claim statistics (Total Claims, Approved, Pending, High Risk).
    *   Features a bar chart visualizing claim statuses.
    *   Lists recently submitted claims for quick access.

## 2. AI-Powered Document Intelligence

*   **Automated Information Extraction:**
    *   When a supporting document is uploaded with a new claim, an AI flow (`extractDocumentInformation`) is triggered.
    *   The AI analyzes the document content (text and layout, if an image/PDF) to extract relevant fields.
    *   Examples: policy number, claimant name, invoice totals, dates, specific details from forms.
    *   The extracted information is stored and displayed in the AI Reports Dashboard and Claim Details page.
*   **Key Entity Highlighting (Conceptual):**
    *   The AI attempts to identify and return **bounding box coordinates** for extracted entities within the document.
    *   In the "Extracted Info" section of the AI Reports, fields with available location data display a "locate" icon.
    *   Clicking this icon shows a toast message with the conceptual coordinates (x, y, width, height, page), demonstrating that the spatial information is captured and ready for future visual highlighting on the document.

## 3. AI-Driven Fraud Assessment

*   **Automated Risk Scoring:**
    *   Upon claim submission, an AI flow (`assessFraudRisk`) analyzes claim details, supporting documents, and any uploaded media.
    *   It generates a **fraud risk score** (0 to 1, higher means more risk).
    *   It identifies specific **fraud indicators** or suspicious patterns.
    *   Provides a **summary** of the assessment.
*   **Display:** The fraud assessment (score, indicators, summary) is clearly displayed in the AI Reports Dashboard and on the individual Claim Details page, aiding adjusters in decision-making.

## 4. AI Reports Dashboard (Admin View)

*   **Centralized AI Insights:** A dedicated dashboard (`/admin`) for reviewing AI-generated reports for all claims.
*   **Accordion View:** Each claim is presented in an expandable accordion item.
    *   Displays claim ID, claimant name, overall risk, and claim status at a glance.
*   **Detailed AI Breakdown:** When expanded, each claim shows:
    *   **Fraud Assessment Card:** Risk score, summary, and indicators.
    *   **Extracted Info Card:** Key-value pairs of information extracted from documents, with "locate" icons for fields with bounding box data.
    *   **Consistency Check Card:** (See feature below).

## 5. Cross-Document Consistency Check (Conceptual)

*   **Simulated AI Analysis:** For demonstration, when a new claim with a document is submitted, the system *simulates* an AI checking for consistency of key information across the uploaded document and other conceptual "on-file" documents (e.g., police report, internal records).
*   **Consistency Report:**
    *   Generates a `ConsistencyReport` object with a status (`Consistent`, `Inconsistent`, `Partial`, `Not Run`), a summary, and details of any discrepancies found.
    *   Discrepancy details include the field, the conceptual documents compared, the values from each, and the finding (e.g., "Match", "Mismatch").
*   **UI Display:** This report is shown in its own card within the AI Reports Dashboard for each claim, providing a clear overview of data consistency.

## 6. Enhanced User Journey with KYC (Demo)

*   **Simulated KYC Process:** Before a user can submit a new claim, they are presented with a Know Your Customer (KYC) form.
*   **Demo Verification:** The form collects typical KYC information (full name, DOB, ID number, and a simulated selfie upload). Submission "verifies" the user for the current session.
*   **Conditional Access:** Only after completing the KYC step can the user proceed to the claim submission form.
*   **Session-Based:** KYC "verification" is reset after a successful claim submission, requiring it again for subsequent new claims in the same session (for demo purposes).

## 7. In-App Notification System

*   **Real-time Updates:** Users receive in-app notifications for important events.
*   **Notification Types:** Success, error, warning, and informational messages.
*   **Events Covered:**
    *   Claim submitted successfully.
    *   Claim status updated by an adjuster.
    *   AI document processing milestones (e.g., info extracted, processing failed).
    *   AI fraud assessment milestones.
    *   AI consistency check milestones.
*   **Notifications Page:** A dedicated page (`/notifications`) lists all recent notifications, allows marking them as read, and clearing all notifications. Unread counts are also shown in the sidebar navigation.

This feature set provides a robust foundation for an intelligent claims processing platform, leveraging AI to enhance efficiency, accuracy, and fraud detection.
