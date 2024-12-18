import { useUser } from "./use-user";

export function useProAccess() {
  const { user } = useUser();
  
  if (!user) return false;
  
  // User has pro access if they:
  // 1. Are an admin
  // 2. Have a pro subscription
  // 3. Have a valid access code
  return (
    user.isAdmin === true || 
    user.subscriptionStatus === "pro" ||
    user.accessCodeId != null
  );
}
