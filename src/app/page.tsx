
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, FileText, Brain, Smartphone, ShieldOff, Zap, CheckCircle2, Quote, Star, Car, Camera, Video, FileUp, BrainCircuit, ArrowRight, BrainCog, SearchCheck, Sparkles } from 'lucide-react';
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

        {/* How It Works Section */}
        <section className="w-full max-w-6xl mb-16 md:mb-24">
          <h3 className="text-3xl font-bold font-headline text-foreground mb-12 text-center">
            From Incident to Insight: Your ClaimIntel Journey
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-start">
            <HowItWorksStepCard
              stepNumber="1"
              icon={<Smartphone className="h-10 w-10 text-primary mb-3" />}
              title="Report Your Incident"
              description="After a car accident, access ClaimIntel easily from your phone. Our guided process makes starting a claim simple."
            />
            <HowItWorksStepCard
              stepNumber="2"
              icon={<div className="flex justify-center items-center gap-2 mb-3"><Camera className="h-8 w-8 text-primary" /><Video className="h-8 w-8 text-primary" /><FileUp className="h-8 w-8 text-primary" /></div>}
              title="Add Details & Media"
              description="Describe what happened and effortlessly upload photos, dashcam footage, and relevant documents."
            />
            <HowItWorksStepCard
              stepNumber="3"
              icon={<div className="flex flex-col items-center mb-3"><div className="flex items-center"><ShieldCheck className="h-8 w-8 text-green-500 mr-1" /> <ArrowRight className="h-7 w-7 text-muted-foreground mx-1" /> <BrainCircuit className="h-10 w-10 text-primary" /></div></div>}
              title="Data Flies to ClaimIntel AI"
              description="Your information is securely transmitted to our intelligent platform, ready for AI analysis."
            />
            <HowItWorksStepCard
              stepNumber="4"
              icon={<BrainCog className="h-10 w-10 text-primary mb-3" />}
              title="Intelligent Processing"
              description="Our AI verifies details, cross-references info, assesses the situation, and identifies key insights or fraud indicators."
            />
            <HowItWorksStepCard
              stepNumber="5"
              icon={<div className="flex justify-center items-center gap-2 mb-3"><Sparkles className="h-10 w-10 text-yellow-400" /> <CheckCircle2 className="h-10 w-10 text-green-500" /></div>}
              title="Insights & Faster Resolution"
              description="ClaimIntel delivers clear insights to insurers, speeding up decisions. You get faster updates and resolution."
            />
          </div>
        </section>

        {/* AI-Powered Insights Section */}
        <section className="w-full max-w-5xl mb-16 md:mb-24">
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
                  src="https://placehold.co/500x281.png"
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

        {/* Customer Success Stories Section */}
        <section className="w-full max-w-5xl py-12 md:py-16">
          <h3 className="text-3xl font-bold font-headline text-foreground mb-12 text-center">
            Real Stories, Real Relief
          </h3>
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
            <SuccessStoryCard
              quote="I couldn't believe how fast my claim was processed! What used to take weeks was sorted in days."
              story="After a minor car accident, Sarah was dreading the usual lengthy claims process. With ClaimIntel, she submitted her documents and photos from her phone in minutes. Her claim was reviewed and approved within 48 hours."
              name="Sarah M."
              imageSrc="https://placehold.co/80x80.png"
              imageHint="happy person"
            />
            <SuccessStoryCard
              quote="ClaimIntel made submitting my water damage claim so straightforward. No confusing forms, just a simple process."
              story="When a pipe burst in David's kitchen, he was overwhelmed. ClaimIntel's guided submission process helped him upload all necessary information, including videos of the damage, leading to a quick assessment and approval for repairs."
              name="David K."
              imageSrc="https://placehold.co/80x80.png"
              imageHint="satisfied customer"
            />
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

interface HowItWorksStepCardProps {
  stepNumber: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function HowItWorksStepCard({ stepNumber, icon, title, description }: HowItWorksStepCardProps) {
  return (
    <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow bg-card/70 backdrop-blur-sm flex flex-col items-center h-full">
      <div className="relative mb-2">
        <div className="absolute -top-3 -left-3 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold">
          {stepNumber}
        </div>
        {icon}
      </div>
      <CardTitle className="text-lg font-semibold mb-2 mt-2">{title}</CardTitle>
      <CardDescription className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </CardDescription>
    </Card>
  );
}


interface SuccessStoryCardProps {
  quote: string;
  story: string;
  name: string;
  imageSrc: string;
  imageHint: string;
}

function SuccessStoryCard({ quote, story, name, imageSrc, imageHint }: SuccessStoryCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow bg-card/70 backdrop-blur-sm text-left">
      <CardHeader className="pb-3">
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          ))}
        </div>
        <blockquote className="text-lg font-semibold leading-snug text-foreground">
          <Quote className="inline-block h-5 w-5 text-primary/70 mr-1 -mt-1" />
          {quote}
        </blockquote>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{story}</p>
        <div className="flex items-center gap-3 pt-2">
          <Image
            src={imageSrc}
            alt={name}
            width={40}
            height={40}
            data-ai-hint={imageHint}
            className="rounded-full"
          />
          <p className="text-sm font-semibold text-foreground">{name}</p>
        </div>
      </CardContent>
    </Card>
  );
}

