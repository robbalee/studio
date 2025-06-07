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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type React from 'react';
import { useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";

const claimFormSchema = z.object({
  claimantName: z.string().min(2, { message: "Claimant name must be at least 2 characters." }),
  policyNumber: z.string().min(5, { message: "Policy number must be at least 5 characters." }),
  incidentDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format." }),
  incidentDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  document: z.custom<FileList>().optional()
    .refine(files => !files || files.length <= 1, "Only one document can be uploaded.")
    .refine(files => !files || !files[0] || files[0].size <= 5 * 1024 * 1024, `Max file size is 5MB.`), // Max 5MB
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

export function ClaimForm() {
  const { addClaim, isLoading: isContextLoading } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      claimantName: "",
      policyNumber: "",
      incidentDate: new Date().toISOString().split('T')[0], // Default to today
      incidentDescription: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      form.setValue("document", files); // react-hook-form handles FileList
    } else {
      setFileName(null);
      form.setValue("document", undefined);
    }
  };

  async function onSubmit(data: ClaimFormValues) {
    setIsSubmitting(true);
    let documentUri: string | undefined;
    let documentName: string | undefined;

    if (data.document && data.document.length > 0) {
      const file = data.document[0];
      documentName = file.name;
      documentUri = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    }

    const claimData = {
      claimantName: data.claimantName,
      policyNumber: data.policyNumber,
      incidentDate: data.incidentDate,
      incidentDescription: data.incidentDescription,
      documentUri,
      documentName,
    };

    const newClaim = await addClaim(claimData);
    setIsSubmitting(false);

    if (newClaim) {
      toast({
        title: "Claim Submitted Successfully",
        description: `Claim ID: ${newClaim.id} has been submitted.`,
        variant: "default",
        className: "bg-accent text-accent-foreground",
      });
      router.push(`/claims/${newClaim.id}`);
    } else {
      toast({
        title: "Error Submitting Claim",
        description: "There was a problem submitting your claim. Please try again.",
        variant: "destructive",
      });
    }
  }

  const totalLoading = isSubmitting || isContextLoading;

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Submit New Insurance Claim</CardTitle>
        <CardDescription>Please fill in the details below to submit your claim. Attach any supporting documents if necessary.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="claimantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claimant Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="policyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Number</FormLabel>
                  <FormControl>
                    <Input placeholder="POL-12345XYZ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="incidentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Incident</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="incidentDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description of Incident</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what happened in detail..."
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="document"
              render={() => ( // field is not directly used here, but form state is
                <FormItem>
                  <FormLabel>Supporting Document (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <Input 
                        id="document-upload"
                        type="file" 
                        className="hidden"
                        onChange={handleFileChange} 
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                      />
                      <label 
                        htmlFor="document-upload"
                        className="flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <span className="flex items-center space-x-2">
                          <UploadCloud className="w-6 h-6 text-muted-foreground" />
                          <span className="font-medium text-muted-foreground">
                            {fileName || "Click to upload or drag and drop"}
                          </span>
                        </span>
                      </label>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Max file size: 5MB. Accepted formats: PDF, DOC, DOCX, JPG, PNG, ZIP.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={totalLoading}>
              {totalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Claim"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
