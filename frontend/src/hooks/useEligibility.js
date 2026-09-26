import { useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Custom hook to check if a student is eligible for a specific drive.
 * @param {Object} drive - The drive object containing eligibility criteria.
 * @returns {Object} { isEligible, reason, isProfileIncomplete }
 */
const useEligibility = (drive) => {
  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.profile);

  const eligibility = useMemo(() => {
    if (!drive || !user) return { isEligible: false, reason: 'Loading...', isProfileIncomplete: true };

    // 1. Check if profile exists and is complete enough
    // We consider it incomplete if major academic fields are missing
    const isProfileIncomplete = !profile || 
                                profile.cgpa === null || 
                                profile.tenthPercentage === null || 
                                profile.twelfthPercentage === null;

    if (isProfileIncomplete) {
      return { 
        isEligible: false, 
        reason: 'Please complete your academic profile first.', 
        isProfileIncomplete: true 
      };
    }

    // 2. Check CGPA
    if (profile.cgpa < drive.eligibility.minCgpa) {
      return { 
        isEligible: false, 
        reason: `Minimum CGPA required: ${drive.eligibility.minCgpa}. Your CGPA: ${profile.cgpa}`, 
        isProfileIncomplete: false 
      };
    }

    // 3. Check 10th Percentage
    if (profile.tenthPercentage < drive.eligibility.minTenthPercent) {
      return { 
        isEligible: false, 
        reason: `Minimum 10th percentage required: ${drive.eligibility.minTenthPercent}%.`, 
        isProfileIncomplete: false 
      };
    }

    // 4. Check 12th Percentage
    if (profile.twelfthPercentage < drive.eligibility.minTwelfthPercent) {
      return { 
        isEligible: false, 
        reason: `Minimum 12th percentage required: ${drive.eligibility.minTwelfthPercent}%.`, 
        isProfileIncomplete: false 
      };
    }

    // 5. Check Backlogs
    if (profile.backlogs > drive.eligibility.maxBacklogs) {
      return { 
        isEligible: false, 
        reason: `Maximum backlogs allowed: ${drive.eligibility.maxBacklogs}. You have: ${profile.backlogs}`, 
        isProfileIncomplete: false 
      };
    }

    // 6. Check Branch (Department)
    const isBranchEligible = drive.eligibility.eligibleBranches.length === 0 || 
                             drive.eligibility.eligibleBranches.includes(user.department);
    
    if (!isBranchEligible) {
      return { 
        isEligible: false, 
        reason: `Your department (${user.department}) is not eligible for this drive.`, 
        isProfileIncomplete: false 
      };
    }

    // 7. Check Resume
    if (!profile.resumeUrl) {
      return { 
        isEligible: false, 
        reason: 'Please upload your resume in the profile section.', 
        isProfileIncomplete: false 
      };
    }

    // If all checks pass
    return { isEligible: true, reason: 'You meet all eligibility criteria!', isProfileIncomplete: false };

  }, [drive, user, profile]);

  return eligibility;
};

export default useEligibility;
