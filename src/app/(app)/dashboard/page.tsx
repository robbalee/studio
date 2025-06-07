
"use client";

import { StatCard } from '@/components/dashboard/StatCard';
import { useAppContext } from '@/contexts/AppContext';
import { CheckCircle2, AlertTriangle, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from "recharts"


export default function DashboardPage() {
  const { claims } = useAppContext();

  const totalClaims = claims.length;
  const approvedClaims = claims.filter(c => c.status === 'Approved').length;
  const pendingClaims = claims.filter(c => c.status === 'Pending' || c.status === 'Under Review').length;
  const highRiskClaims = claims.filter(c => c.fraudAssessment && c.fraudAssessment.riskScore >= 0.7).length;

  const recentClaims = claims.slice(0, 5);

  const chartData = [
    { status: "Pending", count: pendingClaims, fill: "var(--color-pending)" },
    { status: "Approved", count: approvedClaims, fill: "var(--color-approved)" },
    { status: "High Risk", count: highRiskClaims, fill: "var(--color-highRisk)" },
  ];

  const chartConfig = {
    count: {
      label: "Claims",
    },
    pending: {
      label: "Pending",
      color: "hsl(var(--muted-foreground))",
    },
    approved: {
      label: "Approved",
      color: "hsl(var(--accent))",
    },
    highRisk: {
      label: "High Risk",
      color: "hsl(var(--destructive))",
    },
  }


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Claims" value={totalClaims} icon={FileText} description="All submitted claims" />
        <StatCard title="Approved Claims" value={approvedClaims} icon={CheckCircle2} description="Successfully processed" className="[&_svg]:text-accent" />
        <StatCard title="Pending Review" value={pendingClaims} icon={Clock} description="Awaiting action" />
        <StatCard title="High Risk" value={highRiskClaims} icon={AlertTriangle} description="Flagged for fraud" className="[&_svg]:text-destructive" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Claims Overview</CardTitle>
            <CardDescription>A summary of claim statuses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] p-2">
             <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    content={<ChartTooltipContent hideLabel />}
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                  />
                  <Legend content={<ChartLegendContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Recent Claims</CardTitle>
            <CardDescription>Top 5 most recently submitted claims.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            {recentClaims.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Claimant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentClaims.map(claim => (
                    <TableRow key={claim.id}>
                      <TableCell>
                        <Link href={`/claims/${claim.id}`} className="font-medium text-primary hover:underline">
                          {claim.id.substring(0,12)}...
                        </Link>
                      </TableCell>
                      <TableCell>{claim.claimantName}</TableCell>
                      <TableCell>
                        <Badge variant={
                          claim.status === 'Approved' ? 'default' : 
                          claim.status === 'Rejected' ? 'destructive' : 
                          'secondary'
                        } className={claim.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}>
                          {claim.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{format(parseISO(claim.submissionDate), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Image src="https://placehold.co/300x200.png" alt="No claims" width={200} height={133} data-ai-hint="empty state document" className="mb-4 rounded-md" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Recent Claims</h3>
                  <p className="text-muted-foreground mb-4">When new claims are submitted, they will appear here.</p>
                  <Button asChild>
                    <Link href="/claims/new">Submit a New Claim</Link>
                  </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
