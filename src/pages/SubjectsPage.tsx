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
  createSubject,
  deleteSubject,
  getSubjects,
  searchSubjects,
  SubjectDto,
  updateSubject,
} from '../services/subjectApi';
import SubjectForm, { type SubjectFormValues } from '../components/SubjectForm';

type SubjectsPageProps = {
  isAdmin?: boolean;
};

// Subjects page component - accepts isAdmin prop
function SubjectsPage({ isAdmin = false }: SubjectsPageProps) {
  const [data, setData] = useState<{ content: SubjectDto[]; totalPages: number; totalElements: number; number: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SubjectDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nameSearch, setNameSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = nameSearch ? await searchSubjects(nameSearch, 0, 10) : await getSubjects(0, 10);
      setData(result);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameSearch]);

  const selectedFormValues = useMemo<SubjectFormValues | undefined>(() => {
    if (!selected) return undefined;
    return {
      id: selected.id,
      name: selected.name,
      code: selected.code,
    };
  }, [selected]);

  const openNewForm = () => {
    setSelected(null);
    setShowForm(true);
  };

  const openEditForm = (item: SubjectDto) => {
    setSelected(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelected(null);
  };

  const handleSave = async (values: SubjectFormValues) => {
    try {
      if (values.id) {
        await updateSubject(values.id, values);
      } else {
        await createSubject(values);
      }
      closeForm();
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to save subject');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm('Delete this subject?')) return;

    try {
      await deleteSubject(selected.id);
      closeForm();
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to delete subject');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Subjects</Typography>
        {isAdmin && (
          <Button variant="contained" onClick={openNewForm}>
            + New Subject
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <TextField
          size="small"
          label="Name contains"
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
        />

        <Button variant="outlined" onClick={() => setNameSearch('')}>
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
          {data?.content.length === 0 ? (
            <Typography>No subjects found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    {isAdmin && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.content.map((item) => (
                    <TableRow
                      key={item.id}
                      onDoubleClick={() => isAdmin && openEditForm(item)}
                      sx={{ cursor: isAdmin ? 'pointer' : 'default' }}
                    >
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
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
          <DialogTitle>{selected ? 'Edit Subject' : 'New Subject'}</DialogTitle>
          <DialogContent>
            <SubjectForm
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

export default SubjectsPage as React.FC<SubjectsPageProps>;
