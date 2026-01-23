import { useState } from 'react';
import { useApp } from '../store';
import type { Session, SessionExercise } from '../types';
import { Plus, Edit2, Trash2, Clock, GripVertical, ChevronUp, ChevronDown, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SessionList() {
  const { sessions, exercises, addSession, updateSession, deleteSession } = useApp();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<{ name: string; exercises: SessionExercise[] }>({
    name: '',
    exercises: [],
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hours}h ${remainMins > 0 ? `${remainMins}min` : ''}`;
    }
    return mins > 0 ? `${mins}min ${secs > 0 ? `${secs}s` : ''}` : `${secs}s`;
  };

  const getTotalDuration = (sessionExercises: SessionExercise[]) => {
    return sessionExercises.reduce((total, se) => {
      const ex = exercises.find(e => e.id === se.exerciseId);
      return total + (ex?.duration || 0);
    }, 0);
  };

  const resetForm = () => {
    setForm({ name: '', exercises: [] });
    setIsEditing(null);
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.exercises.length === 0) {
      alert('Ajoutez au moins un exercice à la session');
      return;
    }
    if (isEditing) {
      updateSession(isEditing, form);
    } else {
      addSession(form);
    }
    resetForm();
  };

  const startEdit = (session: Session) => {
    setForm({
      name: session.name,
      exercises: [...session.exercises],
    });
    setIsEditing(session.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette session ?')) {
      deleteSession(id);
    }
  };

  const addExerciseToSession = (exerciseId: string) => {
    setForm({
      ...form,
      exercises: [...form.exercises, { exerciseId, order: form.exercises.length }],
    });
  };

  const removeExerciseFromSession = (index: number) => {
    const newExercises = form.exercises.filter((_, i) => i !== index);
    setForm({
      ...form,
      exercises: newExercises.map((e, i) => ({ ...e, order: i })),
    });
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= form.exercises.length) return;

    const newExercises = [...form.exercises];
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    setForm({
      ...form,
      exercises: newExercises.map((e, i) => ({ ...e, order: i })),
    });
  };

  const startSession = (sessionId: string) => {
    navigate(`/display?session=${sessionId}`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Sessions</h2>
        {!isAdding && (
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            <Plus size={18} />
            Nouvelle session
          </button>
        )}
      </div>

      {isAdding && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>{isEditing ? 'Modifier la session' : 'Nouvelle session'}</h3>

          <div className="form-group">
            <label>Nom de la session</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Ex: Session rééducation genou"
            />
          </div>

          <div className="form-group">
            <label>Exercices disponibles</label>
            <div className="exercise-picker">
              {exercises.length === 0 ? (
                <p className="empty-state">Créez d'abord des exercices</p>
              ) : (
                exercises.map(ex => (
                  <button
                    key={ex.id}
                    type="button"
                    className="exercise-chip"
                    onClick={() => addExerciseToSession(ex.id)}
                  >
                    <Plus size={14} />
                    {ex.name}
                    <span className="chip-duration">{formatDuration(ex.duration)}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {form.exercises.length > 0 && (
            <div className="form-group">
              <label>Programme ({formatDuration(getTotalDuration(form.exercises))} au total)</label>
              <div className="session-exercises">
                {form.exercises.map((se, index) => {
                  const ex = exercises.find(e => e.id === se.exerciseId);
                  if (!ex) return null;
                  return (
                    <div key={index} className="session-exercise-item">
                      <span className="exercise-order">{index + 1}</span>
                      <GripVertical size={16} className="grip-icon" />
                      <span className="exercise-name">{ex.name}</span>
                      <span className="exercise-duration">{formatDuration(ex.duration)}</span>
                      <div className="exercise-actions">
                        <button type="button" onClick={() => moveExercise(index, 'up')} disabled={index === 0}>
                          <ChevronUp size={16} />
                        </button>
                        <button type="button" onClick={() => moveExercise(index, 'down')} disabled={index === form.exercises.length - 1}>
                          <ChevronDown size={16} />
                        </button>
                        <button type="button" className="btn-danger" onClick={() => removeExerciseFromSession(index)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      <div className="card-grid">
        {sessions.length === 0 ? (
          <p className="empty-state">Aucune session créée. Commencez par en ajouter une.</p>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="card">
              <div className="card-header">
                <h3>{session.name}</h3>
                <div className="card-actions">
                  <button className="btn-icon btn-success" onClick={() => startSession(session.id)} title="Lancer">
                    <Play size={16} />
                  </button>
                  <button className="btn-icon" onClick={() => startEdit(session)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(session.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="duration-badge">
                  <Clock size={14} />
                  {formatDuration(getTotalDuration(session.exercises))}
                </div>
                <p className="exercise-count">{session.exercises.length} exercice{session.exercises.length > 1 ? 's' : ''}</p>
                <ul className="exercise-list-mini">
                  {session.exercises.slice(0, 3).map((se, i) => {
                    const ex = exercises.find(e => e.id === se.exerciseId);
                    return ex ? <li key={i}>{ex.name}</li> : null;
                  })}
                  {session.exercises.length > 3 && (
                    <li className="more">+{session.exercises.length - 3} autres</li>
                  )}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
