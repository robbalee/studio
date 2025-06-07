
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
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col items-center text-center">
        <h2 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-6 max-w-2xl">
          Effortless Claims, <br className="hidden md:block" /> Powerful Insights
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-10">
          A simpler, intelligent way to fill your insurance claims. We're transforming the claims journey for our users.
        </p>
        <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl w-full mb-12">
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
            <Image 
              src="https://placehold.co/600x400.png" 
              alt="ClaimIntel in action" 
              layout="fill"
              objectFit="cover"
              data-ai-hint="AI claims"
            />
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
