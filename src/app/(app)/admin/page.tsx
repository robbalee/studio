
"use client";

import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { AlertTriangle, FileText, Brain, CheckCircle2, ClipboardCheck, Files, SearchCheck, LocateFixed, ShieldAlert } from 'lucide-react';
import type { ConsistencyReport, ExtractedFieldWithOptionalBox, Claim } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const staticDemoClaims: Partial<Claim>[] = [
  {
    id: 'demo_claim_high_risk',
    claimantName: 'Evelyn Reed (Demo)',
    policyNumber: 'POL-DEMO-001',
    incidentDate: '2024-07-10',
    status: 'Rejected',
    submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    fraudAssessment: {
      riskScore: 0.85,
      summary: 'High risk due to multiple inconsistent statements, unusual claim pattern, and prior history of similar disputed claims. Supporting documentation appears altered.',
      fraudIndicators: ['Inconsistent incident description with witness statements', 'Evidence of document tampering (metadata analysis)', 'Claimant address flagged in known fraud database', 'Unusually high claim amount for reported damage'],
    },
    extractedInfo: {
      policyNumber: { value: "POL-DEMO-001", boundingBox: { x: 0.1, y: 0.05, width: 0.2, height: 0.03, page: 1 } },
      claimantName: { value: "Evelyn Reed", boundingBox: { x: 0.1, y: 0.10, width: 0.3, height: 0.03, page: 1 } },
      disputedItemValue: { value: "$15,000", boundingBox: { x: 0.6, y: 0.45, width: 0.15, height: 0.04, page: 2 } },
      documentAnomalies: { value: "Possible font mismatch on page 3, section B.", boundingBox: null }
    },
    consistencyReport: {
      status: 'Inconsistent',
      summary: 'Major discrepancies found. Claimant details differ from policy records. Incident date mismatch with external event logs.',
      details: [
        { documentA: 'Submitted Claim Form', documentB: 'Policy Record', field: 'Claimant DOB', valueA: '1985-05-20', valueB: '1988-05-20', finding: 'Mismatch' },
        { documentA: 'Invoice Provided', documentB: 'Vendor Database', field: 'Vendor Legitimacy', valueA: 'ABC Repairs Inc.', valueB: 'No record found', finding: 'Missing in B' }
      ]
    }
  },
  {
    id: 'demo_claim_low_risk',
    claimantName: 'Arthur Boyle (Demo)',
    policyNumber: 'POL-DEMO-002',
    incidentDate: '2024-07-12',
    status: 'Approved',
    submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    fraudAssessment: {
      riskScore: 0.05,
      summary: 'Low risk. Standard claim for minor property damage. All details align with policy and provided evidence. No suspicious indicators.',
      fraudIndicators: ['None'],
    },
    extractedInfo: {
      policyNumber: { value: "POL-DEMO-002", boundingBox: { x: 0.12, y: 0.06, width: 0.18, height: 0.03, page: 1 } },
      damageType: { value: "Cracked window pane", boundingBox: { x: 0.1, y: 0.25, width: 0.4, height: 0.05, page: 1 } },
      repairEstimate: { value: "$250.00", boundingBox: { x: 0.7, y: 0.6, width: 0.12, height: 0.03, page: 1 } }
    },
    consistencyReport: {
      status: 'Consistent',
      summary: 'All key information (policy details, incident description, repair quote) is consistent across submitted documents and internal checks.',
      details: [
        { documentA: 'Damage Report', documentB: 'Repair Quote', field: 'Description of Damage', valueA: 'Cracked window', valueB: 'Window pane crack repair', finding: 'Match' }
      ]
    }
  }
];


export default function AdminReportsPage() {
  const { claims: liveClaims } = useAppContext();
  const { toast } = useToast();

  const claimsToDisplay = liveClaims.length > 0 ? liveClaims : staticDemoClaims;

  const handleLocateClick = (fieldName: string, box: any) => {
    if (box) {
      toast({
        title: "Entity Location (Conceptual)",
        description: `Field '${fieldName}' is at (x:${box.x.toFixed(2)}, y:${box.y.toFixed(2)}, w:${box.width.toFixed(2)}, h:${box.height.toFixed(2)}) on page ${box.page}. Visual highlighting on document TBD.`,
        duration: 5000,
      });
    } else {
       toast({
        title: "Entity Location",
        description: `Bounding box information not available for field '${fieldName}'.`,
        duration: 3000,
      });
    }
  };

  const renderExtractedInfo = (info: Record<string, ExtractedFieldWithOptionalBox> | undefined) => {
    if (!info || Object.keys(info).length === 0) {
      return <p className="text-sm text-muted-foreground italic">No information extracted or N/A.</p>;
    }
    return (
      <ul className="list-disc space-y-1 pl-4">
        {Object.entries(info).map(([key, fieldDetail]) => (
          <li key={key} className="text-sm">
            <div className="flex items-center">
              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
              {fieldDetail.boundingBox && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 h-5 w-5 p-0 text-primary hover:bg-primary/10"
                  title={`Locate ${key} on document`}
                  onClick={() => handleLocateClick(key, fieldDetail.boundingBox)}
                >
                  <LocateFixed className="h-4 w-4" />
                </Button>
              )}
            </div>
            {typeof fieldDetail.value === 'object' && fieldDetail.value !== null ? (
              <pre className="ml-2 mt-1 p-2 bg-muted/50 rounded-md text-xs whitespace-pre-wrap break-all">
                {JSON.stringify(fieldDetail.value, null, 2)}
              </pre>
            ) : (
              <span className="ml-1 text-muted-foreground">{String(fieldDetail.value)}</span>
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
      return { variant: 'destructive' as const, text: `High Risk (${riskScore.toFixed(2)})`, icon: <ShieldAlert className="h-4 w-4 mr-1" />, className: '' };
    }
    if (riskScore >= 0.4) {
      return { variant: 'secondary' as const, text: `Medium Risk (${riskScore.toFixed(2)})`, icon: <AlertTriangle className="h-4 w-4 mr-1" />, className: 'bg-yellow-500 text-white' };
    }
    return { variant: 'default' as const, text: `Low Risk (${riskScore.toFixed(2)})`, icon: <CheckCircle2 className="h-4 w-4 mr-1" />, className: 'bg-accent text-accent-foreground' };
  };

  const getConsistencyStatusIcon = (status?: ConsistencyReport['status']) => {
    switch (status) {
      case 'Consistent':
        return <CheckCircle2 className="h-5 w-5 text-accent" />;
      case 'Inconsistent':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'Partial':
        return <SearchCheck className="h-5 w-5 text-yellow-500" />;
      case 'Not Run':
      default:
        return <Files className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getConsistencyStatusBadgeVariant = (status?: ConsistencyReport['status']) => {
    switch (status) {
      case 'Consistent':
        return 'default';
      case 'Inconsistent':
        return 'destructive';
      case 'Partial':
        return 'secondary';
      case 'Not Run':
      default:
        return 'outline';
    }
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center"><Brain className="mr-2 h-7 w-7 text-primary" /> AI Reports Dashboard</CardTitle>
        <CardDescription>
          {liveClaims.length > 0 
            ? "Review AI-generated reports for submitted claims, including fraud assessments, document extractions, and consistency checks."
            : "Displaying static demo reports. Submit a new claim to see live AI analysis."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {claimsToDisplay.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-2" defaultValue={liveClaims.length === 0 ? staticDemoClaims.map(c=>c.id!) : undefined}>
            {claimsToDisplay.map((claim) => {
              const riskInfo = getRiskBadgeContent(claim.fraudAssessment?.riskScore);
              return (
                <AccordionItem value={claim.id!} key={claim.id!} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-card">
                  <AccordionTrigger className="p-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-base text-primary">Claim ID: {claim.id!.substring(0, 12)}...</span>
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
                    <div className="border-t pt-4 grid md:grid-cols-3 gap-6">
                      <Card className="bg-background/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-primary" /> Fraud Assessment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {claim.fraudAssessment ? (
                            <>
                              <p><span className="font-medium">Risk Score:</span> <span className="font-bold">{claim.fraudAssessment.riskScore.toFixed(2)}</span></p>
                              <p><span className="font-medium">Summary:</span></p>
                              <p className="text-muted-foreground bg-muted/30 p-2 rounded-md whitespace-pre-wrap">{claim.fraudAssessment.summary || "N/A"}</p>
                              {claim.fraudAssessment.fraudIndicators && claim.fraudAssessment.fraudIndicators.length > 0 && claim.fraudAssessment.fraudIndicators[0] !== "None" && (
                                <div>
                                  <p className="font-medium">Indicators:</p>
                                  <ul className="list-disc list-inside text-muted-foreground pl-4">
                                    {claim.fraudAssessment.fraudIndicators.map((ind, i) => <li key={i}>{ind}</li>)}
                                  </ul>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="italic text-muted-foreground">No fraud assessment data available.</p>
                          )}
                        </CardContent>
                      </Card>
                      <Card className="bg-background/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Extracted Info</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {renderExtractedInfo(claim.extractedInfo)}
                        </CardContent>
                      </Card>
                       <Card className="bg-background/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center">
                            {getConsistencyStatusIcon(claim.consistencyReport?.status)}
                            <span className="ml-2">Consistency Check</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {claim.consistencyReport ? (
                            <>
                              <Badge variant={getConsistencyStatusBadgeVariant(claim.consistencyReport.status)} 
                                     className={claim.consistencyReport.status === 'Consistent' ? 'bg-accent text-accent-foreground' : claim.consistencyReport.status === 'Partial' ? 'bg-yellow-500 text-white' : ''}>
                                {claim.consistencyReport.status}
                              </Badge>
                              <p><span className="font-medium">Summary:</span></p>
                              <p className="text-muted-foreground bg-muted/30 p-2 rounded-md whitespace-pre-wrap">{claim.consistencyReport.summary || "N/A"}</p>
                              {claim.consistencyReport.details && claim.consistencyReport.details.length > 0 && (
                                <div>
                                  <p className="font-medium">Discrepancy Details:</p>
                                  <ul className="list-disc list-inside text-muted-foreground pl-4 space-y-1">
                                    {claim.consistencyReport.details.map((detail, i) => (
                                      <li key={i}>
                                        <strong>{detail.field}:</strong> Between "{detail.documentA}" (value: <em>{detail.valueA}</em>) and "{detail.documentB}" (value: <em>{detail.valueB}</em>) - <span className={detail.finding === 'Mismatch' ? 'text-destructive font-semibold' : ''}>{detail.finding}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="italic text-muted-foreground">No consistency report available.</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                     { liveClaims.length === 0 && claim.id?.startsWith('demo_') && (
                        <p className="mt-4 text-xs text-center text-muted-foreground italic">
                          This is a static demo report. Submit claims to see live AI analysis.
                        </p>
                      )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
           // This case should ideally not be hit if staticDemoClaims is always populated when liveClaims is empty.
           // Keeping a fallback just in case.
          <div className="flex flex-col items-center justify-center text-center py-12">
            <Image src="https://placehold.co/400x250.png" alt="No AI Reports to Display Yet" width={300} height={188} data-ai-hint="empty state document list" className="mb-6 rounded-lg" />
            <h3 className="text-xl font-semibold text-foreground mb-3">No AI Reports to Display Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              As claims are submitted and processed by our AI, their detailed reports will populate this dashboard. Submit a new claim to see the insights!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

