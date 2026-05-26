import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Stack,
} from '@mui/material';
import { Delete as DeleteIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import type { EventDto } from '../services/eventApi';
import { EventType } from '../services/eventApi';
import type { SubjectDto } from '../services/subjectApi';

export type EventFormValues = Omit<EventDto, 'id'> & { id?: number };

type Props = {
  initial?: EventFormValues;
  onCancel: () => void;
  onSave: (values: EventFormValues) => void;
  onDelete?: () => void;
  subjects?: SubjectDto[];
};

const emptyValues: EventFormValues = {
  name: '',
  type: EventType.OTHER,
  description: '',
  capacity: 0,
  subjectId: 0,
};

export default function EventForm({ initial, onCancel, onSave, onDelete, subjects = [] }: Props) {
  const [subjectInitialized, setSubjectInitialized] = useState<boolean>(typeof initial?.subjectId === 'number');
  const [values, setValues] = useState<EventFormValues>(
    initial ?? { ...emptyValues, subjectId: subjects[0]?.id ?? 0 }
  );
  const isEdit = useMemo(() => typeof values.id === 'number', [values.id]);

  useEffect(() => {
    if (initial) return;
    if (!subjectInitialized && subjects.length > 0) {
      setValues((prev) => ({ ...prev, subjectId: subjects[0].id }));
      setSubjectInitialized(true);
    }
  }, [initial, subjects, subjectInitialized]);

  const updateField = (key: keyof EventFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: key === 'capacity' || key === 'subjectId' ? Number(value) : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(values);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
      <Stack spacing={2}>
        <TextField
          label="Name"
          value={values.name}
          onChange={(e) => updateField('name', e.target.value)}
          required
          fullWidth
          variant="outlined"
        />

        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            value={values.type}
            label="Type"
            onChange={(e) => updateField('type', e.target.value)}
          >
            {Object.values(EventType).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Capacity"
          type="number"
          value={values.capacity ?? 0}
          onChange={(e) => updateField('capacity', e.target.value)}
          fullWidth
          variant="outlined"
        />

        {subjects.length > 0 ? (
          <FormControl fullWidth>
            <InputLabel>Subject</InputLabel>
            <Select
              value={values.subjectId ?? 0}
              label="Subject"
              onChange={(e) => updateField('subjectId', e.target.value)}
            >
              <MenuItem value={0}>(none)</MenuItem>
              {subjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            label="Subject ID"
            type="number"
            value={values.subjectId ?? 0}
            onChange={(e) => updateField('subjectId', e.target.value)}
            fullWidth
            variant="outlined"
          />
        )}

        <TextField
          label="Description"
          value={values.description ?? ''}
          onChange={(e) => updateField('description', e.target.value)}
          fullWidth
          multiline
          rows={3}
          variant="outlined"
        />

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
          >
            {isEdit ? 'Save' : 'Create'}
          </Button>
          <Button
            type="button"
            variant="outlined"
            onClick={onCancel}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          {isEdit && onDelete ? (
            <Button
              type="button"
              variant="outlined"
              color="error"
              onClick={onDelete}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}
