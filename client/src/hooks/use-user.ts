import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InsertUser, SelectUser } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

type RequestResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: InsertUser
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status >= 500) {
        return { ok: false, message: response.statusText };
      }

      const message = await response.text();
      return { ok: false, message };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e.toString() };
  }
}

async function fetchUser(): Promise<SelectUser | null> {
  const response = await fetch('/api/user', {
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }

    if (response.status >= 500) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    throw new Error(`${response.status}: ${await response.text()}`);
  }

  return response.json();
}

export function useUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<SelectUser | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false
  });

  const loginMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
          credentials: 'include'
        });

        if (!response.ok) {
          const message = await response.text();
          const errorMessage = message.includes("Incorrect password") 
            ? "The password you entered is incorrect. Please try again."
            : message.includes("Incorrect username")
            ? "We couldn't find an account with that username."
            : "Login failed. Please check your credentials and try again.";
          
          toast({
            title: "Authentication Error",
            description: errorMessage,
            variant: "destructive",
            duration: 5000
          });
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const result = await handleRequest('/api/logout', 'POST');
      if (!result.ok) {
        toast({
          title: "Logout failed",
          description: result.message,
          variant: "destructive"
        });
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
          credentials: 'include'
        });

        if (!response.ok) {
          const message = await response.text();
          toast({
            title: "Registration Failed",
            description: message,
            variant: "destructive",
            duration: 5000
          });
          throw new Error(message);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Registration failed";
        toast({
          title: "Registration Error",
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: "Registration successful",
        description: "Welcome to Proply!",
        duration: 3000
      });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}