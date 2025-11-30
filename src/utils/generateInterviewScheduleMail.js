export const generateInterviewEmail = (
  applicantName,
  jobTitle,
  companyName,
) => {
  const subject = `Interview Invitation for ${jobTitle} at ${companyName}`

  const text = `Dear ${applicantName},

Congratulations! You have been selected for an interview for the position of ${jobTitle} at ${companyName}.

Further details regarding the interview schedule and format will be shared with you shortly.

We look forward to speaking with you and learning more about your qualifications.

Sincerely,
${companyName} Recruitment Team`

  const html = `<p>Dear ${applicantName},</p>
<p>Congratulations! You have been selected for an interview for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
<p>Further details regarding the interview schedule and format will be shared with you shortly.</p>
<p>We look forward to speaking with you and learning more about your qualifications.</p>
<p>Sincerely,<br>${companyName} Recruitment Team</p>`

  return { subject, text, html }
}
