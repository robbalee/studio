
'use server';
/**
 * @fileOverview Fraud risk assessment AI agent.
 *
 * - assessFraudRisk - A function that handles the fraud risk assessment process.
 * - AssessFraudRiskInput - The input type for the assessFraudRisk function.
 * - AssessFraudRiskOutput - The return type for the assessFraudRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessFraudRiskInputSchema = z.object({
  claimDetails: z
    .string()
    .describe('The details of the insurance claim, including all relevant information.'),
  supportingDocumentUri:
    z.string()
    .describe(
      'The main supporting document for the claim, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    )
    .optional(),
  imageEvidenceUris:
    z.array(z.string())
    .optional()
    .describe(
      'An array of image data URIs providing visual evidence for the claim. Each URI must include a MIME type and use Base64 encoding.'
    ),
  videoEvidenceUri: z // New field for video
    .string()
    .optional()
    .describe(
      'A video data URI providing visual evidence for the claim. The URI must include a MIME type and use Base64 encoding.'
    ),
  claimHistory: z.string().describe('The claim history of the claimant.').optional(),
});
export type AssessFraudRiskInput = z.infer<typeof AssessFraudRiskInputSchema>;

const AssessFraudRiskOutputSchema = z.object({
  riskScore: z
    .number()
    .describe('A score from 0 to 1 indicating the risk of fraud, with 1 being the highest risk.'),
  fraudIndicators: z.array(z.string()).describe('Specific patterns or indicators suggesting fraud.'),
  summary: z.string().describe('A summary of the fraud risk assessment.'),
});
export type AssessFraudRiskOutput = z.infer<typeof AssessFraudRiskOutputSchema>;

export async function assessFraudRisk(input: AssessFraudRiskInput): Promise<AssessFraudRiskOutput> {
  return assessFraudRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessFraudRiskPrompt',
  input: {schema: AssessFraudRiskInputSchema},
  output: {schema: AssessFraudRiskOutputSchema},
  prompt: `You are an expert fraud analyst specializing in insurance claims.

  Analyze the provided claim details, supporting document, image evidence, video evidence, and claim history to assess the risk of fraud.
  Provide a risk score between 0 and 1, where 1 indicates the highest risk.
  Highlight any specific fraud indicators or suspicious patterns.
  Provide a summary of your assessment.
  If image or video evidence is provided and it influences your assessment, please briefly mention what you observed in the media.

  Claim Details: {{{claimDetails}}}
  Supporting Document: {{#if supportingDocumentUri}}{{media url=supportingDocumentUri}}{{else}}None{{/if}}
  Image Evidence:
  {{#if imageEvidenceUris}}
    {{#each imageEvidenceUris}}
      Image: {{media url=this}}
    {{/each}}
  {{else}}
    None
  {{/if}}
  Video Evidence:
  {{#if videoEvidenceUri}}
    Video: {{media url=videoEvidenceUri}}
  {{else}}
    None
  {{/if}}
  Claim History: {{#if claimHistory}}{{{claimHistory}}}{{else}}None{{/if}}`,
});

const assessFraudRiskFlow = ai.defineFlow(
  {
    name: 'assessFraudRiskFlow',
    inputSchema: AssessFraudRiskInputSchema,
    outputSchema: AssessFraudRiskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
