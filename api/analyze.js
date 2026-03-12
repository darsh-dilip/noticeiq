import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// We use gemini-1.5-flash — completely free tier, reads PDFs and images,
// 1,500 requests/day, 15 requests/minute. No billing required.
const MODEL = 'gemini-1.5-flash';

// ============================================================
// GST Notice Analysis Prompt
// ============================================================
const GST_PROMPT = `You are a senior Indian GST consultant and lawyer with 20+ years of experience.
Analyze this GST notice meticulously and extract ALL available information.

Return ONLY a valid JSON object. No markdown, no backticks, no explanation — pure JSON only.

{
  "noticeType": "specific notice type e.g. Show Cause Notice u/s 73, DRC-01, DRC-07, SCN",
  "noticeeDetails": {
    "name": "full legal name of the taxpayer",
    "tradeName": "trade name if different",
    "gstin": "GSTIN number",
    "pan": "PAN if available",
    "address": "full registered address",
    "email": "email if available",
    "phone": "phone if available",
    "taxPeriod": "period e.g. Apr 2022 to Mar 2023"
  },
  "noticeMetadata": {
    "noticeType": "specific type e.g. SCN u/s 73(1) of CGST Act 2017",
    "din": "Document Identification Number",
    "refNo": "Reference or Notice number",
    "date": "date in DD MMM YYYY",
    "financialYear": "FY e.g. FY 2022-23",
    "issuedBy": "name of issuing officer",
    "designation": "designation e.g. Superintendent",
    "jurisdiction": "commissionerate/division",
    "ward": "ward/range/division",
    "replyDueDate": "deadline to reply"
  },
  "sectionsInvoked": [
    {
      "section": "e.g. 73(1)",
      "act": "CGST/IGST/SGST/UTGST",
      "title": "short official title",
      "description": "what this section covers",
      "shortNote": "practical meaning for the taxpayer",
      "implication": "maximum penalty or consequence"
    }
  ],
  "allegations": [
    {
      "ground": "short title e.g. ITC availed on fake invoices",
      "section": "primary section",
      "description": "full description of the allegation",
      "amount": "amount in digits only, null if not specific"
    }
  ],
  "demands": [
    {
      "taxHead": "CGST / IGST / SGST / UTGST / Cess",
      "description": "what the demand is for",
      "section": "section number",
      "period": "tax period",
      "amount": "digits only, no currency symbol"
    }
  ],
  "interestPenalty": [
    {
      "type": "Interest / Penalty / Late Fee",
      "section": "e.g. 50 / 74 / 125",
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
      "description": "what it must contain",
      "relevance": "why it is being asked",
      "urgency": "high / medium / low"
    }
  ],
  "nextSteps": [
    {
      "option": "title e.g. Contest and File Detailed Reply",
      "description": "what this involves step by step",
      "timeline": "e.g. Within 30 days",
      "pros": "advantages",
      "cons": "risks"
    }
  ],
  "summary": "3-4 sentences in plain English: what is alleged, period covered, total amount, what to do urgently",
  "shortDescription": "one line for listing e.g. SCN for ITC mismatch u/s 73 for FY 2022-23",
  "draftReply": "Complete formal reply letter with: (1) To/From/Date/Subject header, (2) Acknowledgment of notice with DIN/Ref No, (3) Counter-arguments for each allegation with legal citations, (4) Prayer seeking discharge, (5) Professional closing with disclaimer to verify with CA before sending."
}

If any field is not found in the notice, use null. Be thorough — capture every section, every demand, every document. Return pure JSON only.`;

// ============================================================
// Income Tax Notice Analysis Prompt
// ============================================================
const IT_PROMPT = `You are a senior Indian Income Tax consultant and Chartered Accountant with 20+ years of experience.
Analyze this Income Tax notice meticulously and extract ALL available information.

Return ONLY a valid JSON object. No markdown, no backticks, no explanation — pure JSON only.

{
  "noticeType": "e.g. Notice u/s 148, 142(1), 143(2), 156 Demand Notice",
  "noticeeDetails": {
    "name": "full name of assessee",
    "pan": "PAN number",
    "gstin": null,
    "address": "full address",
    "email": "email if available",
    "phone": "phone if available",
    "assessmentYear": "AY e.g. AY 2022-23",
    "taxPeriod": "FY e.g. FY 2021-22"
  },
  "noticeMetadata": {
    "noticeType": "specific type e.g. Notice for Reassessment u/s 148",
    "din": "Document Identification Number",
    "refNo": "ITBA reference or case number",
    "date": "date in DD MMM YYYY",
    "financialYear": "FY e.g. FY 2021-22",
    "assessmentYear": "AY e.g. AY 2022-23",
    "issuedBy": "Assessing Officer name",
    "designation": "e.g. ITO / DCIT / ACIT Ward 1(1)",
    "jurisdiction": "ward/circle/range",
    "ward": "ward and circle number",
    "replyDueDate": "due date to reply or appear"
  },
  "sectionsInvoked": [
    {
      "section": "e.g. 148",
      "act": "Income Tax Act, 1961",
      "title": "short official title",
      "description": "what this section empowers",
      "shortNote": "practical meaning for the assessee",
      "implication": "consequence or penalty"
    }
  ],
  "allegations": [
    {
      "ground": "e.g. Unexplained Cash Deposits",
      "section": "section invoked",
      "description": "full description",
      "amount": "digits only, null if not specific"
    }
  ],
  "demands": [
    {
      "taxHead": "Income Tax / Surcharge / Education Cess / Interest u/s 234",
      "description": "what this is for",
      "section": "section",
      "period": "assessment year",
      "amount": "digits only"
    }
  ],
  "interestPenalty": [
    {
      "type": "Interest u/s 234A / 234B / 234C / Penalty u/s 270A",
      "section": "section",
      "baseAmount": "digits only",
      "rate": "rate",
      "period": "period",
      "estimatedAmount": "digits only, null if not stated"
    }
  ],
  "totalDemand": {
    "tax": "digits only",
    "interest": "digits only",
    "penalty": "digits only",
    "other": null,
    "total": "grand total digits only"
  },
  "documentsRequired": [
    {
      "document": "document name",
      "description": "what it must prove",
      "relevance": "which allegation it addresses",
      "urgency": "high / medium / low"
    }
  ],
  "nextSteps": [
    {
      "option": "title",
      "description": "detailed explanation",
      "timeline": "timeline",
      "pros": "advantages",
      "cons": "risks"
    }
  ],
  "summary": "3-4 plain English sentences: allegation, AY, amount at stake, immediate action required",
  "shortDescription": "one line e.g. Reassessment Notice u/s 148 for AY 2022-23",
  "draftReply": "Complete formal reply: (1) To/From/Date/Subject, (2) Acknowledgment with reference number, (3) Counter-arguments for each ground with legal citations and case law, (4) Request to drop proceedings, (5) Professional closing with disclaimer to verify with CA before submitting."
}

If any field is not found, use null. Return pure JSON only.`;

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

  const prompt = actType === 'INCOME_TAX' ? IT_PROMPT : GST_PROMPT;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    // Build the parts array — Gemini accepts both PDFs and images inline
    const filePart = {
      inlineData: {
        mimeType: fileType,
        data:     fileData,
      },
    };

    const result = await model.generateContent([
      prompt,
      filePart,
      'Analyze the tax notice in this document carefully and return the JSON as instructed.',
    ]);

    const rawText = result.response.text();

    // Strip markdown fences if Gemini wraps the JSON
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      // Try to find a JSON block anywhere in the response
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        analysis = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse AI response. Please try again or try a clearer scan of the notice.');
      }
    }

    return res.status(200).json(analysis);

  } catch (err) {
    console.error('Gemini analysis error:', err);

    // Handle Gemini-specific rate limit error
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return res.status(429).json({
        error: 'Free tier limit reached (15 per minute). Please wait 1 minute and try again.',
      });
    }
    if (err.message?.includes('400')) {
      return res.status(400).json({
        error: 'Document could not be read. Please upload a clearer scan.',
      });
    }

    return res.status(500).json({
      error: err.message || 'Analysis failed. Please try again.',
    });
  }
}
