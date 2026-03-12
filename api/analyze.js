import Groq from 'groq-sdk';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

// Groq free tier: 30 requests/minute, 14,400/day. No billing required.
// Get your free key at: https://console.groq.com

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TEXT_MODEL   = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// ============================================================
// Shared JSON structure for both GST and IT prompts
// ============================================================
const JSON_STRUCTURE = `
Return ONLY a valid JSON object — no markdown, no backticks, no explanation.

{
  "noticeType": "specific notice type e.g. Show Cause Notice u/s 73, Notice u/s 148",
  "noticeeDetails": {
    "name": "full legal name",
    "tradeName": "trade name if different",
    "gstin": "GSTIN if GST notice, else null",
    "pan": "PAN number",
    "address": "full address",
    "email": "email if available",
    "phone": "phone if available",
    "assessmentYear": "AY if Income Tax",
    "taxPeriod": "period covered"
  },
  "noticeMetadata": {
    "noticeType": "detailed notice type with section",
    "din": "Document Identification Number",
    "refNo": "Reference or Notice number",
    "date": "date in DD MMM YYYY",
    "financialYear": "FY e.g. FY 2022-23",
    "assessmentYear": "AY if applicable",
    "issuedBy": "officer name",
    "designation": "officer designation",
    "jurisdiction": "jurisdiction or commissionerate",
    "ward": "ward or circle",
    "replyDueDate": "reply deadline if mentioned"
  },
  "sectionsInvoked": [
    {
      "section": "e.g. 73(1)",
      "act": "e.g. CGST Act 2017 or Income Tax Act 1961",
      "title": "short official title",
      "description": "what this section covers",
      "shortNote": "plain English meaning for taxpayer",
      "implication": "maximum penalty or consequence"
    }
  ],
  "allegations": [
    {
      "ground": "short title e.g. ITC on fake invoices",
      "section": "section invoked",
      "description": "full description of allegation",
      "amount": "digits only, null if not specific"
    }
  ],
  "demands": [
    {
      "taxHead": "CGST / IGST / SGST / Income Tax / Surcharge etc.",
      "description": "what this demand is for",
      "section": "applicable section",
      "period": "period or AY",
      "amount": "digits only, no currency symbol"
    }
  ],
  "interestPenalty": [
    {
      "type": "Interest / Penalty / Late Fee",
      "section": "applicable section",
      "baseAmount": "digits only",
      "rate": "e.g. 18% per annum",
      "period": "calculation period",
      "estimatedAmount": "digits only, null if not stated"
    }
  ],
  "totalDemand": {
    "tax": "digits only",
    "interest": "digits only",
    "penalty": "digits only",
    "other": "digits only or null",
    "total": "grand total digits only"
  },
  "documentsRequired": [
    {
      "document": "document name",
      "description": "what it must contain or prove",
      "relevance": "which allegation it addresses",
      "urgency": "high / medium / low"
    }
  ],
  "nextSteps": [
    {
      "option": "option title e.g. Contest and File Detailed Reply",
      "description": "what this involves step by step",
      "timeline": "e.g. Within 30 days of notice date",
      "pros": "advantages",
      "cons": "risks"
    }
  ],
  "summary": "3-4 plain English sentences: allegation, period, amount at stake, urgent action needed",
  "shortDescription": "one line for listing e.g. SCN for ITC mismatch u/s 73 for FY 2022-23",
  "draftReply": "A comprehensive formal reply letter (minimum 600-800 words) structured as follows:

[OFFICE ADDRESS BLOCK]
From: [Full Name of Taxpayer/Assessee]
[Full Address]
[GSTIN/PAN]

To:
The [Designation of Officer]
[Department/Commissionerate/Ward]
[Jurisdiction Address]

Date: [Date of Reply]

Subject: Reply to [Notice Type] bearing DIN/Ref No. [Number] dated [Date] for [FY/AY] — Response and Submissions

Honorable Sir/Madam,

With reference to the above-captioned notice dated [date], received by the undersigned on [date], I/We submit this detailed reply for your kind consideration.

1. ACKNOWLEDGMENT & BACKGROUND
[2-3 sentences acknowledging the notice, confirming the period covered, and stating that the assessee/taxpayer is fully cooperative and committed to compliance]

2. REPLY TO ALLEGATIONS / GROUNDS
[For EACH ground raised in the notice, write a separate numbered sub-section (2.1, 2.2, etc.) with: (a) the specific allegation restated, (b) detailed factual counter-argument, (c) specific legal provisions and case law supporting the taxpayer, (d) what documents are being submitted in support. Each sub-section should be 3-5 sentences minimum]

3. LEGAL SUBMISSIONS
[3-4 paragraphs citing relevant provisions of the CGST Act/Income Tax Act, landmark court decisions, CBIC circulars, or CBDT notifications that support the taxpayer position. Mention principles of natural justice where applicable]

4. DOCUMENTS ENCLOSED
[Numbered list of all supporting documents being enclosed with this reply]

5. PRAYER
In view of the above submissions and documents enclosed herewith, it is most respectfully prayed that your honor may be pleased to: (a) consider the submissions made herein, (b) drop the proceedings initiated vide the above notice, (c) hold that no demand is payable, and (d) pass any other order that this honorable authority may deem fit in the interest of justice.

The undersigned undertakes to cooperate fully in any further inquiry and to provide any additional documents or information that may be required.

Thanking you.

Yours faithfully,
[Name]
[Designation]
[GSTIN/PAN]
[Contact Details]
[Date]

---
IMPORTANT DISCLAIMER: This reply is AI-generated for informational and reference purposes only. It does not constitute legal, tax, or professional advice. Factual details, legal citations, and arguments must be reviewed, verified, and finalized by a qualified Chartered Accountant or Tax Advocate before submission to any government authority. Submitting this reply without professional review may have legal consequences."
}

If any field is not found in the notice, use null. Capture every section, demand, and document.`;

const GST_SYSTEM = `You are a senior Indian GST consultant and lawyer with 20+ years of experience in CGST, IGST, SGST litigation and GST notices. Analyze the notice with extreme thoroughness and extract all information into the specified JSON format.` + JSON_STRUCTURE;

const IT_SYSTEM = `You are a senior Indian Chartered Accountant and Income Tax litigation expert with 20+ years of experience in assessment, reassessment, scrutiny, and appellate matters under the Income Tax Act 1961. Analyze the notice with extreme thoroughness and extract all information into the specified JSON format.` + JSON_STRUCTURE;

// ============================================================
// Extract text from PDF buffer
// ============================================================
async function extractPdfText(base64Data) {
  const buffer = Buffer.from(base64Data, 'base64');
  const data   = await pdfParse(buffer);
  return data.text;
}

// ============================================================
// Safely parse JSON from LLM response
// ============================================================
function parseJsonResponse(rawText) {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse AI response. Please try again.');
  }
}

// ============================================================
// Main Vercel Handler
// ============================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { fileData, fileType, actType } = req.body;
  if (!fileData) return res.status(400).json({ error: 'No file data provided.' });
  if (!fileType)  return res.status(400).json({ error: 'No file type provided.' });

  const systemPrompt = actType === 'INCOME_TAX' ? IT_SYSTEM : GST_SYSTEM;
  const isPdf        = fileType === 'application/pdf';
  const isImage      = fileType.startsWith('image/');

  try {
    let rawText;

    if (isPdf) {
      // PDF: extract text locally first, then send clean text to Groq
      const noticeText = await extractPdfText(fileData);

      if (!noticeText || noticeText.trim().length < 50) {
        return res.status(400).json({
          error: 'Could not extract text from this PDF. It may be a scanned image — please upload as JPG or PNG instead.',
        });
      }

      const completion = await groq.chat.completions.create({
        model:       TEXT_MODEL,
        temperature: 0.1,
        max_tokens:  8000,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Here is the full text of the tax notice. Analyze it completely and return the JSON.\n\n---\n${noticeText}\n---`,
          },
        ],
      });

      rawText = completion.choices[0]?.message?.content || '';

    } else if (isImage) {
      // Image: send directly to Groq vision model
      const completion = await groq.chat.completions.create({
        model:       VISION_MODEL,
        temperature: 0.1,
        max_tokens:  8000,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${fileType};base64,${fileData}` },
              },
              {
                type: 'text',
                text: 'This is a tax notice. Read every word carefully and return the complete JSON analysis as instructed.',
              },
            ],
          },
        ],
      });

      rawText = completion.choices[0]?.message?.content || '';

    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or image (JPG, PNG).' });
    }

    const analysis = parseJsonResponse(rawText);
    return res.status(200).json(analysis);

  } catch (err) {
    console.error('Groq error:', err);

    if (err.status === 429 || err.message?.includes('429')) {
      return res.status(429).json({ error: 'Too many requests. Please wait 1 minute and try again.' });
    }
    return res.status(500).json({ error: err.message || 'Analysis failed. Please try again.' });
  }
}
