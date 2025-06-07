
"use client";

import { ClaimForm } from '@/components/claims/ClaimForm';
import { KycForm } from '@/components/kyc/KycForm';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, FileText } from 'lucide-react';

export default function NewClaimProcessPage() {
  const { isKycVerifiedForSession } = useAppContext();

  return (
    <div className="max-w-2xl mx-auto">
      {!isKycVerifiedForSession ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <ShieldCheck className="mr-2 h-6 w-6 text-primary" />
              Step 1: Identity Verification (KYC)
            </CardTitle>
            <CardDescription>
              Before submitting your claim, please complete this quick identity verification step.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KycForm />
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
           <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <FileText className="mr-2 h-6 w-6 text-primary" />
              Step 2: Submit New Insurance Claim
            </CardTitle>
            <CardDescription>
              Please fill in the details below. Attach supporting documents, images, and a video if necessary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClaimForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
