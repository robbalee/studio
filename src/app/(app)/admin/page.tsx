
"use client";

import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { AlertTriangle, FileText, Brain, CheckCircle2 } from 'lucide-react';

export default function AdminReportsPage() {
  const { claims } = useAppContext();

  const renderExtractedInfo = (info: Record<string, any> | undefined) => {
    if (!info || Object.keys(info).length === 0) {
      return <p className="text-sm text-muted-foreground italic">No information extracted or N/A.</p>;
    }
    return (
      <ul className="list-disc space-y-1 pl-4">
        {Object.entries(info).map(([key, value]) => (
          <li key={key} className="text-sm">
            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
            {typeof value === 'object' && value !== null ? (
              <pre className="ml-2 mt-1 p-2 bg-muted/50 rounded-md text-xs whitespace-pre-wrap break-all">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <span className="ml-1 text-muted-foreground">{String(value)}</span>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const getRiskBadgeContent = (riskScore?: number) => {
    if (riskScore === undefined) {
      return { variant: 'outline' as const, text: 'N/A', icon: null, className: '' };
    }
    if (riskScore >= 0.7) {
      return { variant: 'destructive' as const, text: `High Risk (${riskScore.toFixed(2)})`, icon: <AlertTriangle className="h-4 w-4 mr-1" />, className: '' };
    }
    if (riskScore >= 0.4) {
      return { variant: 'secondary' as const, text: `Medium Risk (${riskScore.toFixed(2)})`, icon: <AlertTriangle className="h-4 w-4 mr-1" />, className: 'bg-yellow-500 text-white' };
    }
    return { variant: 'default' as const, text: `Low Risk (${riskScore.toFixed(2)})`, icon: <CheckCircle2 className="h-4 w-4 mr-1" />, className: 'bg-accent text-accent-foreground' };
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center"><Brain className="mr-2 h-7 w-7 text-primary" /> AI Reports Dashboard</CardTitle>
        <CardDescription>Review AI-generated reports for submitted claims, including fraud assessments and document extractions.</CardDescription>
      </CardHeader>
      <CardContent>
        {claims.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-2">
            {claims.map((claim) => {
              const riskInfo = getRiskBadgeContent(claim.fraudAssessment?.riskScore);
              return (
                <AccordionItem value={claim.id} key={claim.id} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-card">
                  <AccordionTrigger className="p-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-base text-primary">Claim ID: {claim.id.substring(0, 12)}...</span>
                        <span className="text-sm text-muted-foreground">Claimant: {claim.claimantName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={riskInfo.variant} className={riskInfo.className}>
                          {riskInfo.icon}
                          {riskInfo.text}
                        </Badge>
                        <Badge variant={
                            claim.status === 'Approved' ? 'default' : 
                            claim.status === 'Rejected' ? 'destructive' : 
                            'secondary'
                          } className={claim.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}>
                          {claim.status}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                    <div className="border-t pt-4 grid md:grid-cols-2 gap-6">
                      <Card className="bg-background/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-primary" /> Fraud Assessment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {claim.fraudAssessment ? (
                            <>
                              <p><span className="font-medium">Risk Score:</span> <span className="font-bold">{claim.fraudAssessment.riskScore.toFixed(2)}</span></p>
                              <p><span className="font-medium">Summary:</span></p>
                              <p className="text-muted-foreground bg-muted/30 p-2 rounded-md">{claim.fraudAssessment.summary || "N/A"}</p>
                              {claim.fraudAssessment.fraudIndicators.length > 0 && (
                                <div>
                                  <p className="font-medium">Indicators:</p>
                                  <ul className="list-disc list-inside text-muted-foreground pl-4">
                                    {claim.fraudAssessment.fraudIndicators.map((ind, i) => <li key={i}>{ind}</li>)}
                                  </ul>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="italic text-muted-foreground">No fraud assessment data available for this claim.</p>
                          )}
                        </CardContent>
                      </Card>
                      <Card className="bg-background/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Extracted Document Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {renderExtractedInfo(claim.extractedInfo)}
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <Image src="https://placehold.co/300x200.png" alt="No claims for AI reports" width={200} height={133} data-ai-hint="empty state chart analytics" className="mb-6 rounded-lg" />
            <h3 className="text-xl font-semibold text-foreground mb-3">No AI Reports Available</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              When claims are processed by AI, their reports will appear here. Try submitting a new claim.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
