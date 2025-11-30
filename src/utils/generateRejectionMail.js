export const generateRejectionEmail = (
  applicantName,
  jobTitle,
  companyName,
) => {
  const subject = `Application Update for ${jobTitle} at ${companyName}`

  const text = `Dear ${applicantName},

Thank you for taking the time to apply for the position of ${jobTitle} at ${companyName}. We appreciate your interest in our company and the effort you put into your application.

After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.

We encourage you to apply for future openings that match your skills and experience.

We wish you the very best in your job search and future endeavors.

Sincerely,
${companyName} Recruitment Team`

  const html = `<p>Dear ${applicantName},</p>
<p>Thank you for taking the time to apply for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>. We appreciate your interest in our company and the effort you put into your application.</p>
<p>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>
<p>We encourage you to apply for future openings that match your skills and experience.</p>
<p>We wish you the very best in your job search and future endeavors.</p>
<p>Sincerely,<br>${companyName} Recruitment Team</p>`

  return { subject, text, html }
}
