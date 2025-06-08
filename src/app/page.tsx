
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Smartphone, Zap, CheckCircle2, Quote, Star, Car, Camera, Video, FileUp, BrainCircuit, ArrowRight, BrainCog, SearchCheck, Sparkles, User, Users, Home, PlaneTakeoff, Edit, ShieldX } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

const insuranceSolutions = [
  {
    icon: <Car className="h-12 w-12 text-primary mb-4" />,
    title: "Car Insurance Claims",
    description: "Accident? Damage? File your auto claim quickly and get back on the road faster.",
    link: "/claims/new",
    cta: "File Car Claim"
  },
  {
    icon: <Home className="h-12 w-12 text-primary mb-4" />,
    title: "Home Insurance Claims",
    description: "Property damage? We help you file claims for repairs and replacements efficiently.",
    link: "/claims/new",
    cta: "File Home Claim"
  },
  {
    icon: <PlaneTakeoff className="h-12 w-12 text-primary mb-4" />,
    title: "Travel Insurance Claims",
    description: "Lost baggage? Medical emergency abroad? Submit your travel claims with ease.",
    link: "/claims/new",
    cta: "File Travel Claim"
  },
  {
    icon: <Smartphone className="h-12 w-12 text-primary mb-4" />,
    title: "Gadget Insurance Claims",
    description: "Broken phone? Damaged laptop? File your gadget protection claims hassle-free.",
    link: "/claims/new",
    cta: "File Gadget Claim"
  }
];

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
              <BrainCog className="mr-2 h-4 w-4" />
              Admin Portal
            </Link>
          </Button>
          <Button asChild>
            <Link href="/claims">
              <User className="mr-2 h-4 w-4" />
              My Claims
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col items-center text-center">
        <h2 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-6 max-w-2xl">
          Effortless Claims, <br className="hidden md:block" /> Powerful Insights
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-10">
          A simpler, intelligent way to file your insurance claims. We're transforming the claims journey.
        </p>

        <section className="w-full max-w-4xl mb-12 md:mb-16">
          <h3 className="text-3xl font-bold font-headline text-foreground mb-10">Explore Our Insurance Solutions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {insuranceSolutions.map((solution) => (
              <Card key={solution.title} className="shadow-lg hover:shadow-xl transition-shadow text-center bg-card/70 backdrop-blur-sm flex flex-col">
                <CardHeader className="items-center">
                  {solution.icon}
                  <CardTitle className="text-xl">{solution.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground text-sm">{solution.description}</p>
                </CardContent>
                <CardFooter className="flex-col items-center">
                  <Button asChild className="w-full max-w-xs">
                    <Link href={solution.link}>
                      <Edit className="mr-2 h-4 w-4" />
                      {solution.cta}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Redundant CTA buttons removed from here */}

        {/* Impactful Results Section */}
        <section className="w-full max-w-5xl mb-16 md:mb-24 mt-8"> {/* Added mt-8 for spacing after removing CTAs */}
          <h3 className="text-3xl font-bold font-headline text-foreground mb-10">Impactful Results with ClaimIntel</h3>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <ImpactStatCard
              icon={<ShieldX className="h-10 w-10 text-primary" />}
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
        <section className="w-full max-w-3xl mb-16 md:mb-24">
          <h3 className="text-3xl font-bold font-headline text-foreground mb-10">AI-Powered Insights in Action</h3>
          <div className="flex justify-center">
            <Card className="shadow-xl hover:shadow-2xl transition-shadow text-left bg-card/80 backdrop-blur-sm w-full">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <BrainCog className="mr-3 h-7 w-7 text-primary" />
                  Automated Claim Analysis Report
                </CardTitle>
                <CardDescription>Illustrating clarity and actionable intelligence provided by ClaimIntel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p><span className="font-semibold text-foreground/90">Claim ID:</span> <span className="text-muted-foreground">CL-98765B</span></p>
                
                <div className="p-3 rounded-md bg-background/50 border">
                  <h4 className="font-semibold text-foreground/90 mb-1">Fraud Risk Assessment:</h4>
                  <div className="flex items-center mb-1">
                    <span className="font-medium text-foreground/80 mr-2">Overall Risk:</span>
                    <span className="text-accent font-bold flex items-center">
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Low (0.08)
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs italic">Summary: Minimal risk indicators detected. Information appears consistent across provided documents and claim history. Standard verification checks passed.</p>
                  <p className="font-medium text-foreground/80 mt-2 mb-0.5 text-xs">Fraud Indicators (if any):</p>
                  <ul className="list-disc list-inside pl-4 text-muted-foreground text-xs space-y-0.5">
                    <li>None significant.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-md bg-background/50 border">
                  <h4 className="font-semibold text-foreground/90 mb-1">Key Extracted Insights (from documents):</h4>
                  <ul className="list-disc list-inside pl-4 text-muted-foreground space-y-1 text-xs">
                    <li><span className="font-medium text-foreground/80">Policy Status:</span> Active & Verified</li>
                    <li><span className="font-medium text-foreground/80">Incident Date (Claim Form):</span> Consistent with Police Report</li>
                    <li><span className="font-medium text-foreground/80">Damage Description:</span> Aligns with uploaded photographic media</li>
                    <li><span className="font-medium text-foreground/80">Prior Claim History:</span> None relevant to this incident</li>
                    <li><span className="font-medium text-foreground/80">Invoice Total (Repair Quote):</span> $450.75</li>
                  </ul>
                </div>
                 <div className="p-3 rounded-md bg-background/50 border">
                  <h4 className="font-semibold text-foreground/90 mb-1">Consistency Check:</h4>
                   <p className="text-muted-foreground text-xs">Status: <span className="text-accent font-semibold">Consistent</span>. All key data points align across submitted documents and available internal records.</p>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm font-semibold text-primary">AI Recommendation: Expedite for Approval</p>
              </CardFooter>
            </Card>
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
              story="After a minor car accident, Robi was dreading the usual lengthy claims process. With ClaimIntel, he submitted his documents and photos from his phone in minutes. His claim was reviewed and approved within 48 hours."
              name="Robi"
            />
            <SuccessStoryCard
              quote="ClaimIntel made submitting my water damage claim so straightforward. No confusing forms, just a simple process."
              story="When a pipe burst in Kacpersky's kitchen, he was overwhelmed. ClaimIntel's guided submission process helped him upload all necessary information, including videos of the damage, leading to a quick assessment and approval for repairs."
              name="Kacpersky"
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

      </main>

      <footer className="text-center py-8 text-muted-foreground text-sm border-t border-border space-y-1">
        <p>&copy; {new Date().getFullYear()} ClaimIntel. All rights reserved.</p>
        <p>Made with ❤️ Rainbow Team</p>
        <p>Proudly presented at Hack2Future by LTIMindtree</p>
      </footer>
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
}

function SuccessStoryCard({ quote, story, name }: SuccessStoryCardProps) {
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
          <p className="text-sm font-semibold text-foreground">{name}</p>
        </div>
      </CardContent>
    </Card>
  );
}
    
