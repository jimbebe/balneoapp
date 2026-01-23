import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Play, Pause, SkipForward, RotateCcw, X, Volume2, Check } from 'lucide-react';

export function DisplayMode() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sessions, getSession, getExercise, addPatientSession, getPatient } = useApp();

  const sessionId = searchParams.get('session');
  const patientId = searchParams.get('patient');

  const [selectedSession, setSelectedSession] = useState<string | null>(sessionId);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const session = selectedSession ? getSession(selectedSession) : null;
  const patient = patientId ? getPatient(patientId) : null;

  const sessionExercises = session?.exercises
    .sort((a, b) => a.order - b.order)
    .map(se => getExercise(se.exerciseId))
    .filter(Boolean) || [];

  const currentExercise = sessionExercises[currentExerciseIndex];

  const totalDuration = sessionExercises.reduce((sum, ex) => sum + (ex?.duration || 0), 0);
  const completedDuration = sessionExercises
    .slice(0, currentExerciseIndex)
    .reduce((sum, ex) => sum + (ex?.duration || 0), 0);
  const progressPercent = totalDuration > 0
    ? ((completedDuration + (currentExercise ? currentExercise.duration - timeRemaining : 0)) / totalDuration) * 100
    : 0;

  const playBeep = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const nextExercise = useCallback(() => {
    if (currentExerciseIndex < sessionExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      const nextEx = sessionExercises[currentExerciseIndex + 1];
      if (nextEx) {
        setTimeRemaining(nextEx.duration);
      }
      playBeep();
    } else {
      setIsRunning(false);
      setIsComplete(true);
      playBeep();
      if (patientId && selectedSession) {
        addPatientSession({
          patientId,
          sessionId: selectedSession,
          notes: '',
        });
      }
    }
  }, [currentExerciseIndex, sessionExercises, playBeep, patientId, selectedSession, addPatientSession]);

  useEffect(() => {
    if (currentExercise && timeRemaining === 0 && !isComplete) {
      setTimeRemaining(currentExercise.duration);
    }
  }, [currentExercise, timeRemaining, isComplete]);

  useEffect(() => {
    let interval: number | null = null;

    if (isRunning && timeRemaining > 0) {
      interval = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            nextExercise();
            return 0;
          }
          if (prev === 4) playBeep();
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, nextExercise, playBeep]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const resetSession = () => {
    setCurrentExerciseIndex(0);
    setIsRunning(false);
    setIsComplete(false);
    if (sessionExercises[0]) {
      setTimeRemaining(sessionExercises[0].duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const exitDisplay = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    navigate('/sessions');
  };

  if (!selectedSession) {
    return (
      <div className="display-select">
        <h2>Mode Affichage</h2>
        <p>Sélectionnez une session à afficher</p>
        <div className="session-select-grid">
          {sessions.length === 0 ? (
            <p className="empty-state">Aucune session disponible. Créez-en une d'abord.</p>
          ) : (
            sessions.map(s => (
              <button
                key={s.id}
                className="session-select-card"
                onClick={() => setSelectedSession(s.id)}
              >
                <h3>{s.name}</h3>
                <span>{s.exercises.length} exercices</span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  if (!session || sessionExercises.length === 0) {
    return (
      <div className="display-select">
        <h2>Session non trouvée</h2>
        <button className="btn btn-primary" onClick={() => setSelectedSession(null)}>
          Retour
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`display-mode ${isFullscreen ? 'fullscreen' : ''}`}>
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleWknNYLa5dChXT8fKnnh8tnJkz8A" />

      <div className="display-header">
        {patient && (
          <div className="patient-badge">
            Patient : {patient.firstName} {patient.lastName}
          </div>
        )}
        <h1 className="session-title">{session.name}</h1>
        <button className="btn-close" onClick={exitDisplay}>
          <X size={24} />
        </button>
      </div>

      {isComplete ? (
        <div className="display-complete">
          <div className="complete-icon">
            <Check size={80} />
          </div>
          <h2>Session terminée !</h2>
          <p>{sessionExercises.length} exercices complétés</p>
          <div className="complete-actions">
            <button className="btn btn-secondary" onClick={resetSession}>
              <RotateCcw size={20} />
              Recommencer
            </button>
            <button className="btn btn-primary" onClick={exitDisplay}>
              Terminer
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="progress-text">
              Exercice {currentExerciseIndex + 1} / {sessionExercises.length}
            </div>
          </div>

          <div className="exercise-display">
            <h2 className="exercise-name">{currentExercise?.name}</h2>

            <div className={`timer ${timeRemaining <= 5 ? 'timer-warning' : ''}`}>
              {formatTime(timeRemaining)}
            </div>

            {currentExercise?.instructions && (
              <div className="exercise-instructions">
                {currentExercise.instructions}
              </div>
            )}
          </div>

          <div className="display-controls">
            <button className="btn-control" onClick={resetSession} title="Recommencer">
              <RotateCcw size={28} />
            </button>

            <button
              className={`btn-control btn-play ${isRunning ? 'playing' : ''}`}
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? <Pause size={40} /> : <Play size={40} />}
            </button>

            <button
              className="btn-control"
              onClick={nextExercise}
              disabled={currentExerciseIndex >= sessionExercises.length - 1}
              title="Exercice suivant"
            >
              <SkipForward size={28} />
            </button>
          </div>

          <div className="upcoming-exercises">
            <h4>À venir</h4>
            <div className="upcoming-list">
              {sessionExercises.slice(currentExerciseIndex + 1, currentExerciseIndex + 4).map((ex, i) => (
                <div key={i} className="upcoming-item">
                  <span className="upcoming-number">{currentExerciseIndex + 2 + i}</span>
                  <span className="upcoming-name">{ex?.name}</span>
                </div>
              ))}
              {currentExerciseIndex >= sessionExercises.length - 1 && (
                <div className="upcoming-item upcoming-end">Fin de la session</div>
              )}
            </div>
          </div>
        </>
      )}

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
