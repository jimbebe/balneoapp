import { useState, useEffect, type ReactNode } from 'react';
import { Lock } from 'lucide-react';

const ACCESS_CODE = import.meta.env.VITE_ACCESS_CODE || '66600';
const AUTH_KEY = 'balneo-auth';

export function AuthGate({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    setIsAuthenticated(saved === 'true');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setCode('');
    }
  };

  const handleKeyPress = (digit: string) => {
    if (code.length < 6) {
      setCode(prev => prev + digit);
      setError(false);
    }
  };

  const handleDelete = () => {
    setCode(prev => prev.slice(0, -1));
    setError(false);
  };

  // Loading state
  if (isAuthenticated === null) {
    return null;
  }

  // Authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Login screen
  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-icon">
          <Lock size={48} />
        </div>
        <h1>ForméO</h1>
        <p>Entrez le code d'accès</p>

        <form onSubmit={handleSubmit}>
          <div className="code-display">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={`code-dot ${code.length > i ? 'filled' : ''} ${error ? 'error' : ''}`} />
            ))}
          </div>

          <div className="keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key, i) => (
              <button
                key={i}
                type={key === '' ? 'button' : key === 'del' ? 'button' : 'button'}
                className={`keypad-btn ${key === '' ? 'empty' : ''} ${key === 'del' ? 'delete' : ''}`}
                onClick={() => {
                  if (key === 'del') handleDelete();
                  else if (key !== '') handleKeyPress(key);
                }}
                disabled={key === ''}
              >
                {key === 'del' ? '←' : key}
              </button>
            ))}
          </div>

          {error && <p className="auth-error">Code incorrect</p>}

          <button type="submit" className="auth-submit" disabled={code.length < 5}>
            Valider
          </button>
        </form>
      </div>
    </div>
  );
}
