import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { getReservations, type ReservationDto } from '../services/reservationApi';
import { getHalls, type HallDto } from '../services/hallApi';
import { getEvents, type EventDto } from '../services/eventApi';
import { getUsers, type UserDto } from '../services/userApi';

function CalendarView() {
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [halls, setHalls] = useState<HallDto[]>([]);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [resRes, hallsRes, eventsRes, usersRes] = await Promise.all([
          getReservations(0, 1000),
          getHalls(),
          getEvents(),
          getUsers(0, 1000),
        ]);
        setReservations(resRes.content);
        setHalls(hallsRes.content || hallsRes);
        setEvents(eventsRes.content || eventsRes);
        setUsers(usersRes.content || usersRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentDate);
  const hours = Array.from({ length: 13 }, (_, i) => 8 + i);

  const getReservationsForDate = (date: Date) => {
    return reservations.filter((r) => {
      const rDate = new Date(r.start);
      return rDate.toDateString() === date.toDateString();
    });
  };

  const getReservationsForSlot = (hallId: number, date: Date, hour: number) => {
    return reservations.filter((r) => {
      const rDate = new Date(r.start);
      const rEnd = new Date(r.end);
      return (
        r.hallId === hallId &&
        rDate.toDateString() === date.toDateString() &&
        rDate.getHours() <= hour &&
        rEnd.getHours() > hour
      );
    });
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: number) => {
    const newDate = new Date(selectedDay || currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDay(newDate);
  };

  if (loading) {
    return <Typography>Loading calendar...</Typography>;
  }

  if (viewMode === 'day' && selectedDay) {
    const dayReservations = getReservationsForDate(selectedDay);
    const hallIds = new Set(dayReservations.map((r) => r.hallId));
    const dayHalls = halls.filter((h) => hallIds.has(h.id));

    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            {selectedDay.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
          <Box>
            <Button variant="outlined" onClick={() => navigateDay(-1)} sx={{ mr: 1 }}>
              ← Prev
            </Button>
            <Button variant="outlined" onClick={() => navigateDay(1)} sx={{ mr: 2 }}>
              Next →
            </Button>
            <Button variant="contained" onClick={() => setViewMode('week')}>
              Week View
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                {dayHalls.map((hall) => (
                  <TableCell key={hall.id}>{hall.name}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {hours.map((hour) => (
                <TableRow key={hour}>
                  <TableCell>{hour}:00</TableCell>
                  {dayHalls.map((hall) => {
                    const res = getReservationsForSlot(hall.id, selectedDay, hour);
                    return (
                      <TableCell key={`${hall.id}-${hour}`}>
                        {res.slice(0, 1).map((r) => {
                          const event = events.find((e) => e.id === r.eventId);
                          const user = users.find((u) => u.id === r.userId);
                          return (
                          <Card key={r.id} sx={{ mb: 1 }}>
                              <CardContent sx={{ p: 1 }}>
                                <Typography variant="caption" display="block">
                                  {event?.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {user?.name}
                                </Typography>
                                <Chip label={r.status} size="small" />
                              </CardContent>
                            </Card>
                          );
                        })}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigateWeek(-1)}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h5">
            Week of {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
          </Typography>
          <IconButton onClick={() => navigateWeek(1)}>
            <ChevronRight />
          </IconButton>
        </Box>
        <Button variant="contained" onClick={() => {
          setSelectedDay(new Date());
          setViewMode('day');
        }}>
          Day View
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflowX: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `150px repeat(7, 1fr)`, minWidth: 'fit-content', height: '100%' }}>
          {/* Header */}
          <Box sx={{ borderBottom: '1px solid #ddd', p: 1 }} />
          {weekDates.map((date, index) => (
            <Box
              key={date.toISOString()}
              sx={{
                borderLeft: index === 0 ? 'none' : '1px solid #ddd',
                borderBottom: '1px solid #ddd',
                p: 1,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Typography variant="subtitle2" align="center">
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Typography>
            </Box>
          ))}

          {/* Halls */}
          {halls.map((hall) => (
            <React.Fragment key={`hall-group-${hall.id}`}>
              <Box
                sx={{
                  borderTop: '1px solid #ddd',
                  borderRight: '1px solid #ddd',
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2">
                  {hall.name}
                </Typography>
              </Box>
              {weekDates.map((date, index) => {
                const dayReservations = getReservationsForDate(date).filter((r) => r.hallId === hall.id);
                return (
                  <Box
                    key={`${hall.id}-${date.toISOString()}`}
                    sx={{
                      borderLeft: index === 0 ? 'none' : '1px solid #ddd',
                      borderTop: '1px solid #ddd',
                      p: 1,
                      minHeight: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                    }}
                  >
                    {dayReservations.map((r) => {
                      const event = events.find((e) => e.id === r.eventId);
                      const user = users.find((u) => u.id === r.userId);
                      return (
                        <Card
                          key={r.id}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 3 },
                            flex: 1,
                            minHeight: 40,
                          }}
                        >
                          <CardContent sx={{ p: 1 }}>
                            <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                              {event?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {new Date(r.start).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {user?.name}
                            </Typography>
                            <Chip label={r.status} size="small" sx={{ mt: 0.5 }} />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                );
              })}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default CalendarView;