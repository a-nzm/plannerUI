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
  subjectId: null,
};

export default function EventForm({ initial, onCancel, onSave, onDelete, subjects = [] }: Props) {
  const [values, setValues] = useState<EventFormValues>(initial ?? emptyValues);

  useEffect(() => {
    if (initial) {
      setValues(initial);
    }
  }, [initial]);

  const isEdit = useMemo(() => typeof values.id === 'number', [values.id]);

  const updateField = (key: keyof EventFormValues, value: string | number | null) => {
    setValues((prev) => {
      let newValue: string | number | null = value;

      if (key === 'capacity') {
        newValue = Number(value);
      }

      if (key === 'subjectId') {
        newValue = value === '' || value == null ? null : Number(value);
      }

      return {
        ...prev,
        [key]: newValue,
      };
    });
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

        <FormControl fullWidth>
          <InputLabel>Subject</InputLabel>
          <Select
            value={values.subjectId ?? ''}
            label="Subject"
            onChange={(e) => updateField('subjectId', e.target.value)}
          >
            <MenuItem value="">(none)</MenuItem>
            {subjects.map((subject) => (
              <MenuItem key={subject.id} value={subject.id}>
                {subject.code} - {subject.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
