import { useState } from 'react';

export default function LoginForm({ onLogin }) {
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(typeof data === 'string' ? data : 'Authentication failed.');
            }

            onLogin(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ color: '#2c3e50', textAlign: 'center' }}>
                {mode === 'login' ? 'Log In' : 'Sign Up'}
            </h2>

            {mode === 'register' && (
                <input
                    placeholder="Username"
                    value={formData.username}
                    required
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            )}

            <input
                type="email"
                placeholder="Email"
                value={formData.email}
                required
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />

            <input
                type="password"
                placeholder="Password"
                value={formData.password}
                required
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />

            {error && <p style={{ color: '#e74c3c', margin: 0 }}>{error}</p>}

            <button
                type="submit"
                disabled={loading}
                style={{ padding: '10px', backgroundColor: '#2c3e50', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
                {loading ? 'Working...' : mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>

            <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                style={{ background: 'none', border: 'none', color: '#2980b9', cursor: 'pointer' }}
            >
                {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
            </button>
        </form>
    );
}