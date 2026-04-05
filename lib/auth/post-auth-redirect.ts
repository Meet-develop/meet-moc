export const PROFILE_COMPLETION_THRESHOLD = 100;

type RedirectDecisionInput = {
  hasSessionUserId: boolean;
  profileRequestOk: boolean;
  completionRate?: number;
};

export const decidePostAuthRedirect = ({
  hasSessionUserId,
  profileRequestOk,
  completionRate = 0,
}: RedirectDecisionInput): "/login" | "/profile/setup" | "/" => {
  if (!hasSessionUserId) {
    return "/login";
  }

  if (!profileRequestOk) {
    return "/profile/setup";
  }

  if (completionRate >= PROFILE_COMPLETION_THRESHOLD) {
    return "/";
  }

  return "/profile/setup";
};
