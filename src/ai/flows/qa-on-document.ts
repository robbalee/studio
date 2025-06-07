
'use server';
/**
 * @fileOverview AI flow for answering questions based on a document's content.
 *
 * - qaOnDocument - A function that handles the question answering process for a given document.
 * - QaOnDocumentInput - The input type for the qaOnDocument function.
 * - QaOnDocumentOutput - The return type for the qaOnDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const QaOnDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document content, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The user_s question about the document.'),
});
export type QaOnDocumentInput = z.infer<typeof QaOnDocumentInputSchema>;

export const QaOnDocumentOutputSchema = z.object({
  answer: z.string().describe('The AI_s answer to the question, based on the document.'),
});
export type QaOnDocumentOutput = z.infer<typeof QaOnDocumentOutputSchema>;

export async function qaOnDocument(input: QaOnDocumentInput): Promise<QaOnDocumentOutput> {
  return qaOnDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'qaOnDocumentPrompt',
  input: {schema: QaOnDocumentInputSchema},
  output: {schema: QaOnDocumentOutputSchema},
  prompt: `You are a helpful AI assistant. Your task is to answer the user's question based *solely* on the content of the provided document.
Do not use any external knowledge. If the answer cannot be found within the document, clearly state that the information is not present in the document.

Document:
{{media url=documentDataUri}}

User's Question:
"{{{question}}}"

Based *only* on the document provided, what is the answer?`,
});

const qaOnDocumentFlow = ai.defineFlow(
  {
    name: 'qaOnDocumentFlow',
    inputSchema: QaOnDocumentInputSchema,
    outputSchema: QaOnDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
