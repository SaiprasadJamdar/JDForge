"""All LLM prompts for JDForge — single source of truth."""

CLEANUP_PROMPT = """
You are a world-class transcript editor for hiring conversations.
Turn rough ASR transcript into clean, faithful, publication-ready English.

Rules:
1. Preserve meaning exactly. Never invent facts, skills, dates, or names.
2. Normalize multilingual/Hinglish/code-mixed speech into professional English.
3. Keep all technical terms, product names, and role names intact.
4. Remove filler words, stutters, false starts, and ASR noise.
5. Mark genuinely unclear segments as [unclear].
6. Output ONLY the cleaned transcript. No title, no explanation.
""".strip()

SPLIT_PROMPT = """
Analyze this hiring conversation transcript and identify the distinct JOB ROLES being actively recruited for.

STRICT RULES:
1. ONLY split into multiple roles if the transcript clearly describes different sets of responsibilities for different hiring targets.
2. DO NOT create roles for stakeholders, management, or experience levels mentioned in passing (e.g., "Upper management expects...", "Interns will...", "Senior leadership said...").
3. If the entire conversation is about one role (even if complex), return ONLY one role in the list.
4. If only one role is discussed, find its most accurate professional title from the technical requirements (e.g., "Full-Stack Developer") rather than generic nouns.

Return STRICTLY raw JSON:
{
  "roles": [
    {
      "detected_role": "Professional Job Title (Infer from context if ambiguous)",
      "transcript_segment": "All context relevant to this role."
    }
  ]
}
""".strip()

JD_PROMPT = """
You are an expert HR content strategist and technical recruiter for Wissen Technology.
Convert the transcript segment into a complete, publish-ready Job Description in JSON format.

CRITICAL RULES:
1. NEVER output "Discussed in Interview", "To be confirmed", "N/A", or bare empty strings for any section.
2. ALWAYS infer reasonable, professional content from context clues in the transcript.
3. For sections with limited info, write professional standard content that fits the role.
4. Use ATS-friendly, action-oriented language with strong verbs.
5. No vague filler ("dynamic team", "fast-paced environment").
6. Key Responsibilities and Qualifications MUST be non-empty bullet lists or comma-separated items.
7. Output STRICTLY JSON matching exactly this structure — no markdown fences, no explanation:

{
  "template_name": "wissen_standard",
  "sections": {
    "Hiring Title": "Professional Job Title (Focus on core technical competency discussed, e.g. 'React Developer' not 'Upper Management')",
    "Job Summary": "2-3 professional sentences summarizing the role, its purpose, and tech stack context.",
    "Experience": "e.g. 5+ years of experience in Java backend development",
    "Location": "e.g. Bangalore, India / Remote",
    "Mode of Work": "e.g. Hybrid / Full-Time",
    "Key Responsibilities": "• Responsibility one\n• Responsibility two\n• Responsibility three",
    "Qualifications and Required Skills": "• Skill or qualification\n• Skill or qualification",
    "Good to Have Skills": "• Nice-to-have skill\n• Nice-to-have skill",
    "Soft Skills": "• Communication\n• Team collaboration\n• Problem-solving",
    "Wissen Sites": "Wissen Technology operates globally across US, India, UK, Australia, Mexico, and Canada."
  }
}
""".strip()

JD_WITH_TEMPLATE_PROMPT = JD_PROMPT

REFINE_PROMPT = """
You are an expert HR content strategist AI. The user has requested to refine SPECIFIC targeted sections of their generated Job Description.

Input structure:
We will pass you a JSON object containing the current text for ONLY the sections they tagged, and the User's Prompt/Instructions.

Rules:
1. Follow the User's Prompt meticulously, ensuring the tone is ATS-friendly, professional, and action-oriented.
2. Return STRICTLY a JSON object matching the exact keys provided in the input context. Do not invent new section titles.
3. Output ONLY the updated JSON mapping for those exact targeted keys. No explanations, no markdown fences.

Example Input context:
{"Targeted Sections": {"Job Summary": "We need a dev"}, "User Prompt": "Make it sound exciting."}

Example Output:
{
  "Job Summary": "Join our dynamic team as an innovative Developer... "
}
""".strip()

SEARCH_QUERY_PROMPT = """
You are an expert Boolean search specialist for technical recruiting.
Generate three versions of a Boolean search query from this Job Description.

Rules:
1. Use OR for job title synonyms.
2. Use AND for must-have core skills.
3. Use OR within skill groups for equivalents.
4. Expand abbreviations (AWS → "Amazon Web Services", JS → JavaScript).
5. Avoid soft skills and generic keywords.
6. Output ONLY the three query strings in this exact format:

BROAD: <query>
TARGETED: <query>
STRICT: <query>
""".strip()

SCORE_PROMPT = """
You are a HYPER-CRITICAL JD Quality Auditor. Your job is to find faults, gaps, and inaccuracies. 
You are comparing a generated Job Description (JD) against a source transcript.

SCORING RULES (BE STRICTURE):
1. Gibberish/Placeholder Check: If the JD contains placeholder text like "[Enter info]", "To be confirmed", "N/A", or repeated gibberish, the Overall Score MUST be below 40%.
2. Fidelity Check: If the transcript mentions a specific skill or tool and it is MISSING from the JD, penalize the Fidelity score by 20 points per missing item.
3. Completeness Check: A professional JD MUST have Title, Summary, Responsibilities, and Skills. If any full section is missing or contains less than 10 words, score that section 0%.
4. Don't be "nice". An average JD should score around 60%. Only perfect, highly detailed JDs get 90+.

Return your evaluation in EXACTLY this format — no extra text before or after:

=== JD QUALITY SCORING REPORT ===
Position Evaluated  : [job_title]
Overall Score       : [0-100]%
Transcript Fidelity : [0-100]%
Completeness Score  : [0-100]%

--- SECTION BREAKDOWN ---
Role Summary        : [0-100]%
Responsibilities    : [0-100]%
Required Skills     : [0-100]%
Qualifications      : [0-100]%
Company Context     : [0-100]%

--- MISSING INFO ---
[list each missing item with ✘ prefix, or write: ✔ None]

--- BIAS FLAGS ---
[list bias detected with ✘ prefix, or write: ✔ None detected]

--- RECOMMENDATIONS ---
[list each with → prefix]

--- JSON ---
{
  "overall_score": <int>,
  "transcript_fidelity_score": <int>,
  "completeness_score": <int>,
  "section_scores": {
    "role_summary": <int>,
    "responsibilities": <int>,
    "required_skills": <int>,
    "qualifications": <int>,
    "company_context": <int>
  },
  "missing_critical_info": [],
  "bias_flags": [],
  "recommendations": []
}
""".strip()

TITLE_EXTRACTION_PROMPT = """
Extract the primary Job Title from this Job Description.
Output ONLY the job title as a short string (2-4 words). Nothing else. No quotes.
""".strip()

JD_PARSING_PROMPT = """
You are an ATS skill extractor. Read this Job Description and return ONLY a JSON object:
{
  "role_title": "Short job title, e.g. Data Analyst",
  "required_skills": ["Python", "SQL", "Power BI"],
  "preferred_skills": ["Tableau", "R"],
  "optimum_experience": 3
}

STRICT RULES:
- required_skills: ONLY atomic technical tool/skill names. Max 3 words each.
  GOOD: ["Python", "SQL", "Excel", "Power BI", "React", "Node.js", "AWS"]
  BAD: ["Proficiency in Python", "Experience with databases", "Strong communication"]
- Never include soft skills: communication, teamwork, leadership, problem-solving, etc.
- Never include vague phrases: "database management systems", "debugging skills"
- preferred_skills: same rules, only if explicitly stated as preferred/nice-to-have
- optimum_experience: integer (minimum years), 0 if unspecified
- role_title: 2-4 words maximum
""".strip()

BRANDING_ANALYSIS_PROMPT = """
Analyze the attached Job Description template image. 
Your goal is to extract the visual branding and structural identity elements so they can be replicated exactly in a digital preview.

Return a JSON object with the following fields:
1. "primaryColor": (Hex code of the dominant brand color)
2. "secondaryColor": (Hex code of the background/accent color)
3. "fontFamily": (Either "sans" or "serif")
4. "layoutType": ("boxed" if sections are in rounded containers/boxes, otherwise "standard")
5. "metaBarStyle": ("horizontal-row" if Location/Experience are in a single bar, otherwise "grid")
6. "logoAlignment": ("center" or "left")
7. "h1Style": (Tailwind-like class string for the main JD title, e.g. "text-blue-600 uppercase font-bold text-center")
8. "h3Style": (Styling for section headings, e.g. "text-blue-800 border-b border-blue-200")
9. "pStyle": (Styling for paragraph text)
10. "liStyle": (Bullet point styling)
11. "accentBorderColor": (Hex code for borders/boxes if seen)

Only return the JSON. No preamble.
""".strip()
