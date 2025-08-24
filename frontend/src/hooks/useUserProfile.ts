import { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { UserProfile } from '../types/auth';
import { getUserFromToken } from '../utils/jwt';
import { toast } from 'react-hot-toast';

interface UseUserProfileReturn {
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetchProfile: () => void;
}

/**
 * Hook to fetch complete user profile from API
 * Gets user_id from JWT token and fetches profile from serverless API
 */
export const useUserProfile = (): UseUserProfileReturn => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user_id from JWT token
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No access token found');
        return;
      }

      const tokenUser = getUserFromToken(token);
      if (!tokenUser) {
        setError('Could not decode user from token');
        return;
      }

      // Fetch complete profile from API
      const profile = await UserService.getUserProfile(tokenUser.user_id);
      setUserProfile(profile);
    } catch (err: any) {
      const errorMessage = err.message || 'Error loading user profile';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return {
    userProfile,
    isLoading,
    error,
    refetchProfile: fetchUserProfile
  };
};
