import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ============================================================
// GST Notice Analysis Prompt
// ============================================================
const GST_PROMPT = `You are a senior Indian GST consultant and lawyer with 20+ years of experience.
Analyze this GST notice meticulously and extract ALL available information.

Return ONLY a valid JSON object (no markdown, no explanation, no text before or after) with this exact structure:

{
  "noticeType": "specific notice type e.g. Show Cause Notice u/s 73, DRC-01, DRC-07, SCN",
  "noticeeDetails": {
    "name": "full legal name of the taxpayer/noticee",
    "tradeName": "trade name if different from legal name",
    "gstin": "GSTIN number",
    "pan": "PAN if available",
    "address": "full registered address",
    "email": "email address if available",
    "phone": "phone number if available",
    "taxPeriod": "period for which notice is issued e.g. Apr 2022 to Mar 2023"
  },
  "noticeMetadata": {
    "noticeType": "specific type e.g. SCN u/s 73(1) of CGST Act 2017",
    "din": "Document Identification Number if present",
    "refNo": "Reference or Notice number",
    "date": "date of notice in DD MMM YYYY format",
    "financialYear": "Financial Year e.g. FY 2022-23",
    "issuedBy": "full name of issuing officer",
    "designation": "designation of officer e.g. Superintendent",
    "jurisdiction": "jurisdictional commissionerate/division",
    "ward": "ward/range/division if mentioned",
    "replyDueDate": "deadline to file reply if mentioned in notice"
  },
  "sectionsInvoked": [
    {
      "section": "section number e.g. 73(1)",
      "act": "CGST/IGST/SGST/UTGST/Compensation Cess",
      "title": "short official title of the section",
      "description": "what this section covers and empowers the officer to do",
      "shortNote": "practical meaning for the taxpayer in simple language",
      "implication": "maximum penalty or consequence under this section"
    }
  ],
  "allegations": [
    {
      "ground": "short descriptive title of the allegation e.g. ITC availed on fake invoices",
      "section": "primary section invoked for this ground",
      "description": "full detailed description of the allegation as stated in notice",
      "amount": "amount alleged for this ground in digits only, null if not specific"
    }
  ],
  "demands": [
    {
      "taxHead": "CGST / IGST / SGST / UTGST / Cess",
      "description": "what the demand is for",
      "section": "section under which demanded",
      "period": "tax period for this line item",
      "amount": "amount in digits only, no currency symbol"
    }
  ],
  "interestPenalty": [
    {
      "type": "Interest / Penalty / Late Fee",
      "section": "applicable section e.g. 50 / 74 / 125",
      "baseAmount": "base amount on which calculated, digits only",
      "rate": "applicable rate e.g. 18% per annum",
      "period": "period for calculation",
      "estimatedAmount": "estimated amount in digits, null if not stated"
    }
  ],
  "totalDemand": {
    "tax": "total tax demanded in digits",
    "interest": "total interest demanded in digits",
    "penalty": "total penalty demanded in digits",
    "other": "other charges if any in digits",
    "total": "grand total in digits"
  },
  "documentsRequired": [
    {
      "document": "exact document name",
      "description": "what this document must contain or show",
      "relevance": "why it is being asked — link to specific allegation or section",
      "urgency": "high / medium / low"
    }
  ],
  "nextSteps": [
    {
      "option": "clear title e.g. Contest the Notice and File Detailed Reply",
      "description": "step-by-step explanation of what this option involves",
      "timeline": "typical timeline e.g. Reply within 30 days of notice",
      "pros": "key advantages of choosing this option",
      "cons": "key risks or disadvantages"
    }
  ],
  "summary": "3-4 sentence plain English explanation of this notice — what the department alleges, which period it covers, total amount at stake, and what the taxpayer must do urgently",
  "shortDescription": "single line description for listing purposes e.g. SCN for ITC mismatch u/s 73 for FY 2022-23",
  "draftReply": "Complete formal reply letter. Include: (1) Proper letterhead format with To/From/Date/Subject, (2) Introduction acknowledging the notice with DIN/Ref No, (3) Counter-arguments for each allegation with legal citations, (4) Prayer seeking discharge/dropping of proceedings, (5) Professional closing with CA disclaimer note. Make it thorough, assertive and professionally worded."
}

CRITICAL: If a field is not found in the notice, set it to null. Do not guess. Return pure JSON only — no markdown backticks, no explanation text.`;

// ============================================================
// Income Tax Notice Analysis Prompt
// ============================================================
const IT_PROMPT = `You are a senior Indian Income Tax consultant and Chartered Accountant with 20+ years of experience.
Analyze this Income Tax notice meticulously and extract ALL available information.

Return ONLY a valid JSON object (no markdown, no explanation, no text before or after) with this exact structure:

{
  "noticeType": "specific notice type e.g. Notice u/s 148, 142(1), 143(2), 156 Demand Notice",
  "noticeeDetails": {
    "name": "full name of assessee",
    "pan": "PAN number",
    "gstin": null,
    "address": "full address of assessee",
    "email": "email if available",
    "phone": "phone if available",
    "assessmentYear": "AY e.g. AY 2022-23",
    "taxPeriod": "financial year of income e.g. FY 2021-22"
  },
  "noticeMetadata": {
    "noticeType": "specific type e.g. Notice for Reassessment u/s 148",
    "din": "Document Identification Number if present",
    "refNo": "ITBA reference or case number",
    "date": "date of notice in DD MMM YYYY format",
    "financialYear": "FY of income in question e.g. FY 2021-22",
    "assessmentYear": "AY e.g. AY 2022-23",
    "issuedBy": "name of Assessing Officer",
    "designation": "designation e.g. ITO / DCIT / ACIT Ward 1(1)",
    "jurisdiction": "ward/circle/range name",
    "ward": "ward and circle number",
    "replyDueDate": "due date to reply, appear or file documents"
  },
  "sectionsInvoked": [
    {
      "section": "section number e.g. 148",
      "act": "Income Tax Act, 1961",
      "title": "short official title",
      "description": "what this section empowers or requires",
      "shortNote": "what this means practically for the assessee",
      "implication": "consequence or penalty if applicable"
    }
  ],
  "allegations": [
    {
      "ground": "short title e.g. Unexplained Cash Deposits",
      "section": "section invoked",
      "description": "full description of the allegation or addition proposed",
      "amount": "income alleged or disallowed amount in digits, null if not specific"
    }
  ],
  "demands": [
    {
      "taxHead": "Income Tax / Surcharge / Education Cess / Interest u/s 234",
      "description": "what this demand is for",
      "section": "applicable section",
      "period": "assessment year",
      "amount": "amount in digits only"
    }
  ],
  "interestPenalty": [
    {
      "type": "Interest u/s 234A / 234B / 234C / Penalty u/s 270A / 271",
      "section": "section number",
      "baseAmount": "base amount in digits",
      "rate": "applicable rate",
      "period": "period for calculation",
      "estimatedAmount": "estimated amount in digits, null if not stated"
    }
  ],
  "totalDemand": {
    "tax": "tax demand in digits",
    "interest": "total interest in digits",
    "penalty": "penalty in digits",
    "other": null,
    "total": "grand total in digits"
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
      "option": "option title",
      "description": "detailed explanation of what this option involves",
      "timeline": "timeline to act",
      "pros": "advantages",
      "cons": "risks"
    }
  ],
  "summary": "3-4 sentence plain English summary — what the department is alleging, which AY it covers, what is at stake financially, and what immediate action is required",
  "shortDescription": "single line description for listing e.g. Reassessment Notice u/s 148 for AY 2022-23",
  "draftReply": "Complete formal reply letter. Include: (1) Proper letterhead with To/From/Date/Subject, (2) Acknowledgment of notice with reference number, (3) Detailed counter-arguments for each ground with supporting legal citations and case law references where applicable, (4) Request to drop proceedings, (5) Professional closing with disclaimer to verify with CA before submitting."
}

CRITICAL: If a field is not found in the notice, set it to null. Do not guess. Return pure JSON only.`;

// ============================================================
// Main Vercel Handler
// ============================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileData, fileType, actType } = req.body;

  if (!fileData) return res.status(400).json({ error: 'No file data provided.' });
  if (!fileType)  return res.status(400).json({ error: 'No file type provided.' });

  const isImage = fileType.startsWith('image/');
  const prompt  = actType === 'INCOME_TAX' ? IT_PROMPT : GST_PROMPT;

  try {
    const contentBlocks = isImage
      ? [
          { type: 'image', source: { type: 'base64', media_type: fileType, data: fileData } },
          { type: 'text',  text: 'Analyze this tax notice image. Extract every detail as instructed.' },
        ]
      : [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData } },
          { type: 'text',     text: 'Analyze this tax notice PDF. Extract every detail as instructed.' },
        ];

    const message = await client.messages.create({
      model:      'claude-opus-4-20250514',
      max_tokens: 8096,
      system:     prompt,
      messages:   [{ role: 'user', content: contentBlocks }],
    });

    const rawText = message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    // Strip any markdown fences if present
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      // Try to find JSON block inside the response
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        analysis = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse AI response. Please try again.');
      }
    }

    return res.status(200).json(analysis);

  } catch (err) {
    console.error('Analysis error:', err);
    if (err.status === 429) return res.status(429).json({ error: 'Service is busy. Please retry in a minute.' });
    if (err.status === 400) return res.status(400).json({ error: 'Document could not be read. Please upload a clearer scan.' });
    return res.status(500).json({ error: err.message || 'Analysis failed. Please try again.' });
  }
}
