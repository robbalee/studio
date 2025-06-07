
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, FileText, Brain, Smartphone, ShieldOff, Zap, CheckCircle2, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export default function WelcomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-primary/10">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-10 w-10" />
          <h1 className="text-3xl font-bold font-headline">ClaimIntel</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/admin">
              <Brain className="mr-2 h-4 w-4" />
              AI Reports
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col items-center text-center">
        <h2 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-6 max-w-2xl">
          Effortless Claims, <br className="hidden md:block" /> Powerful Insights
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-10">
          A simpler, intelligent way to fill your insurance claims. We're transforming the claims journey for our users.
        </p>
        <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl w-full mb-12">
          <div className="relative aspect-[4/3] md:aspect-video rounded-lg overflow-hidden shadow-2xl group">
            <Image
              src="https://storage.googleapis.com/generative-ai-for-developers/images/insurance_claim_illustration.png"
              alt="ClaimIntel in action"
              layout="fill"
              objectFit="cover"
              className="group-hover:scale-105 transition-transform duration-300"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>
          <div className="flex flex-col gap-6 text-left">
            <FeatureItem
              icon={<Smartphone className="text-primary h-7 w-7" />}
              title="Easy Claims for You"
              description="File and track claims simply. Upload files, get updates, and resolve faster."
            />
            <FeatureItem
              icon={<FileText className="text-primary h-7 w-7" />}
              title="Smarter Insurer Operations"
              description="Automate document intake and data extraction with AI. Boost efficiency."
            />
            <FeatureItem
              icon={<ShieldCheck className="text-primary h-7 w-7" />}
              title="AI-Powered Fraud Detection"
              description="Identify risks accurately with advanced AI. Make confident decisions."
            />
          </div>
        </div>
        <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow mb-16 md:mb-24">
          <Link href="/dashboard">Get Started</Link>
        </Button>

        {/* Impactful Results Section */}
        <section className="w-full max-w-5xl mb-16 md:mb-24">
          <h3 className="text-3xl font-bold font-headline text-foreground mb-10">Impactful Results with ClaimIntel</h3>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <ImpactStatCard
              icon={<ShieldOff className="h-10 w-10 text-primary" />}
              value="Up to 80%"
              title="Reduction in Fraudulent Spending"
              description="Our advanced AI identifies and flags suspicious claims with high accuracy, safeguarding insurer resources."
            />
            <ImpactStatCard
              icon={<Zap className="h-10 w-10 text-primary" />}
              value="2 Days Average"
              title="Claim Resolution Time"
              description="Streamline your processes from 14 days to just 2, significantly improving operational efficiency and customer satisfaction."
            />
          </div>
        </section>

        {/* AI-Powered Insights Section */}
        <section className="w-full max-w-5xl mb-12 md:mb-20">
          <h3 className="text-3xl font-bold font-headline text-foreground mb-10">AI-Powered Insights in Action</h3>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-start">
            <Card className="shadow-xl hover:shadow-2xl transition-shadow text-left bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Brain className="mr-2 h-6 w-6 text-primary" />
                  Sample AI Analysis Report
                </CardTitle>
                <CardDescription>Illustrating clarity and actionable intelligence.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p><span className="font-semibold text-foreground/90">Claim ID:</span> <span className="text-muted-foreground">CL-98765B</span></p>
                <div className="flex items-center">
                  <span className="font-semibold text-foreground/90 mr-2">Fraud Risk:</span>
                  <span className="text-accent font-bold flex items-center">
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Low (0.08)
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground/90 mb-1">Key Extracted Insights:</p>
                  <ul className="list-disc list-inside pl-4 text-muted-foreground space-y-0.5">
                    <li>Policy status: Active & Verified</li>
                    <li>Incident date: Consistent with report</li>
                    <li>Damage description: Aligns with uploaded media</li>
                    <li>Prior claim history: None relevant</li>
                  </ul>
                </div>
                <p className="italic text-muted-foreground/80">"Summary: Minimal risk indicators. Information is consistent across provided documents and claim history. Standard checks passed."</p>
              </CardContent>
              <CardFooter>
                <p className="text-sm font-semibold text-primary">Recommendation: Expedite for Approval</p>
              </CardFooter>
            </Card>

            <div className="flex flex-col items-center text-left">
               <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-xl group mb-4">
                <Image
                  src="https://placehold.co/500x281.png" /* 16:9 aspect ratio */
                  alt="AI processing illustration"
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="data analytics dashboard"
                  className="group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <h4 className="text-lg font-semibold text-foreground mt-2">Unlock Actionable Intelligence</h4>
              <p className="text-muted-foreground text-sm">
                ClaimIntel transforms complex data into clear, actionable insights, empowering faster, more accurate decision-making for claims handlers.
              </p>
            </div>
          </div>
        </section>

      </main>

      <footer className="text-center py-8 text-muted-foreground text-sm border-t border-border">
        <p>&copy; {new Date().getFullYear()} ClaimIntel. All rights reserved.</p>
      </footer>
    </div>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-4 p-4 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

interface ImpactStatCardProps {
  icon: React.ReactNode;
  value: string;
  title: string;
  description: string;
}

function ImpactStatCard({ icon, value, title, description }: ImpactStatCardProps) {
  return (
    <Card className="text-left shadow-lg hover:shadow-xl transition-shadow bg-card/70 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold text-primary">{value}</p>
          <CardTitle className="text-xl mt-1">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
