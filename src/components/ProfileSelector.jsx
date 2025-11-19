import { useState, useEffect } from 'react';
import { fetchProfiles } from '../api/airtable';

/**
 * ProfileSelector component
 * Allows selecting a student profile from Airtable and auto-filling the recommendations
 * 
 * @param {Object} props
 * @param {string} props.value - Current selected profile ID
 * @param {Function} props.onChange - Callback when profile is selected (receives {id, profile, recommendations})
 * @param {boolean} props.disabled - Whether the selector is disabled
 */
export default function ProfileSelector({ value, onChange, disabled = false }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch profiles on component mount
  useEffect(() => {
    async function loadProfiles() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchProfiles();
        setProfiles(data);
      } catch (err) {
        console.error('Failed to load profiles:', err);
        setError(err.message || 'Failed to load student profiles');
      } finally {
        setLoading(false);
      }
    }

    loadProfiles();
  }, []);

  const handleSelectChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      onChange(null);
      return;
    }

    const selectedProfile = profiles.find(profile => profile.id === selectedId);
    if (selectedProfile) {
      onChange({
        id: selectedProfile.id,
        profile: selectedProfile.profile,
        recommendations: selectedProfile.recommendations,
      });
    }
  };

  const styles = {
    container: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '8px',
      color: '#333',
    },
    select: {
      width: '100%',
      padding: '12px',
      fontSize: '14px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'border-color 0.2s',
    },
    error: {
      marginTop: '8px',
      padding: '8px 12px',
      backgroundColor: '#fee',
      color: '#c33',
      borderRadius: '6px',
      fontSize: '13px',
    },
    loading: {
      marginTop: '8px',
      fontSize: '13px',
      color: '#666',
      fontStyle: 'italic',
    },
    empty: {
      marginTop: '8px',
      fontSize: '13px',
      color: '#999',
      fontStyle: 'italic',
    },
  };

  return (
    <div style={styles.container}>
      <label style={styles.label}>
        Select student profile (optional)
      </label>
      <select
        value={value || ''}
        onChange={handleSelectChange}
        disabled={disabled || loading}
        style={styles.select}
      >
        <option value="">-- Choose a student profile --</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.profile}
          </option>
        ))}
      </select>
      
      {loading && (
        <div style={styles.loading}>Loading profiles...</div>
      )}
      
      {error && (
        <div style={styles.error}>
          {error}
          <br />
          <small>Make sure Airtable API is configured in .env file</small>
        </div>
      )}
      
      {!loading && !error && profiles.length === 0 && (
        <div style={styles.empty}>No student profiles found in Airtable</div>
      )}
    </div>
  );
}

