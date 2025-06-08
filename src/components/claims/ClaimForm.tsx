
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
import { Loader2, UploadCloud, Image as ImageIcon, Video } from "lucide-react";

const MAX_FILE_SIZE_DOC = 5 * 1024 * 1024; // 5MB for single document
const MAX_FILE_SIZE_IMG = 2 * 1024 * 1024; // 2MB for each image
const MAX_IMAGES = 5;
const MAX_FILE_SIZE_VIDEO = 10 * 1024 * 1024; // 10MB for single video

const claimFormSchema = z.object({
  claimantName: z.string().min(2, { message: "Claimant name must be at least 2 characters." }),
  policyNumber: z.string().min(5, { message: "Policy number must be at least 5 characters." }),
  incidentDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format." }),
  incidentDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  document: z.custom<FileList>().optional()
    .refine(files => !files || files.length <= 1, "Only one document can be uploaded.")
    .refine(files => !files || !files[0] || files[0].size <= MAX_FILE_SIZE_DOC, `Max document file size is ${MAX_FILE_SIZE_DOC / (1024*1024)}MB.`),
  images: z.custom<FileList>().optional()
    .refine(files => !files || files.length <= MAX_IMAGES, `You can upload a maximum of ${MAX_IMAGES} images.`)
    .refine(files => !files || Array.from(files).every(file => file.size <= MAX_FILE_SIZE_IMG), `Each image must be ${MAX_FILE_SIZE_IMG / (1024*1024)}MB or less.`)
    .refine(files => !files || Array.from(files).every(file => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)), "Only JPG, PNG, GIF, WEBP images are allowed."),
  video: z.custom<FileList>().optional()
    .refine(files => !files || files.length <= 1, "Only one video can be uploaded.")
    .refine(files => !files || !files[0] || files[0].size <= MAX_FILE_SIZE_VIDEO, `Max video file size is ${MAX_FILE_SIZE_VIDEO / (1024*1024)}MB.`)
    .refine(files => !files || !files[0] || ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'].includes(files[0].type), "Only MP4, WEBM, MOV, AVI, MKV videos are allowed.")
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

export function ClaimForm() {
  const { addClaim, isLoading: isContextLoading } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docFileName, setDocFileName] = useState<string | null>(null);
  const [imageFileNames, setImageFileNames] = useState<string[]>([]);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      claimantName: "",
      policyNumber: "",
      incidentDate: new Date().toISOString().split('T')[0], // Default to today
      incidentDescription: "",
    },
  });

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  async function onSubmit(data: ClaimFormValues) {
    setIsSubmitting(true);
    try {
      let documentUri: string | undefined;
      let documentName: string | undefined;
      let imageUris: string[] = [];
      let imageNames: string[] = [];
      let videoUri: string | undefined;
      let videoName: string | undefined;

      if (data.document && data.document.length > 0) {
        const file = data.document[0];
        documentName = file.name;
        try {
          documentUri = await readFileAsDataURL(file);
        } catch (error) {
          console.error("Error reading document file:", error);
          toast({ title: "Error Reading Document", description: "Could not process the uploaded document.", variant: "destructive" });
          throw error;
        }
      }

      if (data.images && data.images.length > 0) {
        imageNames = Array.from(data.images).map(file => file.name);
        try {
          imageUris = await Promise.all(Array.from(data.images).map(file => readFileAsDataURL(file)));
        } catch (error) {
          console.error("Error reading image files:", error);
          toast({ title: "Error Reading Images", description: "Could not process one or more uploaded images.", variant: "destructive" });
          throw error;
        }
      }

      if (data.video && data.video.length > 0) {
        const file = data.video[0];
        videoName = file.name;
        try {
          videoUri = await readFileAsDataURL(file);
        } catch (error) {
          console.error("Error reading video file:", error);
          toast({ title: "Error Reading Video", description: "Could not process the uploaded video.", variant: "destructive" });
          throw error;
        }
      }

      const claimData = {
        claimantName: data.claimantName,
        policyNumber: data.policyNumber,
        incidentDate: data.incidentDate,
        incidentDescription: data.incidentDescription,
        documentUri,
        documentName,
        imageUris,
        imageNames,
        videoUri,
        videoName,
      };

      const newClaim = await addClaim(claimData);

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
          description: "There was a problem submitting your claim. Please check notifications for details or try again.",
          variant: "destructive",
        });
      }
    } catch (formError) {
      console.error("Error in claim form submission process:", formError);
      if (!toast.toasts.find(t => ["Error Reading Document", "Error Reading Images", "Error Reading Video"].includes(t.title as string))) {
         toast({
            title: "Form Processing Error",
            description: "An unexpected error occurred while preparing your claim. Please try again.",
            variant: "destructive",
          });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalLoading = isSubmitting || isContextLoading;
  let buttonText = "Submit Claim";
  if (isSubmitting) {
    buttonText = "Submitting...";
  } else if (isContextLoading) {
    buttonText = "Loading...";
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Submit New Insurance Claim</CardTitle>
        <CardDescription>Please fill in the details below. Attach supporting documents, images, and a video if necessary.</CardDescription>
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
              render={({ field: { onChange, onBlur, name, ref }}) => (
                <FormItem>
                  <FormLabel>Supporting Document (Optional)</FormLabel>
                  <FormControl>
                     <div>
                        <div className="relative">
                          <Input
                            id="document-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                            name={name}
                            ref={ref}
                            onBlur={onBlur}
                            onChange={(e) => {
                              const files = e.target.files;
                              onChange(files); 
                              if (files && files.length > 0) {
                                setDocFileName(files[0].name);
                              } else {
                                setDocFileName(null);
                              }
                            }}
                          />
                          <label
                            htmlFor="document-upload"
                            className="flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <span className="flex flex-col items-center space-y-1 text-center">
                              <UploadCloud className="w-8 h-8 text-muted-foreground" />
                              <span className="font-medium text-muted-foreground">
                                {docFileName || "Click to upload main document"}
                              </span>
                              {docFileName && <span className="text-xs text-muted-foreground">{docFileName}</span>}
                            </span>
                          </label>
                        </div>
                      </div>
                  </FormControl>
                  <FormDescription>
                    Max file size: {MAX_FILE_SIZE_DOC / (1024*1024)}MB. Accepted: PDF, DOC, DOCX, JPG, PNG, ZIP.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field: { onChange, onBlur, name, ref } }) => (
                <FormItem>
                  <FormLabel>Supporting Images (Optional, up to {MAX_IMAGES})</FormLabel>
                  <FormControl>
                    <div> 
                      <div className="relative">
                        <Input
                          id="images-upload"
                          type="file"
                          multiple
                          className="hidden"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          name={name}
                          ref={ref}
                          onBlur={onBlur}
                          onChange={(e) => {
                            const files = e.target.files;
                            onChange(files); 
                            if (files && files.length > 0) {
                              setImageFileNames(Array.from(files).map(f => f.name));
                            } else {
                              setImageFileNames([]);
                            }
                          }}
                        />
                        <label
                          htmlFor="images-upload"
                          className="flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <span className="flex flex-col items-center space-y-1 text-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">
                              {imageFileNames.length > 0 ? `${imageFileNames.length} image(s) selected` : "Click to upload images"}
                            </span>
                          </span>
                        </label>
                      </div>
                      {imageFileNames.length > 0 && (
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">Selected images:</p>
                          <ul className="list-disc list-inside pl-4">
                            {imageFileNames.map(name => <li key={name} className="truncate">{name}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Max {MAX_IMAGES} images. Each up to {MAX_FILE_SIZE_IMG / (1024*1024)}MB. Accepted: JPG, PNG, GIF, WEBP.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="video"
              render={({ field: { onChange, onBlur, name, ref }}) => (
                <FormItem>
                  <FormLabel>Supporting Video (Optional)</FormLabel>
                  <FormControl>
                     <div>
                        <div className="relative">
                          <Input
                            id="video-upload"
                            type="file"
                            className="hidden"
                            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                            name={name}
                            ref={ref}
                            onBlur={onBlur}
                            onChange={(e) => {
                              const files = e.target.files;
                              onChange(files); 
                              if (files && files.length > 0) {
                                setVideoFileName(files[0].name);
                              } else {
                                setVideoFileName(null);
                              }
                            }}
                          />
                          <label
                            htmlFor="video-upload"
                            className="flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <span className="flex flex-col items-center space-y-1 text-center">
                              <Video className="w-8 h-8 text-muted-foreground" />
                              <span className="font-medium text-muted-foreground">
                                {videoFileName || "Click to upload video"}
                              </span>
                               {videoFileName && <span className="text-xs text-muted-foreground">{videoFileName}</span>}
                            </span>
                          </label>
                        </div>
                      </div>
                  </FormControl>
                  <FormDescription>
                    Max file size: {MAX_FILE_SIZE_VIDEO / (1024*1024)}MB. Accepted: MP4, WEBM, MOV, AVI, MKV.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={totalLoading}>
              {totalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {buttonText}
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

