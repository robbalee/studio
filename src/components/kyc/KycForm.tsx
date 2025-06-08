
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Camera, UserCircle, CalendarDays, Fingerprint } from "lucide-react";

const MAX_FILE_SIZE_SELFIE = 2 * 1024 * 1024; // 2MB for selfie

const kycFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  dateOfBirth: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format." }),
  idNumber: z.string().min(5, { message: "ID number must be at least 5 characters." }),
  selfie: z.custom<FileList>()
    .refine(files => files && files.length === 1, "A selfie image is required.")
    .refine(files => files && files[0].size <= MAX_FILE_SIZE_SELFIE, `Max selfie file size is ${MAX_FILE_SIZE_SELFIE / (1024*1024)}MB.`)
    .refine(files => files && ['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type), "Only JPG, PNG, WEBP images are allowed for selfie."),
});

type KycFormValues = z.infer<typeof kycFormSchema>;

export function KycForm() {
  const { completeKycSession } = useAppContext();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [selfieFileName, setSelfieFileName] = useState<string | null>(null);

  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      idNumber: "",
    },
  });

  async function onSubmit(data: KycFormValues) {
    setIsVerifying(true);
    // Simulate a verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, you would send data.selfie (as Data URI or to a server) for processing.
    // For this demo, we just proceed.
    
    setIsVerifying(false);
    completeKycSession();
    toast({
      title: "KYC Verification Successful (Demo)",
      description: "You can now proceed to submit your claim.",
      variant: "default",
      className: "bg-accent text-accent-foreground", // Ensure success styling for the toast
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><UserCircle className="mr-2 h-4 w-4 text-muted-foreground"/>Full Legal Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Mary Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground"/>Date of Birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="idNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Fingerprint className="mr-2 h-4 w-4 text-muted-foreground"/>ID Number (e.g., Driver's License)</FormLabel>
              <FormControl>
                <Input placeholder="Enter your ID number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="selfie"
          render={({ field: { onChange, onBlur, name, ref }}) => (
            <FormItem>
              <FormLabel className="flex items-center"><Camera className="mr-2 h-4 w-4 text-muted-foreground"/>Upload Selfie for Liveness Check</FormLabel>
              <FormControl>
                <div>
                  <div className="relative">
                    <Input
                      id="selfie-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      name={name}
                      ref={ref}
                      onBlur={onBlur}
                      onChange={(e) => {
                        const files = e.target.files;
                        onChange(files); // RHF's onChange
                        if (files && files.length > 0) {
                          setSelfieFileName(files[0].name);
                        } else {
                          setSelfieFileName(null);
                        }
                      }}
                    />
                    <label
                      htmlFor="selfie-upload"
                      className="flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <span className="flex flex-col items-center space-y-1 text-center">
                        <Camera className="w-8 h-8 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">
                          {selfieFileName || "Click to upload your selfie"}
                        </span>
                        {selfieFileName && <span className="text-xs text-muted-foreground">{selfieFileName}</span>}
                      </span>
                    </label>
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Ensure your face is clearly visible. Max file size: {MAX_FILE_SIZE_SELFIE / (1024*1024)}MB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isVerifying}>
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying (Demo)...
            </>
          ) : (
            "Verify & Proceed to Claim"
          )}
        </Button>
      </form>
    </Form>
  );
}
