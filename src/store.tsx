import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Exercise, Session, Patient, PatientSession, AppState } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'balneo-app-data';

const sampleExercises: Exercise[] = [
  {
    id: 'ex-1',
    name: 'Marche avant',
    duration: 120,
    description: 'Marche classique dans l\'eau pour échauffement',
    instructions: 'Marchez normalement dans le bassin en gardant le dos droit. Balancez les bras naturellement.',
  },
  {
    id: 'ex-2',
    name: 'Marche arrière',
    duration: 90,
    description: 'Marche à reculons pour renforcer les ischio-jambiers',
    instructions: 'Reculez lentement en posant d\'abord les orteils puis le talon. Gardez les abdominaux engagés.',
  },
  {
    id: 'ex-3',
    name: 'Montées de genoux',
    duration: 60,
    description: 'Renforcement des fléchisseurs de hanche',
    instructions: 'Levez alternativement chaque genou vers la poitrine. Maintenez l\'équilibre en vous tenant au bord si nécessaire.',
  },
  {
    id: 'ex-4',
    name: 'Talons-fesses',
    duration: 60,
    description: 'Étirement des quadriceps et travail cardio',
    instructions: 'Amenez alternativement chaque talon vers la fesse. Gardez le buste droit.',
  },
  {
    id: 'ex-5',
    name: 'Battements de jambes',
    duration: 90,
    description: 'Renforcement des abducteurs et adducteurs',
    instructions: 'Face au bord, effectuez des battements latéraux avec chaque jambe. Mouvement contrôlé, pas de à-coups.',
  },
  {
    id: 'ex-6',
    name: 'Flexions de chevilles',
    duration: 60,
    description: 'Mobilisation des chevilles',
    instructions: 'Debout sur une jambe, effectuez des flexions/extensions de la cheville opposée. Alternez.',
  },
  {
    id: 'ex-7',
    name: 'Squats aquatiques',
    duration: 90,
    description: 'Renforcement des quadriceps et fessiers',
    instructions: 'Pieds écartés largeur des épaules, descendez en squat en gardant les genoux au-dessus des orteils.',
  },
  {
    id: 'ex-8',
    name: 'Circumduction des bras',
    duration: 60,
    description: 'Mobilisation des épaules',
    instructions: 'Effectuez de grands cercles avec les bras, d\'abord vers l\'avant puis vers l\'arrière.',
  },
  {
    id: 'ex-9',
    name: 'Étirements quadriceps',
    duration: 45,
    description: 'Étirement en fin de séance',
    instructions: 'Attrapez votre cheville et amenez le talon vers la fesse. Maintenez 20 secondes par jambe.',
  },
  {
    id: 'ex-10',
    name: 'Relaxation flottaison',
    duration: 120,
    description: 'Retour au calme',
    instructions: 'Allongez-vous sur le dos avec une frite sous la nuque. Respirez profondément et relâchez tous les muscles.',
  },
];

const sampleSessions: Session[] = [
  {
    id: 'session-1',
    name: 'Rééducation genou - Débutant',
    createdAt: new Date().toISOString(),
    exercises: [
      { exerciseId: 'ex-1', order: 0 },
      { exerciseId: 'ex-3', order: 1 },
      { exerciseId: 'ex-6', order: 2 },
      { exerciseId: 'ex-7', order: 3 },
      { exerciseId: 'ex-9', order: 4 },
    ],
  },
  {
    id: 'session-2',
    name: 'Renforcement membres inférieurs',
    createdAt: new Date().toISOString(),
    exercises: [
      { exerciseId: 'ex-1', order: 0 },
      { exerciseId: 'ex-2', order: 1 },
      { exerciseId: 'ex-3', order: 2 },
      { exerciseId: 'ex-4', order: 3 },
      { exerciseId: 'ex-5', order: 4 },
      { exerciseId: 'ex-7', order: 5 },
      { exerciseId: 'ex-10', order: 6 },
    ],
  },
  {
    id: 'session-3',
    name: 'Séance complète 30min',
    createdAt: new Date().toISOString(),
    exercises: [
      { exerciseId: 'ex-1', order: 0 },
      { exerciseId: 'ex-8', order: 1 },
      { exerciseId: 'ex-3', order: 2 },
      { exerciseId: 'ex-5', order: 3 },
      { exerciseId: 'ex-7', order: 4 },
      { exerciseId: 'ex-2', order: 5 },
      { exerciseId: 'ex-4', order: 6 },
      { exerciseId: 'ex-9', order: 7 },
      { exerciseId: 'ex-10', order: 8 },
    ],
  },
];

const samplePatients: Patient[] = [
  {
    id: 'patient-1',
    firstName: 'Marie',
    lastName: 'Dupont',
    notes: 'Prothèse de genou droit - Opérée le 15/01/2025',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'patient-2',
    firstName: 'Jean',
    lastName: 'Martin',
    notes: 'Arthrose hanche gauche - Éviter les mouvements brusques',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'patient-3',
    firstName: 'Sophie',
    lastName: 'Bernard',
    notes: 'Lombalgie chronique - Renforcement du dos',
    createdAt: new Date().toISOString(),
  },
];

const defaultState: AppState = {
  exercises: sampleExercises,
  sessions: sampleSessions,
  patients: samplePatients,
  patientSessions: [],
};

interface AppContextType extends AppState {
  // Exercices
  addExercise: (exercise: Omit<Exercise, 'id'>) => void;
  updateExercise: (id: string, exercise: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  getExercise: (id: string) => Exercise | undefined;

  // Sessions
  addSession: (session: Omit<Session, 'id' | 'createdAt'>) => void;
  updateSession: (id: string, session: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  getSession: (id: string) => Session | undefined;

  // Patients
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  getPatient: (id: string) => Patient | undefined;

  // Patient Sessions
  addPatientSession: (ps: Omit<PatientSession, 'id' | 'completedAt'>) => void;
  deletePatientSession: (id: string) => void;
  getPatientSessions: (patientId: string) => PatientSession[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Exercices
  const addExercise = (exercise: Omit<Exercise, 'id'>) => {
    const newExercise = { ...exercise, id: uuidv4() };
    setState(s => ({ ...s, exercises: [...s.exercises, newExercise] }));
  };

  const updateExercise = (id: string, exercise: Partial<Exercise>) => {
    setState(s => ({
      ...s,
      exercises: s.exercises.map(e => e.id === id ? { ...e, ...exercise } : e),
    }));
  };

  const deleteExercise = (id: string) => {
    setState(s => ({
      ...s,
      exercises: s.exercises.filter(e => e.id !== id),
    }));
  };

  const getExercise = (id: string) => state.exercises.find(e => e.id === id);

  // Sessions
  const addSession = (session: Omit<Session, 'id' | 'createdAt'>) => {
    const newSession = { ...session, id: uuidv4(), createdAt: new Date().toISOString() };
    setState(s => ({ ...s, sessions: [...s.sessions, newSession] }));
  };

  const updateSession = (id: string, session: Partial<Session>) => {
    setState(s => ({
      ...s,
      sessions: s.sessions.map(ses => ses.id === id ? { ...ses, ...session } : ses),
    }));
  };

  const deleteSession = (id: string) => {
    setState(s => ({
      ...s,
      sessions: s.sessions.filter(ses => ses.id !== id),
    }));
  };

  const getSession = (id: string) => state.sessions.find(s => s.id === id);

  // Patients
  const addPatient = (patient: Omit<Patient, 'id' | 'createdAt'>) => {
    const newPatient = { ...patient, id: uuidv4(), createdAt: new Date().toISOString() };
    setState(s => ({ ...s, patients: [...s.patients, newPatient] }));
  };

  const updatePatient = (id: string, patient: Partial<Patient>) => {
    setState(s => ({
      ...s,
      patients: s.patients.map(p => p.id === id ? { ...p, ...patient } : p),
    }));
  };

  const deletePatient = (id: string) => {
    setState(s => ({
      ...s,
      patients: s.patients.filter(p => p.id !== id),
      patientSessions: s.patientSessions.filter(ps => ps.patientId !== id),
    }));
  };

  const getPatient = (id: string) => state.patients.find(p => p.id === id);

  // Patient Sessions
  const addPatientSession = (ps: Omit<PatientSession, 'id' | 'completedAt'>) => {
    const newPS = { ...ps, id: uuidv4(), completedAt: new Date().toISOString() };
    setState(s => ({ ...s, patientSessions: [...s.patientSessions, newPS] }));
  };

  const deletePatientSession = (id: string) => {
    setState(s => ({
      ...s,
      patientSessions: s.patientSessions.filter(ps => ps.id !== id),
    }));
  };

  const getPatientSessions = (patientId: string) =>
    state.patientSessions.filter(ps => ps.patientId === patientId);

  return (
    <AppContext.Provider value={{
      ...state,
      addExercise, updateExercise, deleteExercise, getExercise,
      addSession, updateSession, deleteSession, getSession,
      addPatient, updatePatient, deletePatient, getPatient,
      addPatientSession, deletePatientSession, getPatientSessions,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
