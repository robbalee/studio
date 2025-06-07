
'use server';

/**
 * @fileOverview Document processing flow for extracting information from uploaded documents.
 *
 * - extractDocumentInformation - A function that handles the document information extraction process.
 * - ExtractDocumentInformationInput - The input type for the extractDocumentInformation function.
 * - ExtractDocumentInformationOutput - The return type for the extractDocumentInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractDocumentInformationInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentType: z.string().describe('The type of the document (e.g., claim form, invoice, receipt, image).'),
});
export type ExtractDocumentInformationInput = z.infer<typeof ExtractDocumentInformationInputSchema>;

const BoundingBoxSchema = z.object({
  x: z.number().min(0).max(1).describe("Normalized top-left x-coordinate (0-1 relative to page width)."),
  y: z.number().min(0).max(1).describe("Normalized top-left y-coordinate (0-1 relative to page height)."),
  width: z.number().min(0).max(1).describe("Normalized width of the box (0-1 relative to page width)."),
  height: z.number().min(0).max(1).describe("Normalized height of the box (0-1 relative to page height)."),
  page: z.number().int().positive().describe("Page number where the entity was found (1-indexed).")
}).optional().nullable().describe("Optional bounding box of the extracted entity. Null if not applicable or determinable.");


const ExtractedFieldDetailSchema = z.object({
  value: z.union([z.string(), z.record(z.any())])
    .describe("The extracted value, which can be a string or a nested JSON object."),
  boundingBox: BoundingBoxSchema
});

// The AI will output a single JSON string.
// This string, when parsed, should conform to Record<string, ExtractedFieldDetailSchema>.
const ExtractDocumentInformationOutputSchema = z.object({
  extractedFieldsJson: z
    .string()
    .describe(
      'A JSON string representing a key-value object. Each key is a field name (e.g., "policyNumber", "claimantName"). ' +
      'Each value is an object containing: ' +
      '1. A "value" (string or nested JSON object for the extracted data). ' +
      '2. An optional "boundingBox" object (nullable). If present, it must contain "x", "y", "width", "height" (all normalized 0-1 floats relative to page dimensions) and "page" (integer, 1-indexed). ' +
      'Example: "{\\"policyNumber\\": {\\"value\\": \\"123XYZ\\", \\"boundingBox\\": {\\"x\\":0.1, \\"y\\":0.2, \\"width\\":0.3, \\"height\\":0.05, \\"page\\":1}}, \\"claimantDetails\\": {\\"value\\": {\\"name\\": \\"John Doe\\", \\"address\\": \\"123 Main St\\"}, \\"boundingBox\\": null}}"'
    ),
});
export type ExtractDocumentInformationOutput = z.infer<typeof ExtractDocumentInformationOutputSchema>;

export async function extractDocumentInformation(input: ExtractDocumentInformationInput): Promise<ExtractDocumentInformationOutput> {
  return extractDocumentInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractDocumentInformationPrompt',
  input: {schema: ExtractDocumentInformationInputSchema},
  output: {schema: ExtractDocumentInformationOutputSchema},
  prompt: `You are an expert document processor specializing in extracting information from insurance claim documents.
Analyze the provided document based on its type and extract all relevant information.

Document Type: {{{documentType}}}
Document: {{media url=documentDataUri}}

The output must be a single field named "extractedFieldsJson".
The value of "extractedFieldsJson" must be a JSON string.
This JSON string should represent an object where:
- Each key is a meaningful field name (e.g., "policyNumber", "claimantName", "dateOfIncident", "totalAmount", "itemizedExpenses").
- Each value associated with a key is an object containing:
  1. A "value" field: This holds the actual extracted data for that key. It can be a string or a nested JSON object if the information is complex (like a list of items or structured details).
  2. An optional "boundingBox" field:
     - If you can identify the specific region on the document page from which the "value" was extracted, provide a "boundingBox" object.
     - This "boundingBox" object must include:
       - "x": Normalized top-left x-coordinate (a float between 0.0 and 1.0, relative to page width).
       - "y": Normalized top-left y-coordinate (a float between 0.0 and 1.0, relative to page height).
       - "width": Normalized width of the box (a float between 0.0 and 1.0, relative to page width).
       - "height": Normalized height of the box (a float between 0.0 and 1.0, relative to page height).
       - "page": The page number where the entity was found (an integer, starting from 1).
     - If a bounding box cannot be determined for a field, or if it's not applicable (e.g., for a summary field you generated), set the "boundingBox" field to null or omit it.

Be as comprehensive as possible with the extracted fields. If the document is an image of a receipt, for example, extract vendor name, date, itemized list of purchases with prices, subtotal, tax, and total amount. Each of these could have a bounding box.

Example of the "extractedFieldsJson" string content:
"{\\"policyNumber\\": {\\"value\\": \\"POL-12345\\", \\"boundingBox\\": {\\"x\\":0.15, \\"y\\":0.22, \\"width\\":0.20, \\"height\\":0.04, \\"page\\":1}}, \\"claimantName\\": {\\"value\\": \\"Jane Doe\\", \\"boundingBox\\": {\\"x\\":0.15, \\"y\\":0.28, \\"width\\":0.30, \\"height\\":0.04, \\"page\\":1}}, \\"incidentSummary\\": {\\"value\\": \\"Vehicle collision at intersection.\\", \\"boundingBox\\": null}}"`
});

const extractDocumentInformationFlow = ai.defineFlow(
  {
    name: 'extractDocumentInformationFlow',
    inputSchema: ExtractDocumentInformationInputSchema,
    outputSchema: ExtractDocumentInformationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
