import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { useActiveSession, type PatientSlotState } from '../context/ActiveSessionContext';
import { Play, Pause, SkipForward, RotateCcw, X, Volume2, Check, Users, Minimize2 } from 'lucide-react';
import type { Exercise, Session, Patient } from '../types';

interface PatientSlotConfig {
  patientId: string;
  sessionId: string;
}

function PatientSlot({
  slot,
  slotIndex,
  onUpdate,
  getSession,
  getExercise,
  getPatient,
  formatTime,
  playBeep,
  totalSlots,
}: {
  slot: PatientSlotState;
  slotIndex: number;
  onUpdate: (index: number, updates: Partial<PatientSlotState>) => void;
  getSession: (id: string) => Session | undefined;
  getExercise: (id: string) => Exercise | undefined;
  getPatient: (id: string) => Patient | undefined;
  formatTime: (seconds: number) => string;
  playBeep: () => void;
  totalSlots: number;
}) {
  const session = getSession(slot.sessionId);
  const patient = getPatient(slot.patientId);

  const sessionExercises = session?.exercises
    .sort((a, b) => a.order - b.order)
    .map(se => getExercise(se.exerciseId))
    .filter(Boolean) as Exercise[] || [];

  const currentExercise = sessionExercises[slot.currentExerciseIndex];

  const nextExerciseAction = useCallback(() => {
    if (slot.currentExerciseIndex < sessionExercises.length - 1) {
      const nextEx = sessionExercises[slot.currentExerciseIndex + 1];
      onUpdate(slotIndex, {
        currentExerciseIndex: slot.currentExerciseIndex + 1,
        timeRemaining: nextEx?.duration || 0,
      });
      playBeep();
    } else {
      onUpdate(slotIndex, {
        isRunning: false,
        isComplete: true,
      });
      playBeep();
    }
  }, [slot.currentExerciseIndex, sessionExercises, slotIndex, onUpdate, playBeep]);

  const resetSlot = () => {
    onUpdate(slotIndex, {
      currentExerciseIndex: 0,
      isRunning: false,
      isComplete: false,
      timeRemaining: sessionExercises[0]?.duration || 0,
    });
  };

  const toggleRunning = () => {
    onUpdate(slotIndex, { isRunning: !slot.isRunning });
  };

  const skipExercise = () => {
    nextExerciseAction();
  };

  const isCompact = totalSlots >= 3;
  const nextExerciseData = sessionExercises[slot.currentExerciseIndex + 1];

  if (slot.isComplete) {
    return (
      <div className="patient-slot patient-slot-complete">
        <div className="slot-header">
          <span className="slot-patient-name">
            {patient?.firstName} {patient?.lastName?.charAt(0)}.
          </span>
        </div>
        <div className="slot-complete-content">
          <div className="slot-complete-icon">
            <Check size={isCompact ? 48 : 56} />
          </div>
          <h3>Terminé !</h3>
          <p>{sessionExercises.length} exercices</p>
          <button className="btn btn-secondary btn-sm" onClick={resetSlot}>
            <RotateCcw size={16} />
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`patient-slot ${slot.isRunning ? 'slot-running' : ''}`}>
      <div className="slot-header">
        <span className="slot-patient-name">
          {patient?.firstName} {patient?.lastName?.charAt(0)}.
        </span>
        <span className="slot-session-name">{session?.name}</span>
      </div>

      <div className="slot-progress">
        <div className="slot-progress-segments">
          {sessionExercises.map((_, index) => (
            <div
              key={index}
              className={`slot-progress-segment ${
                index < slot.currentExerciseIndex
                  ? 'completed'
                  : index === slot.currentExerciseIndex
                  ? 'current'
                  : ''
              }`}
            />
          ))}
        </div>
        <span className="slot-progress-text">
          {slot.currentExerciseIndex + 1} / {sessionExercises.length}
        </span>
      </div>

      <div className="slot-content">
        <div className="slot-left">
          <h3 className="slot-exercise-name">{currentExercise?.name}</h3>
          {currentExercise?.instructions && (
            <p className="slot-instructions">{currentExercise.instructions}</p>
          )}
          {nextExerciseData && (
            <div className="slot-next-exercise">
              <span className="slot-next-label">Suivant :</span>
              <span className="slot-next-name">{nextExerciseData.name}</span>
            </div>
          )}
          {!nextExerciseData && slot.currentExerciseIndex === sessionExercises.length - 1 && (
            <div className="slot-next-exercise slot-next-end">
              <span className="slot-next-label">Dernier exercice</span>
            </div>
          )}
        </div>

        <div className="slot-right">
          <div className={`slot-timer ${slot.timeRemaining <= 5 ? 'timer-warning' : ''}`}>
            {formatTime(slot.timeRemaining)}
          </div>
          <div className="slot-controls">
            <button className="btn-slot-control" onClick={resetSlot} title="Recommencer">
              <RotateCcw size={20} />
            </button>
            <button
              className={`btn-slot-control btn-slot-play ${slot.isRunning ? 'playing' : ''}`}
              onClick={toggleRunning}
            >
              {slot.isRunning ? <Pause size={28} /> : <Play size={28} />}
            </button>
            <button
              className="btn-slot-control"
              onClick={skipExercise}
              disabled={slot.currentExerciseIndex >= sessionExercises.length - 1}
              title="Exercice suivant"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DisplayMode() {
  const navigate = useNavigate();
  const { sessions, patients, getSession, getExercise, addPatientSession, getPatient } = useApp();
  const { slots, isSessionActive, startSession, updateSlot, endSession } = useActiveSession();

  // Configuration state
  const [slotCount, setSlotCount] = useState<2 | 3 | 4>(2);
  const [slotConfigs, setSlotConfigs] = useState<PatientSlotConfig[]>([
    { patientId: '', sessionId: '' },
    { patientId: '', sessionId: '' },
  ]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const playBeep = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSlotCountChange = (count: 2 | 3 | 4) => {
    setSlotCount(count);
    const newConfigs: PatientSlotConfig[] = [];
    for (let i = 0; i < count; i++) {
      newConfigs.push(slotConfigs[i] || { patientId: '', sessionId: '' });
    }
    setSlotConfigs(newConfigs);
  };

  const updateSlotConfig = (index: number, field: 'patientId' | 'sessionId', value: string) => {
    setSlotConfigs(configs =>
      configs.map((config, i) => (i === index ? { ...config, [field]: value } : config))
    );
  };

  const canStartSession = slotConfigs.every(config => config.patientId && config.sessionId);

  const calculateSessionDuration = (sessionId: string): number => {
    const session = getSession(sessionId);
    if (!session) return 0;
    return session.exercises.reduce((total, se) => {
      const exercise = getExercise(se.exerciseId);
      return total + (exercise?.duration || 0);
    }, 0);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  };

  const startMultiSession = () => {
    // Vérifier si les sessions ont des durées différentes
    const durations = slotConfigs.map(config => ({
      patient: patients.find(p => p.id === config.patientId),
      session: getSession(config.sessionId),
      duration: calculateSessionDuration(config.sessionId),
    }));

    const uniqueDurations = [...new Set(durations.map(d => d.duration))];

    if (uniqueDurations.length > 1) {
      const durationList = durations
        .map(d => `• ${d.patient?.firstName} ${d.patient?.lastName?.charAt(0)}. : ${formatDuration(d.duration)} (${d.session?.name})`)
        .join('\n');

      const confirmed = window.confirm(
        `Attention : les sessions n'ont pas la même durée !\n\n${durationList}\n\nVoulez-vous continuer ?`
      );

      if (!confirmed) return;
    }

    const initialSlots: PatientSlotState[] = slotConfigs.map(config => {
      const session = getSession(config.sessionId);
      const exercises = session?.exercises.sort((a, b) => a.order - b.order) || [];
      const firstExercise = exercises[0] ? getExercise(exercises[0].exerciseId) : null;

      // Enregistrer la session dans l'historique dès le démarrage
      addPatientSession({
        patientId: config.patientId,
        sessionId: config.sessionId,
        notes: '',
      });

      return {
        patientId: config.patientId,
        sessionId: config.sessionId,
        currentExerciseIndex: 0,
        timeRemaining: firstExercise?.duration || 0,
        isRunning: false,
        isComplete: false,
      };
    });

    startSession(initialSlots);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const minimizeDisplay = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    navigate('/sessions');
  };

  const stopSession = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    endSession();
    navigate('/sessions');
  };

  // Global controls
  const allRunning = slots.length > 0 && slots.every(s => s.isRunning || s.isComplete);
  const allComplete = slots.length > 0 && slots.every(s => s.isComplete);

  const toggleAllRunning = () => {
    const shouldRun = !allRunning;
    slots.forEach((slot, index) => {
      if (!slot.isComplete) {
        updateSlot(index, { isRunning: shouldRun });
      }
    });
  };

  const resetAll = () => {
    slots.forEach((slot, index) => {
      const session = getSession(slot.sessionId);
      const exercises = session?.exercises.sort((a, b) => a.order - b.order) || [];
      const firstExercise = exercises[0] ? getExercise(exercises[0].exerciseId) : null;

      updateSlot(index, {
        currentExerciseIndex: 0,
        timeRemaining: firstExercise?.duration || 0,
        isRunning: false,
        isComplete: false,
      });
    });
  };

  // Configuration screen (shown when no active session)
  if (!isSessionActive) {
    return (
      <div className="multi-config">
        <div className="multi-config-header">
          <h2>
            <Users size={28} />
            Affichage Multi-Patients
          </h2>
          <p>Configurez la séance pour plusieurs patients simultanément</p>
        </div>

        <div className="multi-config-content">
          <div className="slot-count-selector">
            <label>Nombre de patients :</label>
            <div className="slot-count-buttons">
              {([2, 3, 4] as const).map(count => (
                <button
                  key={count}
                  className={`slot-count-btn ${slotCount === count ? 'active' : ''}`}
                  onClick={() => handleSlotCountChange(count)}
                >
                  {count} patients
                </button>
              ))}
            </div>
          </div>

          <div className="slot-configs">
            {slotConfigs.map((config, index) => (
              <div key={index} className="slot-config-card">
                <h4>Patient {index + 1}</h4>

                <div className="form-group">
                  <label>Patient</label>
                  <select
                    value={config.patientId}
                    onChange={e => updateSlotConfig(index, 'patientId', e.target.value)}
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Session</label>
                  <select
                    value={config.sessionId}
                    onChange={e => updateSlotConfig(index, 'sessionId', e.target.value)}
                  >
                    <option value="">Sélectionner une session</option>
                    {sessions.map(session => (
                      <option key={session.id} value={session.id}>
                        {session.name} ({session.exercises.length} exercices)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="multi-config-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/sessions')}>
              Annuler
            </button>
            <button
              className="btn btn-primary"
              onClick={startMultiSession}
              disabled={!canStartSession}
            >
              <Play size={20} />
              Démarrer la séance
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Multi-patient display (shown when session is active)
  return (
    <div
      ref={containerRef}
      className={`display-mode multi-display ${isFullscreen ? 'fullscreen' : ''}`}
    >
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleWknNYLa5dChXT8fKnnh8tnJkz8A"
      />

      <div className="multi-display-header">
        <div className="header-left">
          <button className="btn-back" onClick={minimizeDisplay} title="Réduire (session continue)">
            <Minimize2 size={20} />
            Réduire
          </button>
        </div>

        <div className="global-controls">
          {!allComplete && (
            <>
              <button className="btn-global" onClick={resetAll} title="Tout recommencer">
                <RotateCcw size={20} />
              </button>
              <button
                className={`btn-global btn-global-play ${allRunning ? 'playing' : ''}`}
                onClick={toggleAllRunning}
                title={allRunning ? 'Tout mettre en pause' : 'Tout démarrer'}
              >
                {allRunning ? <Pause size={24} /> : <Play size={24} />}
              </button>
            </>
          )}
        </div>

        <div className="header-right">
          <button className="btn-stop" onClick={stopSession} title="Arrêter la session">
            <X size={20} />
            Arrêter
          </button>
        </div>
      </div>

      <div className={`multi-display-grid slots-${slots.length}`}>
        {slots.map((slot, index) => (
          <PatientSlot
            key={`${slot.patientId}-${index}`}
            slot={slot}
            slotIndex={index}
            onUpdate={updateSlot}
            getSession={getSession}
            getExercise={getExercise}
            getPatient={getPatient}
            formatTime={formatTime}
            playBeep={playBeep}
            totalSlots={slots.length}
          />
        ))}
      </div>

      <button className="btn-fullscreen" onClick={toggleFullscreen}>
        {isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
      </button>

      <div className="sound-indicator">
        <Volume2 size={16} />
        Son activé
      </div>
    </div>
  );
}
