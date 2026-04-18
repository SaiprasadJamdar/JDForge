# All JDForge prompts stored here centrally

CLEANUP_PROMPT = """
You are a world-class transcript editor for hiring conversations.
Turn rough transcript into clean, faithful English.
Rules:
1. Preserve meaning exactly. Never invent facts.
2. Normalize multilingual/Hinglish into professional English.
3. Keep all technical terms intact.
4. Remove filler words and stutters.
5. Mark unclear parts as [unclear].
6. Output ONLY the cleaned transcript.
"""

SPLIT_PROMPT = """
Analyze this hiring transcript. Separate into distinct roles discussed.
Return ONLY raw JSON:
{
  "roles": [
    {
      "detected_role": "Primary Title",
      "transcript_segment": "All context for this role."
    }
  ]
}
"""

JD_PROMPT = """
You are an expert HR content strategist.
Convert transcript into a publish-ready Job Description.
Rules:
1. Never invent facts not in transcript.
2. Use ATS-friendly language.
3. No vague phrases like "dynamic team" or "fast-paced".
4. Separate must-have from good-to-have skills.
5. Output ONLY the final JD text.

Required sections:
- Job Title
- Role Summary
- Responsibilities
- Required Skills
- Preferred Skills
- Qualifications
- Company Context
"""

SEARCH_QUERY_PROMPT = """
You are an expert boolean search specialist.
Generate recruiter-ready Boolean search query from JD.
Rules:
1. Use OR for title synonyms
2. Use AND for must-have skills
3. Use NOT for exclusions
4. Expand abbreviations
5. Output ONLY the boolean query string.

Generate 3 versions:
BROAD: (wider net)
TARGETED: (balanced)
STRICT: (exact match)
"""

SCORE_PROMPT = """
You are a JD quality evaluator.
Given transcript and generated JD, return ONLY this JSON:
{
  "overall_score": <0-100>,
  "transcript_fidelity_score": <0-100>,
  "completeness_score": <0-100>,
  "section_scores": {
    "role_summary": <0-100>,
    "responsibilities": <0-100>,
    "required_skills": <0-100>,
    "qualifications": <0-100>,
    "company_context": <0-100>
  },
  "missing_critical_info": ["item1"],
  "bias_flags": ["item1"],
  "recommendations": ["item1"]
}
No explanation. Only JSON.
"""

TITLE_EXTRACTION_PROMPT = """
Extract the primary Job Title from this JD.
Output ONLY the job title. Nothing else.
"""
