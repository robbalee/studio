
"use client";

import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { AlertTriangle, FileText, Brain, CheckCircle2, ClipboardCheck, Files, SearchCheck, LocateFixed } from 'lucide-react';
import type { ConsistencyReport, ExtractedFieldWithOptionalBox } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


export default function AdminReportsPage() {
  const { claims } = useAppContext();
  const { toast } = useToast();

  const handleLocateClick = (fieldName: string, box: any) => {
    if (box) {
      toast({
        title: "Entity Location (Conceptual)",
        description: `Field '${fieldName}' is at (x:${box.x.toFixed(2)}, y:${box.y.toFixed(2)}, w:${box.width.toFixed(2)}, h:${box.height.toFixed(2)}) on page ${box.page}. Visual highlighting on document TBD.`,
        duration: 5000,
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
      return { variant: 'destructive' as const, text: `High Risk (${riskScore.toFixed(2)})`, icon: <AlertTriangle className="h-4 w-4 mr-1" />, className: '' };
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
        <CardDescription>Review AI-generated reports for submitted claims, including fraud assessments, document extractions, and consistency checks.</CardDescription>
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
                    <div className="border-t pt-4 grid md:grid-cols-3 gap-6"> {/* Changed to 3 columns */}
                      <Card className="bg-background/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-primary" /> Fraud Assessment</CardTitle>
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
                              <p className="text-muted-foreground bg-muted/30 p-2 rounded-md">{claim.consistencyReport.summary || "N/A"}</p>
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
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
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

