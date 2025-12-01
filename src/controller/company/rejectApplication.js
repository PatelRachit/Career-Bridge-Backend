import { STATUS_CODE } from '../../constant/index.js'
import Recruiter from '../../model/recruiter.js'
import { handleError } from '../../utils/index.js'
import { sendEmail } from '../../utils/sendMail.js'
import { generateRejectionEmail } from '../../utils/generateRejectionMail.js'

export const rejectApplication = async (req, res) => {
  try {
    const { applicant_id, job_id } = req.body

    await Recruiter.rejectApplication(job_id, applicant_id)

    const item = await Recruiter.getApplicantsByJob(job_id, 'pending')

    const user = await Recruiter.getApplicantById(applicant_id)

    const applicant = user?.[0]

    if (applicant) {
      const emailContent = generateRejectionEmail(
        applicant.first_name,
        item.job_title,
        item.company_name,
      )
      await sendEmail({
        to: applicant.email,
        ...emailContent,
      })
    }
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    console.log(error)
    handleError(res, error)
  }
}
