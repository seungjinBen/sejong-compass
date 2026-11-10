import { getMe, getMajors, getCareerGoal, getOnboarding, getCertifications, projects, internships, awards } from './me';
import { isApiError } from './http';
import type { BackendProfile } from './backend';
import type { UserProfile, TargetCondition, OnboardingView, OnboardingStep } from '@/types';

/** 프론트 기준 "온보딩 완료"로 간주하는 필수 단계 */
export const REQUIRED_ONBOARDING_STEPS: OnboardingStep[] = ['BASIC_INFO', 'MAJORS', 'PREFERENCES'];

export function isOnboardingComplete(view: OnboardingView | null): boolean {
  if (!view) return false;
  return REQUIRED_ONBOARDING_STEPS.every(
    (step) => view.steps.find((s) => s.step === step)?.status === 'COMPLETED',
  );
}

export interface Session {
  profile: UserProfile;
  target: TargetCondition | null;
}

/**
 * 로그인 세션이 있으면 프로필·전공·이력·온보딩 상태를 모아 UserProfile 로 조립한다.
 * 세션이 없으면(401) null.
 */
export async function loadSession(): Promise<Session | null> {
  let me: BackendProfile;
  try {
    me = await getMe();
  } catch (e) {
    if (isApiError(e) && e.status === 401) return null;
    throw e;
  }
  return loadSessionFor(me);
}

/** 로그인 직후처럼 BackendProfile 을 이미 받은 경우 */
export async function loadSessionFor(me: BackendProfile): Promise<Session> {
  const [onboarding, majors, target, certificationCodes, projectList, internshipList, awardList] =
    await Promise.all([
      getOnboarding(),
      getMajors(),
      getCareerGoal(),
      getCertifications(),
      projects.list(),
      internships.list(),
      awards.list(),
    ]);

  const profile: UserProfile = {
    id: me.id,
    schoolEmail: me.schoolEmail,
    name: me.name,
    isTransfer: me.isTransfer,
    emailVerified: me.emailVerified,
    semester: me.semester,
    gpa: me.gpa,
    gpaScale: me.gpaScale,
    majors,
    certificationCodes,
    projects: projectList,
    internships: internshipList,
    awards: awardList,
    onboarding,
    onboardingCompleted: isOnboardingComplete(onboarding),
  };

  return { profile, target };
}
