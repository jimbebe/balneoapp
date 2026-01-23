import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store';
import { Layout } from './components/Layout';
import { ExerciseList } from './components/ExerciseList';
import { SessionList } from './components/SessionList';
import { PatientList } from './components/PatientList';
import { DisplayMode } from './components/DisplayMode';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/exercises" replace />} />
            <Route path="exercises" element={<ExerciseList />} />
            <Route path="sessions" element={<SessionList />} />
            <Route path="patients" element={<PatientList />} />
            <Route path="display" element={<DisplayMode />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
