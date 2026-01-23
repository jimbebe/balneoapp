import { useState } from 'react';
import { useApp } from '../store';
import type { Exercise } from '../types';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';

export function ExerciseList() {
  const { exercises, addExercise, updateExercise, deleteExercise } = useApp();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<Exercise, 'id'>>({
    name: '',
    duration: 60,
    description: '',
    instructions: '',
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}min ${secs > 0 ? `${secs}s` : ''}` : `${secs}s`;
  };

  const resetForm = () => {
    setForm({ name: '', duration: 60, description: '', instructions: '' });
    setIsEditing(null);
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateExercise(isEditing, form);
    } else {
      addExercise(form);
    }
    resetForm();
  };

  const startEdit = (exercise: Exercise) => {
    setForm({
      name: exercise.name,
      duration: exercise.duration,
      description: exercise.description,
      instructions: exercise.instructions,
    });
    setIsEditing(exercise.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cet exercice ?')) {
      deleteExercise(id);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Exercices</h2>
        {!isAdding && (
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            <Plus size={18} />
            Nouvel exercice
          </button>
        )}
      </div>

      {isAdding && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>{isEditing ? 'Modifier l\'exercice' : 'Nouvel exercice'}</h3>

          <div className="form-group">
            <label>Nom de l'exercice</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Ex: Marche dans l'eau"
            />
          </div>

          <div className="form-group">
            <label>Durée (secondes)</label>
            <input
              type="number"
              value={form.duration}
              onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
              required
              min="1"
            />
            <span className="form-hint">{formatDuration(form.duration)}</span>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brève description de l'exercice"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Instructions</label>
            <textarea
              value={form.instructions}
              onChange={e => setForm({ ...form, instructions: e.target.value })}
              placeholder="Instructions détaillées pour le patient"
              rows={4}
            />
          </div>

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
        {exercises.length === 0 ? (
          <p className="empty-state">Aucun exercice créé. Commencez par en ajouter un.</p>
        ) : (
          exercises.map(exercise => (
            <div key={exercise.id} className="card">
              <div className="card-header">
                <h3>{exercise.name}</h3>
                <div className="card-actions">
                  <button className="btn-icon" onClick={() => startEdit(exercise)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(exercise.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="duration-badge">
                  <Clock size={14} />
                  {formatDuration(exercise.duration)}
                </div>
                {exercise.description && <p>{exercise.description}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
