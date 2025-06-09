
# ClaimIntel: AI-Powered Insurance Claim Processing

ClaimIntel is a modern, AI-driven web application designed to streamline and enhance the insurance claim lifecycle. It leverages cutting-edge technologies to automate document processing, assess fraud risk, and provide a seamless user experience for both claimants and insurance personnel.

## Core Features

ClaimIntel offers a robust set of features to manage and analyze insurance claims intelligently:

*   **Full Claim Lifecycle Management:**
    *   **New Claim Submission:** Intuitive forms for claimants to submit details, primary documents, multiple supporting images, and video evidence.
    *   **KYC Verification (Demo):** A simulated Know Your Customer step before claim submission to enhance security and user journey understanding.
    *   **Comprehensive Claims Dashboard:** View all submitted claims with key details, status, and AI-generated risk scores.
    *   **Detailed Claim View:** In-depth page for each claim, showcasing all submitted information, AI reports, uploaded media, and allowing status updates by adjusters.
    *   **User Dashboard:** Overview of claim statistics (Total, Approved, Pending, High Risk) with a visual chart and recent claim list.
*   **AI-Powered Document Intelligence:**
    *   **Automated Information Extraction:** AI analyzes uploaded documents (PDFs, images, text content from other types) to extract relevant fields (policy numbers, names, dates, invoice totals).
    *   **Entity Location (Conceptual):** The AI attempts to identify bounding box coordinates for extracted entities, with a UI indicator for future visual highlighting.
*   **AI-Driven Fraud Assessment:**
    *   **Automated Risk Scoring:** AI analyzes claim details, documents, and media to generate a fraud risk score and identify specific fraud indicators.
*   **AI Reports Dashboard (Admin View):**
    *   Centralized view for AI insights on all claims, including fraud assessments, extracted document information, and consistency checks.
*   **Cross-Document Consistency Check (Conceptual):**
    *   Simulated AI analysis checking for consistency of key information across uploaded documents and conceptual "on-file" records.
*   **In-App Notification System:**
    *   Real-time updates for users on claim submission, status changes, and AI processing milestones.

For a more detailed breakdown of implemented features, please see [FEATURES.md](./FEATURES.md).

## Tech Stack

This application is built with a modern, robust technology stack:

*   **Frontend:**
    *   **Next.js (v15+ with App Router):** For server-side rendering, static site generation, and a powerful React framework.
    *   **React (v18+):** For building interactive user interfaces.
    *   **TypeScript:** For type safety and improved developer experience.
    *   **ShadCN UI:** Beautifully designed, accessible, and customizable UI components.
    *   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
    *   **Lucide React:** For icons.
    *   **Recharts:** For data visualization (charts).
*   **Backend & AI:**
    *   **Genkit (Firebase Genkit):** An open-source framework for building production-ready AI-powered applications. Used for defining AI flows, prompts, and integrating with generative models.
        *   **Google AI (Gemini 2.0 Flash):** Leveraged for multimodal input processing (text, images, documents) for information extraction and fraud assessment.
    *   **Firebase Firestore:** As the primary NoSQL database for storing claim data, notifications, and AI-generated reports.
*   **Development & Deployment:**
    *   **Firebase App Hosting:** For deploying and hosting the Next.js application.
    *   **Node.js & npm:** For package management and server-side JavaScript runtime.

## Getting Started

Follow these steps to get the ClaimIntel application running locally:

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

### 1. Clone the Repository

```bash
git clone <repository-url>
cd claimintel
```

### 2. Install Dependencies

```bash
npm install
# or
# yarn install
```

### 3. Set Up Environment Variables

The application requires Firebase and Genkit (Google AI) configuration.

*   Create a `.env` file in the root of the project.
*   Add your Firebase project configuration details. You can find these in your Firebase project settings (Project settings > General > Your apps > Web app config).

    ```env
    # Firebase Configuration (Client-side)
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID" # Crucial for Firestore to connect
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

    # Google AI / Genkit (Server-side, if needed directly in .env for local dev.
    # Typically, for Genkit with Google AI, ensure your gcloud CLI is authenticated
    # or GOOGLE_API_KEY is set in your environment where Genkit flows run.)
    # GOOGLE_API_KEY="YOUR_GOOGLE_AI_STUDIO_API_KEY" # If using API Key auth for Genkit
    ```

    **Important:** The `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is essential for Firestore operations to work correctly. If it's missing or incorrect, you will see errors related to Firestore connectivity.

### 4. Run the Development Server

The application has two main parts to run for local development: the Next.js frontend and the Genkit development server for AI flows.

*   **Run the Next.js App:**
    ```bash
    npm run dev
    ```
    This will typically start the frontend on `http://localhost:9002`.

*   **Run the Genkit Development Server (in a separate terminal):**
    ```bash
    npm run genkit:dev
    # or for auto-reloading on Genkit flow changes:
    # npm run genkit:watch
    ```
    This starts the Genkit development environment, allowing you to inspect and test your AI flows (usually accessible via a local Genkit UI, check terminal output for URL).

### 5. Access the Application

Open your browser and navigate to `http://localhost:9002` (or the port specified in your terminal).

## Project Structure Overview

*   **`src/app/`**: Next.js App Router pages and layouts.
    *   **`(app)/`**: Authenticated/main application routes (dashboard, claims, admin, etc.).
    *   **`globals.css`**: Global styles and Tailwind CSS theme.
    *   **`layout.tsx`**: Root layout.
    *   **`page.tsx`**: Welcome/landing page.
*   **`src/ai/`**: Genkit AI related code.
    *   **`genkit.ts`**: Genkit initialization and configuration.
    *   **`flows/`**: Contains individual Genkit flows for tasks like document processing, fraud assessment, and Q&A.
    *   **`dev.ts`**: Development entry point for Genkit flows.
*   **`src/components/`**: Reusable React components.
    *   **`ui/`**: ShadCN UI components.
    *   **`claims/`**: Components specific to claim management (forms, details page).
    *   **`dashboard/`**: Components for the main dashboard.
    *   **`kyc/`**: Components for the KYC (demo) process.
    *   `AppLayout.tsx`, `AppNavigation.tsx`, `Header.tsx`, `Logo.tsx`: Core layout components.
*   **`src/contexts/`**: React Context API.
    *   **`AppContext.tsx`**: Manages global state for claims, notifications, AI interactions, and Firebase operations.
*   **`src/hooks/`**: Custom React hooks (e.g., `useToast`, `useIsMobile`).
*   **`src/lib/`**: Utility functions, type definitions, and Firebase initialization.
    *   **`firebase.ts`**: Firebase SDK initialization.
    *   **`types.ts`**: TypeScript type definitions for key data structures (Claim, Notification, etc.).
    *   **`utils.ts`**: General utility functions like `cn` for class names.
*   **`public/`**: Static assets.
*   **Configuration Files:**
    *   `next.config.ts`: Next.js configuration.
    *   `tailwind.config.ts`: Tailwind CSS configuration.
    *   `components.json`: ShadCN UI configuration.
    *   `tsconfig.json`: TypeScript configuration.
    *   `package.json`: Project dependencies and scripts.

## AI Integration with Genkit

ClaimIntel heavily relies on Genkit to orchestrate AI functionalities:

*   **AI Flows:** Defined in `src/ai/flows/`. These server-side functions encapsulate logic for interacting with AI models.
    *   `document-processing.ts`: Extracts information from uploaded documents.
    *   `fraud-assessment.ts`: Assesses fraud risk based on claim data and documents.
    *   `qa-on-document.ts`: Allows users to ask questions about specific documents.
*   **Model Used:** Google's Gemini 2.0 Flash model is configured in `src/ai/genkit.ts`, chosen for its multimodal capabilities (handling text and images/documents).
*   **Prompts:** Carefully crafted prompts (using Handlebars templating) guide the AI model's behavior for each flow, ensuring structured and relevant outputs. Zod schemas define the expected input and output structures for AI interactions.

## Firestore Database

Firebase Firestore is used as the backend database:

*   **`claims` collection:** Stores all claim documents. Each document represents a single claim and includes claimant details, incident information, document URIs (or placeholders), AI-generated reports (extracted info, fraud assessment, consistency checks), status, and timestamps.
*   **Initial Seeding:** The `AppContext.tsx` includes logic to seed the `claims` collection with sample data if it's empty on the first run with a valid Firebase Project ID. This is helpful for demos.
*   **Data Structure:** Defined in `src/lib/types.ts` (e.g., `Claim` interface).

## Demoing the Application

1.  Ensure your `.env` file is correctly configured with your Firebase project details.
2.  Start both the Next.js frontend (`npm run dev`) and the Genkit server (`npm run genkit:dev`).
3.  Navigate to the application (default: `http://localhost:9002`).
4.  **New Claim Flow:**
    *   From the landing page, click "My Claims" or a specific insurance type CTA (e.g., "File Car Claim").
    *   You'll be directed to the KYC form (demo). Fill it out and submit.
    *   Proceed to the "Submit New Claim" form. Fill in details and attach a document (e.g., PDF, image, or even a `.docx` or `.zip` which will be handled differently by the AI). Upload supporting images and/or a video if desired.
    *   Upon submission, AI flows will trigger in the background. You'll receive notifications about the progress.
5.  **View Claims:**
    *   Go to "All Claims" to see a list of submitted claims, including their status and AI risk score.
    *   Click on a claim to view its detailed page.
6.  **AI Reports Dashboard:**
    *   Navigate to "AI Reports" (admin section) to see an accordion view of claims with their detailed AI-generated fraud assessments, extracted information, and consistency checks.
    *   For fields with bounding box data in "Extracted Info", clicking the "locate" icon will show a conceptual coordinate toast.
7.  **Q&A on Document:**
    *   On the Claim Details page, if a processable document was uploaded, use the "Q&A on Document" section to ask the AI questions about its content.

## Known Considerations & Future Enhancements

*   **File Uploads:** Currently, files are converted to Data URIs. For production, direct uploads to cloud storage (e.g., Firebase Storage) and passing URIs to Genkit would be more scalable.
*   **Real-time Updates:** While notifications exist, deeper real-time updates for claim status changes could be enhanced using Firestore listeners.
*   **Document Highlighting:** Implement actual visual highlighting of extracted entities on document previews using the bounding box data.
*   **User Authentication:** Add a proper authentication system.
*   **Error Handling:** Enhance global error handling and user feedback for AI flow failures.
*   **Testing:** Implement comprehensive unit and integration tests.

---

This README provides a solid overview of ClaimIntel. Feel free to expand on any section or add more specific details as the project evolves.
