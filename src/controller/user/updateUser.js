import { STATUS_CODE } from '../../constant/statusCode.js'
import { handleError } from '../../utils/handleError.js'
import Applicant from '../../model/Applicant.js'
import pool from '../../config/mysql.js'

const updateProfile = async (req, res) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const applicantId = req.user.user_id
    const {
      first_name,
      last_name,
      email,
      phone_number,
      resume_link, // Added resume_link
      skills,
      experience,
      education,
    } = req.body

    // 1. Update Applicant table
    const basicUpdates = {}

    if (first_name) basicUpdates.first_name = first_name
    if (last_name) basicUpdates.last_name = last_name
    if (email) basicUpdates.email = email
    if (phone_number) basicUpdates.phone_number = phone_number

    await Applicant.updateBasicInfo(connection, applicantId, basicUpdates)

    if (resume_link) {
      await Applicant.updateResumeLink(connection, resume_link, applicantId)
    }
    // 2. Update Skills (delete all & insert new)
    if (skills && Array.isArray(skills)) {
      await Applicant.deleteAllSkills(connection, applicantId)

      for (const skillName of skills) {
        const skillId = await Applicant.findOrCreateSkill(connection, skillName)
        await Applicant.addSkillToApplicant(connection, applicantId, skillId)
      }
    }

    // 3. Update Experience (delete all & insert new)
    if (experience && Array.isArray(experience)) {
      await Applicant.deleteAllExperience(connection, applicantId)

      for (const exp of experience) {
        await Applicant.createExperience(connection, applicantId, exp)
      }
    }

    // 4. Update Education (delete all & insert new)
    if (education && Array.isArray(education)) {
      await Applicant.deleteAllEducation(connection, applicantId)

      for (const edu of education) {
        await Applicant.createEducation(connection, applicantId, edu)
      }
    }

    await connection.commit()

    // Fetch updated profile
    const updatedProfile = await Applicant.findById(applicantId)

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    })
  } catch (error) {
    await connection.rollback()
    handleError(res, error)
  } finally {
    connection.release()
  }
}

export { updateProfile }
