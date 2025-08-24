import { ApiClient } from './apiClient';
import { UserProfile } from '../types/auth';

export class UserService {
  /**
   * Get complete user profile data from serverless API
   * Endpoint: GET /users/{user_id}
   */
  static async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await ApiClient.makeAuthenticatedRequest(`/users/${userId}`);
      return response.data.user; // Backend returns { user: {...} }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * Endpoint: PUT /users/{user_id}
   */
  static async updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await ApiClient.makeAuthenticatedRequest(`/users/${userId}`, {
        method: 'PUT',
        data: userData
      });
      return response.data.user; // Backend returns { user: {...} }
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}
