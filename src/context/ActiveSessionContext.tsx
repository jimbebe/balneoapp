import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useApp } from '../store';
import type { Exercise } from '../types';

export interface PatientSlotState {
  patientId: string;
  sessionId: string;
  currentExerciseIndex: number;
  timeRemaining: number;
  isRunning: boolean;
  isComplete: boolean;
}

interface ActiveSessionContextType {
  slots: PatientSlotState[];
  isSessionActive: boolean;
  startSession: (slots: PatientSlotState[]) => void;
  updateSlot: (index: number, updates: Partial<PatientSlotState>) => void;
  endSession: () => void;
  getSessionExercises: (sessionId: string) => Exercise[];
}

const ActiveSessionContext = createContext<ActiveSessionContextType | null>(null);

export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  const { getSession, getExercise } = useApp();
  const [slots, setSlots] = useState<PatientSlotState[]>([]);
  const intervalsRef = useRef<Map<number, number>>(new Map());

  const isSessionActive = slots.length > 0;

  const getSessionExercises = useCallback((sessionId: string): Exercise[] => {
    const session = getSession(sessionId);
    if (!session) return [];
    return session.exercises
      .sort((a, b) => a.order - b.order)
      .map(se => getExercise(se.exerciseId))
      .filter(Boolean) as Exercise[];
  }, [getSession, getExercise]);

  const startSession = useCallback((newSlots: PatientSlotState[]) => {
    setSlots(newSlots);
  }, []);

  const updateSlot = useCallback((index: number, updates: Partial<PatientSlotState>) => {
    setSlots(prevSlots =>
      prevSlots.map((slot, i) => (i === index ? { ...slot, ...updates } : slot))
    );
  }, []);

  const endSession = useCallback(() => {
    // Clear all intervals
    intervalsRef.current.forEach(intervalId => clearInterval(intervalId));
    intervalsRef.current.clear();
    setSlots([]);
  }, []);

  // Timer logic - runs independently of component mounting
  useEffect(() => {
    // Clear existing intervals
    intervalsRef.current.forEach(intervalId => clearInterval(intervalId));
    intervalsRef.current.clear();

    slots.forEach((slot, index) => {
      if (slot.isRunning && slot.timeRemaining > 0 && !slot.isComplete) {
        const intervalId = window.setInterval(() => {
          setSlots(prevSlots => {
            const currentSlot = prevSlots[index];
            if (!currentSlot || !currentSlot.isRunning || currentSlot.isComplete) {
              return prevSlots;
            }

            if (currentSlot.timeRemaining <= 1) {
              // Move to next exercise or complete
              const exercises = getSessionExercises(currentSlot.sessionId);
              if (currentSlot.currentExerciseIndex < exercises.length - 1) {
                const nextExercise = exercises[currentSlot.currentExerciseIndex + 1];
                return prevSlots.map((s, i) =>
                  i === index
                    ? {
                        ...s,
                        currentExerciseIndex: s.currentExerciseIndex + 1,
                        timeRemaining: nextExercise?.duration || 0,
                      }
                    : s
                );
              } else {
                return prevSlots.map((s, i) =>
                  i === index ? { ...s, isRunning: false, isComplete: true } : s
                );
              }
            }

            return prevSlots.map((s, i) =>
              i === index ? { ...s, timeRemaining: s.timeRemaining - 1 } : s
            );
          });
        }, 1000);

        intervalsRef.current.set(index, intervalId);
      }
    });

    return () => {
      intervalsRef.current.forEach(intervalId => clearInterval(intervalId));
      intervalsRef.current.clear();
    };
  }, [slots.map(s => `${s.isRunning}-${s.isComplete}`).join(','), getSessionExercises]);

  return (
    <ActiveSessionContext.Provider
      value={{
        slots,
        isSessionActive,
        startSession,
        updateSlot,
        endSession,
        getSessionExercises,
      }}
    >
      {children}
    </ActiveSessionContext.Provider>
  );
}

export function useActiveSession() {
  const context = useContext(ActiveSessionContext);
  if (!context) {
    throw new Error('useActiveSession must be used within ActiveSessionProvider');
  }
  return context;
}
