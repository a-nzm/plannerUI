 import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
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
  const timelineStartHour = 8;
  const timelineEndHour = 21;
  const hourHeight = 48;

  const getReservationsForDate = (date: Date) => {
    return reservations.filter((r) => {
      const rDate = new Date(r.start);
      const rEndDate = new Date(r.end);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      rDate.setHours(0, 0, 0, 0);
      rEndDate.setHours(0, 0, 0, 0);
      return checkDate >= rDate && checkDate <= rEndDate;
    });
  };

  const getStatusStyles = (status: ReservationDto['status']) => {
    switch (status) {
      case 'APPROVED':
        return { background: '#e6f4ea', border: '#7cc47f' };
      case 'REJECTED':
        return { background: '#fbe5e7', border: '#d46b6b' };
      case 'PENDING':
        return { background: '#e8f0fb', border: '#5f8ccf' };
      case 'CANCELLED':
        return { background: '#f2f2f2', border: '#9e9e9e' };
      default:
        return { background: '#f7f7f7', border: '#ccc' };
    }
  };

  const getTimeFraction = (date: Date) => date.getHours() + date.getMinutes() / 60;

  const getReservationPosition = (reservation: ReservationDto, selectedDate?: Date) => {
    const start = new Date(reservation.start);
    const end = new Date(reservation.end);
    const checkDate = selectedDate || new Date();
    checkDate.setHours(0, 0, 0, 0);
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    
    // For multi-day events, clamp to the selected day
    let startValue = getTimeFraction(start);
    let endValue = getTimeFraction(end);
    
    // If event starts before this day, start from timeline start
    if (startDate < checkDate) {
      startValue = timelineStartHour;
    }
    // If event ends after this day, end at timeline end
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);
    if (endDate > checkDate) {
      endValue = timelineEndHour;
    }
    
    startValue = Math.max(timelineStartHour, startValue);
    endValue = Math.min(timelineEndHour, endValue);
    
    const top = Math.max(0, (startValue - timelineStartHour) * hourHeight);
    const height = Math.max(40, (endValue - startValue) * hourHeight);
    const left = ((startValue - timelineStartHour) / (timelineEndHour - timelineStartHour)) * 100;
    const width = ((endValue - startValue) / (timelineEndHour - timelineStartHour)) * 100;
    
    return { top, height, left, width };
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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Header with hour labels */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 1 }}>
            <Box />
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${timelineEndHour - timelineStartHour}, 1fr)`, gap: 0 }}>
              {hours.map((hour) => (
                <Box
                  key={hour}
                  sx={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    py: 0.5,
                    borderLeft: '1px solid #eee',
                  }}
                >
                  {hour}:00
                </Box>
              ))}
            </Box>
          </Box>

          {/* Halls */}
          {halls.map((hall) => {
            const hallReservations = dayReservations.filter((r) => r.hallId === hall.id);
            return (
              <Box key={hall.id} sx={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 1 }}>
                <Box
                  sx={{
                    p: 1,
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    bgcolor: '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {hall.name}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    position: 'relative',
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    minHeight: 140,
                    bgcolor: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  {hallReservations.map((r) => {
                    const event = events.find((e) => e.id === r.eventId);
                    const user = users.find((u) => u.id === r.userId);
                    const statusStyle = getStatusStyles(r.status);
                    const { left, width } = getReservationPosition(r, selectedDay);

                    return (
                      <Card
                        key={r.id}
                        sx={{
                          position: 'absolute',
                          top: 10,
                          left: `calc(${left}% + 4px)`,
                          width: `calc(${width}% - 8px)`,
                          height: 'calc(100% - 20px)',
                          minHeight: 96,
                          backgroundColor: statusStyle.background,
                          borderLeft: `4px solid ${statusStyle.border}`,
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          zIndex: 10,
                        }}
                      >
                        <CardContent sx={{ p: 0.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                              {event?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                              {user?.name} {user?.surname}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" display="block" sx={{ mb: 0.25, fontSize: '0.65rem' }}>
                              {new Date(r.start).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {new Date(r.end).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                            <Chip
                              label={r.status}
                              size="small"
                              sx={{
                                backgroundColor: statusStyle.border,
                                color: '#fff',
                                fontWeight: 700,
                                height: '20px',
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
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
                      const statusStyle = getStatusStyles(r.status);
                      const durationHours = Math.max(
                        0.5,
                        (new Date(r.end).getTime() - new Date(r.start).getTime()) / 36e5
                      );
                      const cardHeight = Math.min(140, 40 + durationHours * 16);
                      
                      const startDate = new Date(r.start);
                      const endDate = new Date(r.end);
                      const dayDate = new Date(date);
                      dayDate.setHours(0, 0, 0, 0);
                      startDate.setHours(0, 0, 0, 0);
                      endDate.setHours(0, 0, 0, 0);
                      
                      const isMultiDay = startDate < dayDate || endDate > dayDate;

                      return (
                        <Card
                          key={r.id}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 3 },
                            backgroundColor: statusStyle.background,
                            borderLeft: `4px solid ${statusStyle.border}`,
                            minHeight: cardHeight,
                            position: 'relative',
                          }}
                        >
                          {isMultiDay && (
                            <Box sx={{ position: 'absolute', top: 4, right: 4, fontSize: '0.65rem', bgcolor: 'rgba(0,0,0,0.15)', px: 0.5, borderRadius: 0.5, whiteSpace: 'nowrap' }}>
                              Multi-day
                            </Box>
                          )}
                          <CardContent sx={{ p: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {event?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {new Date(r.start).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {' - '}
                              {new Date(r.end).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {user?.name}
                            </Typography>
                            <Chip
                              label={r.status}
                              size="small"
                              sx={{
                                mt: 0.5,
                                backgroundColor: statusStyle.border,
                                color: '#fff',
                                fontWeight: 700,
                              }}
                            />
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