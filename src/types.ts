export interface Exercise {
  id: string;
  name: string;
  duration: number; // en secondes
  description: string;
  instructions: string;
}

export interface SessionExercise {
  exerciseId: string;
  order: number;
}

export interface Session {
  id: string;
  name: string;
  exercises: SessionExercise[];
  createdAt: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  notes: string;
  createdAt: string;
}

export interface PatientSession {
  id: string;
  patientId: string;
  sessionId: string;
  completedAt: string;
  notes: string;
}

export interface AppState {
  exercises: Exercise[];
  sessions: Session[];
  patients: Patient[];
  patientSessions: PatientSession[];
}
