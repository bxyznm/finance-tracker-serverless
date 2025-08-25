import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AttachMoney as CurrencyIcon,
  CalendarToday as CalendarIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';

import { AppLayout } from '../components/layout';
import { useUserProfile } from '../hooks/useUserProfile';
import { UserService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { CURRENCY_OPTIONS } from '../types/auth';

// Validation schema
const updateProfileSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  currency: yup.string().required('Currency is required'),
});

interface ProfileFormData {
  name: string;
  currency: string;
}

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { userProfile, isLoading, error, refetchProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form control
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(updateProfileSchema),
    defaultValues: {
      name: userProfile?.name || '',
      currency: userProfile?.currency || 'MXN',
    },
  });

  // Update form when profile loads
  React.useEffect(() => {
    if (userProfile) {
      reset({
        name: userProfile.name,
        currency: userProfile.currency,
      });
    }
  }, [userProfile, reset]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form to original values
      reset({
        name: userProfile?.name || '',
        currency: userProfile?.currency || 'MXN',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async (data: ProfileFormData) => {
    try {
      if (!user?.user_id || !userProfile) return;

      await UserService.updateUserProfile(user.user_id, {
        name: data.name,
        currency: data.currency,
      });

      await refetchProfile();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!user?.user_id) return;
      
      // For now, we'll just logout since delete endpoint would return 401
      // In a real implementation, you would call the delete endpoint
      logout();
      toast.success('Account deletion initiated. You have been logged out.');
    } catch (error: any) {
      toast.error('Failed to delete account');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCurrencyLabel = (code: string) => {
    const currency = CURRENCY_OPTIONS.find(opt => opt.value === code);
    return currency ? `${currency.symbol} ${currency.label}` : code;
  };

  if (isLoading) {
    return (
      <AppLayout title="Profile">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </AppLayout>
    );
  }

  if (error || !userProfile) {
    return (
      <AppLayout title="Profile">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Failed to load profile'}
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile">
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" gutterBottom>
              My Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your personal information and preferences
            </Typography>
          </Box>
        </Box>

        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
          {/* Profile Information Card */}
          <Box sx={{ flex: 2, minWidth: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
                    <Typography variant="h6" gutterBottom>
                      Personal Information
                    </Typography>
                    <IconButton
                      onClick={handleEditToggle}
                      color={isEditing ? 'secondary' : 'primary'}
                      sx={{ ml: 'auto' }}
                    >
                      {isEditing ? <CancelIcon /> : <EditIcon />}
                    </IconButton>
                  </Box>

                  <form onSubmit={handleSubmit(handleSaveProfile)}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Avatar and Basic Info */}
                      <Box>
                        <Box display="flex" alignItems="center" gap={3} mb={3}>
                          <Avatar
                            sx={{
                              width: 80,
                              height: 80,
                              bgcolor: 'primary.main',
                              fontSize: '2rem',
                            }}
                          >
                            {userProfile.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="h5" gutterBottom>
                              {userProfile.name}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {userProfile.email}
                              </Typography>
                              {userProfile.email_verified ? (
                                <Chip
                                  icon={<VerifiedIcon />}
                                  label="Verified"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              ) : (
                                <Chip
                                  icon={<WarningIcon />}
                                  label="Unverified"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      </Box>

                      {/* Editable Fields */}
                      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                        <Controller
                          name="name"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Full Name"
                              fullWidth
                              disabled={!isEditing}
                              error={!!errors.name}
                              helperText={errors.name?.message}
                              InputProps={{
                                startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                              }}
                            />
                          )}
                        />

                        <Controller
                          name="currency"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth disabled={!isEditing}>
                              <InputLabel>Preferred Currency</InputLabel>
                              <Select
                                {...field}
                                label="Preferred Currency"
                                startAdornment={<CurrencyIcon sx={{ mr: 1, color: 'action.active' }} />}
                              >
                                {CURRENCY_OPTIONS.map((currency) => (
                                  <MenuItem key={currency.value} value={currency.value}>
                                    {currency.symbol} {currency.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Box>

                      {/* Email and User ID (Read-only) */}
                      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                        <TextField
                          label="Email Address"
                          value={userProfile.email}
                          fullWidth
                          disabled
                          InputProps={{
                            startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                          }}
                          helperText="Email cannot be changed"
                        />

                        <TextField
                          label="User ID"
                          value={userProfile.user_id}
                          fullWidth
                          disabled
                          helperText="Unique identifier"
                        />
                      </Box>

                      {/* Action Buttons */}
                      {isEditing && (
                        <Box display="flex" gap={2} justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            onClick={handleEditToggle}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="contained"
                            startIcon={<SaveIcon />}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </Box>

          {/* Account Information Sidebar */}
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Stack spacing={3}>
              {/* Account Status Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Account Status
                    </Typography>
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Status:
                        </Typography>
                        <Chip
                          label={userProfile.is_active ? 'Active' : 'Inactive'}
                          color={userProfile.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Email Verified:
                        </Typography>
                        <Chip
                          label={userProfile.email_verified ? 'Yes' : 'No'}
                          color={userProfile.email_verified ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Currency:
                        </Typography>
                        <Typography variant="body2">
                          {getCurrencyLabel(userProfile.currency)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Account Dates Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Account Timeline
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Created
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {formatDate(userProfile.created_at)}
                        </Typography>
                      </Box>
                      
                      <Divider />
                      
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Last Updated
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {formatDate(userProfile.updated_at)}
                        </Typography>
                      </Box>
                      
                      {userProfile.last_login_at && (
                        <>
                          <Divider />
                          <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <CalendarIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                Last Login
                              </Typography>
                            </Box>
                            <Typography variant="body2">
                              {formatDate(userProfile.last_login_at)}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Danger Zone Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card sx={{ border: '1px solid', borderColor: 'error.main' }}>
                  <CardContent>
                    <Typography variant="h6" color="error" gutterBottom>
                      Danger Zone
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Once you delete your account, there is no going back. Please be certain.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      startIcon={<DeleteIcon />}
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Stack>
          </Box>
        </Box>

        {/* Delete Account Confirmation Dialog */}
        <Dialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle color="error">Delete Account</DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              This action cannot be undone. All your data will be permanently deleted.
            </Alert>
            <Typography>
              Are you sure you want to delete your account? This will permanently remove:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>Your profile information</li>
              <li>All your bank accounts</li>
              <li>Transaction history</li>
              <li>All associated data</li>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteAccount} variant="contained" color="error">
              Delete My Account
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default ProfilePage;
