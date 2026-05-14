import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  UserDto,
} from '../services/userApi';
import UserForm, { type UserFormValues } from '../components/UserForm';

type UsersPageProps = {
  isAdmin?: boolean;
};

function UsersPage({ isAdmin = false }: UsersPageProps) {
  const [data, setData] = useState<{ content: UserDto[]; totalPages: number; totalElements: number; number: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getUsers(0, 10);
      setData(result);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedFormValues = useMemo<UserFormValues | undefined>(() => {
    if (!selected) return undefined;
    return {
      id: selected.id,
      email: selected.email,
      name: selected.name,
      surname: selected.surname,
      admin: selected.admin,
    };
  }, [selected]);

  const openNewForm = () => {
    setSelected(null);
    setShowForm(true);
  };

  const openEditForm = (item: UserDto) => {
    setSelected(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelected(null);
  };

  const handleSave = async (values: UserFormValues) => {
    try {
      if (values.id) {
        await updateUser(values.id, values);
      } else {
        await createUser(values);
      }
      closeForm();
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to save user');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm('Delete this user?')) return;

    try {
      await deleteUser(selected.id);
      closeForm();
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to delete user');
    }
  };

  const filteredContent = emailSearch
    ? data?.content.filter((user) => user.email.toLowerCase().includes(emailSearch.toLowerCase()))
    : data?.content;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Users</Typography>
        {isAdmin && (
          <Button variant="contained" onClick={openNewForm}>
            + New User
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <TextField
          size="small"
          label="Email contains"
          value={emailSearch}
          onChange={(e) => setEmailSearch(e.target.value)}
        />

        <Button variant="outlined" onClick={() => setEmailSearch('')}>
          Clear Filter
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : (
        <>
          {filteredContent?.length === 0 ? (
            <Typography>No users found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Surname</TableCell>
                    <TableCell>Admin</TableCell>
                    {isAdmin && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredContent?.map((item) => (
                    <TableRow
                      key={item.id}
                      onDoubleClick={() => isAdmin && openEditForm(item)}
                      sx={{ cursor: isAdmin ? 'pointer' : 'default' }}
                    >
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>{item.name ?? ''}</TableCell>
                      <TableCell>{item.surname ?? ''}</TableCell>
                      <TableCell>{item.admin ? 'Yes' : 'No'}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button size="small" onClick={() => openEditForm(item)}>
                            Edit
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {showForm && (
        <Dialog open={showForm} onClose={closeForm} maxWidth="md" fullWidth>
          <DialogTitle>{selected ? 'Edit User' : 'New User'}</DialogTitle>
          <DialogContent>
            <UserForm
              initial={selectedFormValues}
              onCancel={closeForm}
              onSave={handleSave}
              onDelete={selected ? handleDelete : undefined}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}

export default UsersPage as React.FC<UsersPageProps>;
