import { useState } from 'react';
import { useApp } from '../store';
import type { Patient } from '../types';
import { Plus, Edit2, Trash2, User, Calendar, FileText, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PatientList() {
  const { patients, sessions, patientSessions, addPatient, updatePatient, deletePatient, getSession, deletePatientSession } = useApp();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [form, setForm] = useState<Omit<Patient, 'id' | 'createdAt'>>({
    firstName: '',
    lastName: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', notes: '' });
    setIsEditing(null);
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updatePatient(isEditing, form);
    } else {
      addPatient(form);
    }
    resetForm();
  };

  const startEdit = (patient: Patient) => {
    setForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      notes: patient.notes,
    });
    setIsEditing(patient.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce patient et tout son historique ?')) {
      deletePatient(id);
      if (selectedPatient === id) setSelectedPatient(null);
    }
  };

  const getPatientSessionHistory = (patientId: string) => {
    return patientSessions
      .filter(ps => ps.patientId === patientId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const startSessionForPatient = (sessionId: string) => {
    if (selectedPatient) {
      navigate(`/display?session=${sessionId}&patient=${selectedPatient}`);
    }
    setShowSessionPicker(false);
  };

  const handleDeleteSession = (psId: string) => {
    if (confirm('Supprimer cette session de l\'historique ?')) {
      deletePatientSession(psId);
    }
  };

  return (
    <div className="page patients-page">
      <div className="patients-container">
        {/* Liste des patients */}
        <div className="patients-list-section">
          <div className="page-header">
            <h2>Patients</h2>
            {!isAdding && (
              <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                <Plus size={18} />
                Nouveau patient
              </button>
            )}
          </div>

          {isAdding && (
            <form className="form-card" onSubmit={handleSubmit}>
              <h3>{isEditing ? 'Modifier le patient' : 'Nouveau patient'}</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Prénom</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Informations complémentaires..."
                  rows={3}
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

          <div className="patients-list">
            {patients.length === 0 ? (
              <p className="empty-state">Aucun patient enregistré.</p>
            ) : (
              patients.map(patient => (
                <div
                  key={patient.id}
                  className={`patient-card ${selectedPatient === patient.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPatient(patient.id)}
                >
                  <div className="patient-avatar">
                    <User size={24} />
                  </div>
                  <div className="patient-info">
                    <h4>{patient.firstName} {patient.lastName}</h4>
                    <span className="session-count">
                      {getPatientSessionHistory(patient.id).length} session(s)
                    </span>
                  </div>
                  <div className="patient-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn-icon" onClick={() => startEdit(patient)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-icon btn-danger" onClick={() => handleDelete(patient.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Détails du patient sélectionné */}
        <div className="patient-detail-section">
          {selectedPatient ? (
            <>
              {(() => {
                const patient = patients.find(p => p.id === selectedPatient);
                if (!patient) return null;
                const history = getPatientSessionHistory(patient.id);
                return (
                  <>
                    <div className="patient-detail-header">
                      <h3>{patient.firstName} {patient.lastName}</h3>
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowSessionPicker(true)}
                        disabled={sessions.length === 0}
                      >
                        <Play size={18} />
                        Démarrer une session
                      </button>
                    </div>

                    {patient.notes && (
                      <div className="patient-notes">
                        <FileText size={16} />
                        <p>{patient.notes}</p>
                      </div>
                    )}

                    {showSessionPicker && (
                      <div className="session-picker-modal">
                        <div className="session-picker-content">
                          <h4>Choisir une session</h4>
                          <div className="session-picker-list">
                            {sessions.map(session => (
                              <button
                                key={session.id}
                                className="session-picker-item"
                                onClick={() => startSessionForPatient(session.id)}
                              >
                                {session.name}
                                <span>{session.exercises.length} exercices</span>
                              </button>
                            ))}
                          </div>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setShowSessionPicker(false)}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="patient-history">
                      <h4>Historique des sessions</h4>
                      {history.length === 0 ? (
                        <p className="empty-state">Aucune session réalisée</p>
                      ) : (
                        <ul className="history-list">
                          {history.map(ps => {
                            const session = getSession(ps.sessionId);
                            return (
                              <li key={ps.id} className="history-item">
                                <div className="history-date">
                                  <Calendar size={14} />
                                  {formatDate(ps.completedAt)}
                                </div>
                                <div className="history-session">
                                  {session?.name || 'Session supprimée'}
                                </div>
                                {ps.notes && <div className="history-notes">{ps.notes}</div>}
                                <button
                                  className="btn-icon btn-danger"
                                  onClick={() => handleDeleteSession(ps.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <div className="no-selection">
              <User size={48} />
              <p>Sélectionnez un patient pour voir son historique</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
