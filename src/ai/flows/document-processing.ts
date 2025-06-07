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
  documentType: z.string().describe('The type of the document (e.g., claim form, invoice, receipt).'),
});
export type ExtractDocumentInformationInput = z.infer<typeof ExtractDocumentInformationInputSchema>;

const ExtractDocumentInformationOutputSchema = z.object({
  extractedInformation: z
    .record(z.string(), z.string())
    .describe('A key-value object containing the extracted information from the document.'),
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

You will use this information to extract relevant information from the document based on its type.

Document Type: {{{documentType}}}
Document: {{media url=documentDataUri}}

Extract all relevant information from the document and return it as a key-value object. Be as comprehensive as possible.

Example Output:
{
  "policyNumber": "1234567890",
  "claimantName": "John Doe",
  "dateOfAccident": "2024-01-01",
  "descriptionOfAccident": "Details of the accident..."
}
`,
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
