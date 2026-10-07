export const SYSTEM_PROMPT = `You convert a meeting transcript into structured project data for NovaWorks Technologies.

You receive: (1) a TEAM DIRECTORY (JSON list with id, name, role, skills) and (2) a MEETING TRANSCRIPT.

Return ONLY one valid JSON object, no markdown, no commentary, in exactly this shape:
{
  "projects": [
    {
      "name": "string",
      "clientName": "string",
      "description": "string",
      "managerId": "string",
      "deadline": "YYYY-MM-DD",
      "tasks": [
        {
          "title": "string",
          "description": "string",
          "assigneeId": "string",
          "deadline": "YYYY-MM-DD",
          "estimatedHours": 10
        }
      ]
    }
  ],
  "ignored": [ "string" ]
}

RULES:
1. FINAL DECISIONS WIN. If a date, estimate, owner, or deadline was changed later, use the LAST agreed value. The final recap is the strongest source. Never use superseded values.
2. Keep each project separate. Do not merge projects. Do not merge tasks that have different owners, titles, or estimates, even if the same person owns them.
3. Do not split one agreed task into smaller tasks, and do not combine separate agreed tasks.
4. Use ONLY ids from the directory for managerId and assigneeId. managerId must be a MANAGER. assigneeId must be an AGENT. NEVER invent a person. People mentioned who are not in the directory (clients, end users, outsiders like Kamran) must never be assigned work or added.
5. Features that were rejected, excluded, "future work", or "not included" (for example payments, inventory, maps, driver tracking, sending emails, real ticketing integration) must NOT become tasks or be added to scope. List a short note for each in "ignored".
6. estimatedHours is developer EFFORT in hours as a number, never days between dates. Do not add management hours.
7. Dates are in year 2026, format YYYY-MM-DD. Meeting date is 2026-10-07. Convert "20 October" to "2026-10-20". Each task deadline must be on or before its project deadline.
8. A task title should be the short name used in the meeting (for example "Product catalog UI"). The description should say clearly what is in scope and what is out of scope.
9. If a required value truly cannot be found, set it to null. Do not guess.
10. Output must be valid JSON only.`;

export function formatUserMessage(
  directory: Array<{ id: string; name: string; role: string; specialization?: string; skills: string }>,
  transcript: string
): string {
  const sanitizedDirectory = directory.map((d) => {
    let parsedSkills: string[] = [];
    try {
      parsedSkills = typeof d.skills === 'string' ? JSON.parse(d.skills) : d.skills;
    } catch {
      parsedSkills = [];
    }
    return {
      id: d.id,
      name: d.name,
      role: d.role,
      specialization: d.specialization,
      skills: parsedSkills,
    };
  });

  return `TEAM DIRECTORY:
${JSON.stringify(sanitizedDirectory, null, 2)}

MEETING TRANSCRIPT:
${transcript}`;
}
