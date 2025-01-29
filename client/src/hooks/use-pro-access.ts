import { useUser } from "./use-user";

export function useProAccess() {
  const { user, isLoading } = useUser();
  
  const hasAccess = user ? (
    user.isAdmin === true || 
    user.subscriptionStatus === "pro" ||
    user.accessCodeId != null
  ) : false;

  return {
    hasAccess,
    isLoading
  };
}
