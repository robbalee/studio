
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, FileText, Brain, Smartphone } from 'lucide-react';
import Image from 'next/image';

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
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col items-center text-center">
        <h2 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-6">
          ClaimIntel: Effortless Claims for Policyholders, Powerful Insights for Insurers.
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-10">
          Experience a simpler, faster way to file and manage your insurance claims. For insurers, ClaimIntel offers cutting-edge AI to streamline operations, detect fraud, and enhance decision-making. We're transforming the claims journey for everyone.
        </p>
        <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl w-full mb-12">
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
            <Image 
              src="https://placehold.co/600x400.png" 
              alt="ClaimIntel Dashboard Preview" 
              layout="fill"
              objectFit="cover"
              data-ai-hint="insurance dashboard"
            />
          </div>
          <div className="flex flex-col gap-6 text-left">
            <FeatureItem
              icon={<Smartphone className="text-primary h-7 w-7" />}
              title="Simple & Fast Claims for Policyholders"
              description="File claims effortlessly, upload documents and media, and track progress with our user-friendly platform. Get quicker resolutions and stay informed every step of the way."
            />
            <FeatureItem
              icon={<FileText className="text-primary h-7 w-7" />}
              title="Streamlined Operations for Insurers"
              description="Automate document processing, extract key information instantly, and reduce manual workloads with our AI-powered tools, leading to faster cycle times."
            />
            <FeatureItem
              icon={<ShieldCheck className="text-primary h-7 w-7" />}
              title="Intelligent Fraud Detection & Decision Support"
              description="Leverage advanced AI to identify potential fraud, assess risk accurately, and provide your team with actionable insights for confident decision-making."
            />
          </div>
        </div>
        <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
          <Link href="/dashboard">Get Started</Link>
        </Button>
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
