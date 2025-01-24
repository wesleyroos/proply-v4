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
    staleTime: 0, // Always fetch fresh data
    gcTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  const loginMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const email = userData.email?.trim();
      const password = userData.password;

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data);
      // Invalidate the query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Error",
        description: error.message,
        variant: "destructive",
      });
      queryClient.setQueryData(['user'], null);
    }
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
      queryClient.clear();
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

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Registration failed");
        }

        return data;
      } catch (error: any) {
        const message = error?.message || "An unexpected error occurred";
        toast({
          title: "Registration Error",
          description: message,
          variant: "destructive",
          duration: 7000
        });
        return null;
      }
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['user'] });
        toast({
          title: "Registration successful",
          description: "Welcome to Proply!",
          duration: 3000
        });
      }
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