"use client";

import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PlusCircle, Eye, Edit3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';

export default function AllClaimsPage() {
  const { claims } = useAppContext();

  const getStatusBadgeVariant = (status: string, riskScore?: number) => {
    if (riskScore && riskScore >= 0.7) return 'destructive';
    switch (status) {
      case 'Approved':
        return 'default'; // Will use accent color via className
      case 'Rejected':
        return 'destructive';
      case 'Pending':
      case 'Under Review':
      case 'Information Requested':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  const getStatusIcon = (status: string, riskScore?: number) => {
    if (riskScore && riskScore >= 0.7) return <AlertTriangle className="h-4 w-4 text-destructive inline-block mr-1" />;
    if (status === 'Approved') return <CheckCircle2 className="h-4 w-4 text-accent inline-block mr-1" />;
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">All Insurance Claims</CardTitle>
          <CardDescription>Manage and review all submitted claims.</CardDescription>
        </div>
        <Button asChild>
          <Link href="/claims/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Submit New Claim
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {claims.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Claimant</TableHead>
                  <TableHead>Policy No.</TableHead>
                  <TableHead>Incident Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.id.substring(0,12)}...</TableCell>
                    <TableCell>{claim.claimantName}</TableCell>
                    <TableCell>{claim.policyNumber}</TableCell>
                    <TableCell>{format(parseISO(claim.incidentDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusBadgeVariant(claim.status, claim.fraudAssessment?.riskScore)}
                        className={claim.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}
                       >
                        {getStatusIcon(claim.status, claim.fraudAssessment?.riskScore)}
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {claim.fraudAssessment ? (
                        <Badge variant={claim.fraudAssessment.riskScore >= 0.7 ? 'destructive' : claim.fraudAssessment.riskScore >= 0.4 ? 'secondary' : 'default'}
                         className={claim.fraudAssessment.riskScore < 0.4 ? 'bg-accent text-accent-foreground' : claim.fraudAssessment.riskScore >= 0.4 && claim.fraudAssessment.riskScore < 0.7 ? 'bg-yellow-500 text-white' : ''}
                        >
                          {claim.fraudAssessment.riskScore.toFixed(2)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(parseISO(claim.submissionDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="View Claim">
                        <Link href={`/claims/${claim.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {/* Potentially an Edit button if applicable */}
                      {/* <Button variant="ghost" size="icon" asChild title="Edit Claim">
                        <Link href={`/claims/${claim.id}/edit`}> <Edit3 className="h-4 w-4" /> </Link>
                      </Button> */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <Image src="https://placehold.co/400x250.png" alt="No claims submitted" width={300} height={188} data-ai-hint="empty state document list" className="mb-6 rounded-lg" />
              <h3 className="text-2xl font-semibold text-foreground mb-3">No Claims Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                It looks like there are no claims submitted yet. Get started by submitting a new claim.
              </p>
              <Button asChild size="lg">
                <Link href="/claims/new">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Submit Your First Claim
                </Link>
              </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
