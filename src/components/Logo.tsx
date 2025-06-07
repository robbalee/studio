import type { SVGProps } from 'react';
import { ShieldCheck } from 'lucide-react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-2 text-primary">
      <ShieldCheck className="h-8 w-8" />
      <h1 className="text-2xl font-bold font-headline">ClaimIntel</h1>
    </div>
  );
}
