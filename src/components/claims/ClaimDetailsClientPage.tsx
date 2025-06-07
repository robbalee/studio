
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import type { Claim, ClaimStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Clock, FileText, Loader2, MessageSquare, ShieldAlert, UserCircle, Info, Image as ImageIcon, Video as VideoIcon, HelpCircle, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import NextImage from 'next/image'; 

const claimStatuses: ClaimStatus[] = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Information Requested'];

export function ClaimDetailsClientPage() {
  const params = useParams();
  const router = useRouter();
  const { getClaimById, updateClaimStatus, isLoading: isContextLoading, askQuestionOnDocument, qaAnswer, isAskingQuestion, clearQaAnswer } = useAppContext();
  const { toast } = useToast();

  const [claim, setClaim] = useState<Claim | null | undefined>(undefined); 
  const [selectedStatus, setSelectedStatus] = useState<ClaimStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [questionText, setQuestionText] = useState('');

  const claimId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (claimId) {
      const foundClaim = getClaimById(claimId);
      setClaim(foundClaim);
      if (foundClaim) {
        setSelectedStatus(foundClaim.status);
        setNotes(foundClaim.notes || '');
        clearQaAnswer(); // Clear previous Q&A answer when navigating to a new claim
      }
    }
     return () => { // Cleanup on unmount
      clearQaAnswer();
    };
  }, [claimId, getClaimById, clearQaAnswer]);

  const handleStatusUpdate = () => {
    if (claim && selectedStatus) {
      setIsUpdating(true);
      updateClaimStatus(claim.id, selectedStatus, notes);
      toast({
        title: "Claim Status Updated",
        description: `Claim ${claim.id} status set to ${selectedStatus}.`,
        className: "bg-accent text-accent-foreground",
      });
      const updatedClaim = getClaimById(claim.id);
      setClaim(updatedClaim);
      setIsUpdating(false);
    }
  };

  const handleAskQuestion = async () => {
    if (claim && claim.documentUri && questionText.trim()) {
      await askQuestionOnDocument(claim.documentUri, questionText.trim(), claim.id);
      setQuestionText(''); // Clear input after asking
    } else if (!claim?.documentUri) {
       toast({ title: "No Document", description: "This claim does not have a document to ask questions about.", variant: "destructive" });
    } else {
       toast({ title: "Empty Question", description: "Please type a question.", variant: "destructive" });
    }
  };


  if (claim === undefined || isContextLoading && !isAskingQuestion) { // Don't show main loader if only Q&A is loading
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading claim details...</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <Card className="text-center p-8">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-destructive">Claim Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">The claim ID <code className="bg-muted px-1 rounded">{claimId}</code> could not be found. It may have been deleted or the ID is incorrect.</p>
          <Button asChild>
            <Link href="/claims">Go to All Claims</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const riskScore = claim.fraudAssessment?.riskScore;
  let riskBadgeVariant: "default" | "destructive" | "secondary" = "default";
  let riskBadgeText = "Low";
  let riskIcon = <CheckCircle2 className="h-4 w-4 mr-1 text-accent" />;

  if (riskScore !== undefined) {
    if (riskScore >= 0.7) {
      riskBadgeVariant = "destructive";
      riskBadgeText = "High";
      riskIcon = <ShieldAlert className="h-4 w-4 mr-1 text-destructive" />;
    } else if (riskScore >= 0.4) {
      riskBadgeVariant = "secondary"; 
      riskBadgeText = "Medium";
      riskIcon = <AlertCircle className="h-4 w-4 mr-1 text-yellow-500" />;
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-headline">Claim Details: {claim.id.substring(0,12)}...</CardTitle>
              <CardDescription>Submitted on: {format(parseISO(claim.submissionDate), 'MMMM d, yyyy, h:mm a')}</CardDescription>
            </div>
            <Badge variant={
              claim.status === 'Approved' ? 'default' : 
              claim.status === 'Rejected' ? 'destructive' : 
              'secondary'
            } className={`text-lg px-4 py-2 ${claim.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}`}>
              {claim.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4 lg:col-span-1">
            <InfoItem icon={UserCircle} label="Claimant Name" value={claim.claimantName} />
            <InfoItem icon={FileText} label="Policy Number" value={claim.policyNumber} />
            <InfoItem icon={Clock} label="Incident Date" value={format(parseISO(claim.incidentDate), 'MMMM d, yyyy')} />
            <InfoItem icon={MessageSquare} label="Incident Description" value={claim.incidentDescription} isLongText />
            {claim.documentName && (
              <InfoItem icon={FileText} label="Supporting Document">
                {claim.documentUri && !claim.documentUri.startsWith('https://placehold.co') && !claim.documentUri.startsWith('data:text/plain') ? (
                  <a href={claim.documentUri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {claim.documentName}
                  </a>
                ) : (
                  <span>{claim.documentName} (Preview not available for placeholders or direct link)</span>
                )}
              </InfoItem>
            )}
          </div>

          <div className="space-y-4 lg:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-primary" /> Fraud Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {claim.fraudAssessment ? (
                  <>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Risk Score:</span>
                      <Badge variant={riskBadgeVariant} className={riskBadgeVariant === 'secondary' ? 'bg-yellow-500 text-white' : ''}>
                        {riskIcon}
                        {riskBadgeText} ({riskScore?.toFixed(2)})
                      </Badge>
                    </div>
                    <p><span className="font-medium">Summary:</span> {claim.fraudAssessment.summary}</p>
                    {claim.fraudAssessment.fraudIndicators.length > 0 && (
                      <div>
                        <p className="font-medium">Indicators:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {claim.fraudAssessment.fraudIndicators.map((ind, i) => <li key={i}>{ind}</li>)}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground italic">No fraud assessment data available.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" /> Extracted Information</CardTitle>
              </CardHeader>
              <CardContent>
                {claim.extractedInfo && Object.keys(claim.extractedInfo).length > 0 ? (
                   <ul className="space-y-1 text-sm max-h-60 overflow-y-auto">
                    {Object.entries(claim.extractedInfo).map(([key, fieldDetail]) => (
                      <li key={key}>
                        <div className="flex items-center">
                           <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
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
                ) : (
                  <p className="text-muted-foreground italic">No information extracted from documents or not applicable.</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4 lg:col-span-1">
             <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><ImageIcon className="mr-2 h-5 w-5 text-primary" /> Uploaded Images</CardTitle>
              </CardHeader>
              <CardContent>
                {claim.imageUris && claim.imageUris.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {claim.imageUris.map((uri, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                        <NextImage
                          src={uri}
                          alt={claim.imageNames?.[index] || `Uploaded Image ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                          onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100.png?text=Error')}
                        />
                         {claim.imageNames?.[index] && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate" title={claim.imageNames?.[index]}>
                                {claim.imageNames?.[index]}
                            </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No images uploaded for this claim.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><VideoIcon className="mr-2 h-5 w-5 text-primary" /> Uploaded Video</CardTitle>
              </CardHeader>
              <CardContent>
                {claim.videoUri ? (
                  <div className="space-y-2">
                    {claim.videoUri.startsWith('data:video') ? (
                       <video controls src={claim.videoUri} className="w-full rounded-md border aspect-video">
                          Your browser does not support the video tag.
                       </video>
                    ) : (
                      <a href={claim.videoUri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                        {claim.videoName || 'View Video'} (External Link or Placeholder)
                      </a>
                    )}
                     {claim.videoName && <p className="text-sm text-muted-foreground">{claim.videoName}</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No video uploaded for this claim.</p>
                )}
              </CardContent>
            </Card>
          </div>

        </CardContent>
      </Card>

      {claim.documentUri && !claim.documentUri.startsWith('https://placehold.co') && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><HelpCircle className="mr-2 h-6 w-6 text-primary" /> Q&amp;A on Document</CardTitle>
            <CardDescription>Ask questions about the content of the uploaded supporting document ({claim.documentName || 'Document'}).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g., What is the policy number mentioned?"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAskingQuestion && handleAskQuestion()}
                disabled={isAskingQuestion}
                className="flex-grow"
              />
              <Button onClick={handleAskQuestion} disabled={isAskingQuestion || !questionText.trim()}>
                {isAskingQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Ask AI
              </Button>
            </div>
            {isAskingQuestion && !qaAnswer && (
              <div className="flex items-center text-muted-foreground p-4 border rounded-md bg-muted/30">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI is thinking...
              </div>
            )}
            {qaAnswer && (
              <div className="p-4 border rounded-md bg-card space-y-2">
                <p className="font-semibold text-primary">AI's Answer:</p>
                <p className="text-sm whitespace-pre-wrap">{qaAnswer}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Update Claim Status</CardTitle>
          <CardDescription>Change the status of this claim and add internal notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="claimStatus">New Status</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ClaimStatus)}>
              <SelectTrigger id="claimStatus">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {claimStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="internalNotes">Internal Notes</Label>
            <Textarea
              id="internalNotes"
              placeholder="Add any relevant notes for this claim update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStatusUpdate} disabled={!selectedStatus || isUpdating || isContextLoading}>
            {isUpdating || isContextLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update Status
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value?: string | React.ReactNode;
  children?: React.ReactNode;
  isLongText?: boolean;
}

function InfoItem({ icon: Icon, label, value, children, isLongText = false }: InfoItemProps) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</p>
      {value && (isLongText ? <p className="text-md whitespace-pre-wrap break-words">{value}</p> : <p className="text-md font-semibold">{value}</p>)}
      {children && <div className="text-md font-semibold">{children}</div>}
    </div>
  );
}

