import { useState, ComponentType } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { AuthProvider, useAuth } from './context/AuthContext';
import ReservationsPage from './pages/ReservationsPage';
import EventsPage from './pages/EventsPage';
import HallsPage from './pages/HallsPage';
import SubjectsPageComponent from './pages/SubjectsPage';
import UsersPageComponent from './pages/UsersPage';
import MePage from './pages/MePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CalendarView from './components/CalendarView';

type PageProps = { isAdmin?: boolean };
type View = 'home' | 'reservations' | 'events' | 'halls' | 'subjects' | 'users' | 'me';

const SubjectsPage = SubjectsPageComponent as ComponentType<PageProps>;
const UsersPage = UsersPageComponent as ComponentType<PageProps>;

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function AppContent() {
  const { user, logout, isAdmin } = useAuth();
  const [view, setView] = useState<View>('home');
  const [showRegister, setShowRegister] = useState(false);

  if (!user) {
    return showRegister ? (
      <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginPage onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: View) => {
    setView(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Planner
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Logged in as {user.name ?? ''} {user.surname ?? ''} {isAdmin ? '(Admin)' : ''}
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Tabs value={view} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Home" value="home" />
        <Tab label="Reservations" value="reservations" />
        <Tab label="Events" value="events" />
        <Tab label="Halls" value="halls" />
        <Tab label="Me" value="me" />
        <Tab label="Subjects" value="subjects" />
        <Tab label="Users" value="users" />
      </Tabs>

      <Box sx={{ flexGrow: 1, p: 3 }}>
        {view === 'home' ? (
          <CalendarView />
        ) : view === 'reservations' ? (
          <ReservationsPage />
        ) : view === 'events' ? (
          <EventsPage isAdmin={isAdmin} />
        ) : view === 'me' ? (
          <MePage />
        ) : view === 'halls' ? (
          <HallsPage isAdmin={isAdmin} />
        ) : view === 'subjects' ? (
          <SubjectsPage isAdmin={isAdmin} />
        ) : (
          <UsersPage isAdmin={isAdmin} />
        )}
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
