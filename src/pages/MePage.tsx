import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../services/userApi';

function MePage() {
  const { user } = useAuth();

  const [editMode, setEditMode] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name ?? '',
    surname: user?.surname ?? '',
    email: user?.email ?? '',
  });

  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    surname: user?.surname ?? '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    repeatPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordDialog, setPasswordDialog] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name ?? '',
        surname: user.surname ?? '',
        email: user.email ?? '',
      });

      setFormData({
        name: user.name ?? '',
        surname: user.surname ?? '',
      });
    }
  }, [user]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleEdit = () => {
    clearMessages();
    setEditMode(true);
    setFormData({
      name: profileData.name,
      surname: profileData.surname,
    });
  };

  const handleCancel = () => {
    clearMessages();
    setEditMode(false);
    setFormData({
      name: profileData.name,
      surname: profileData.surname,
    });
  };

  const handleSave = async () => {
    if (!user) return;

    clearMessages();

    try {
      const updatedUser = await updateMe({
  name: formData.name,
  surname: formData.surname,
  email: profileData.email,
  admin: user.admin ?? false,
});

      setProfileData({
        name: updatedUser.name ?? formData.name,
        surname: updatedUser.surname ?? formData.surname,
        email: updatedUser.email ?? profileData.email,
      });

      setSuccess('Profile updated successfully');
      setEditMode(false);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to update profile');
    }
  };

  const handleOpenPasswordDialog = () => {
    clearMessages();
    setPasswordData({
      newPassword: '',
      repeatPassword: '',
    });
    setPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialog(false);
    setPasswordData({
      newPassword: '',
      repeatPassword: '',
    });
  };

  const handleChangePassword = async () => {
    clearMessages();
    if (!user) {
    setError('Not authenticated');
    return;
  }

    if (!passwordData.newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (passwordData.newPassword !== passwordData.repeatPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await updateMe({
  password: passwordData.newPassword,
  admin: user.admin ?? false,
});

      setSuccess('Password changed successfully');
      handleClosePasswordDialog();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to change password');
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Profile
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Name"
            value={editMode ? formData.name : profileData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
              })
            }
            disabled={!editMode}
          />

          <TextField
            fullWidth
            label="Surname"
            value={editMode ? formData.surname : profileData.surname}
            onChange={(e) =>
              setFormData({
                ...formData,
                surname: e.target.value,
              })
            }
            disabled={!editMode}
          />

          <TextField
            fullWidth
            label="Email"
            value={profileData.email}
            disabled
          />
        </Box>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          {!editMode ? (
            <>
              <Button variant="contained" onClick={handleEdit}>
                Edit Profile
              </Button>

              <Button variant="outlined" onClick={handleOpenPasswordDialog}>
                Change Password
              </Button>
            </>
          ) : (
            <>
              <Button variant="contained" onClick={handleSave}>
                Save
              </Button>

              <Button variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Paper>

      <Dialog open={passwordDialog} onClose={handleClosePasswordDialog}>
        <DialogTitle>Change Password</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                newPassword: e.target.value,
              })
            }
          />

          <TextField
            fullWidth
            margin="dense"
            label="Repeat New Password"
            type="password"
            value={passwordData.repeatPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                repeatPassword: e.target.value,
              })
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleChangePassword}>
            Change
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MePage;