import { useState, useEffect } from 'react';
import { fetchHomeworks } from '../api/airtable';

/**
 * AssignmentSelector component
 * Allows selecting a homework assignment from Airtable and auto-filling the assignment text
 * 
 * @param {Object} props
 * @param {string} props.value - Current selected assignment ID
 * @param {Function} props.onChange - Callback when assignment is selected (receives {id, name, details})
 * @param {boolean} props.disabled - Whether the selector is disabled
 */
export default function AssignmentSelector({ value, onChange, disabled = false }) {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch homeworks on component mount
  useEffect(() => {
    async function loadHomeworks() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchHomeworks();
        setHomeworks(data);
      } catch (err) {
        console.error('Failed to load homeworks:', err);
        setError(err.message || 'Failed to load assignments');
      } finally {
        setLoading(false);
      }
    }

    loadHomeworks();
  }, []);

  const handleSelectChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      onChange(null);
      return;
    }

    const selectedHomework = homeworks.find(hw => hw.id === selectedId);
    if (selectedHomework) {
      onChange({
        id: selectedHomework.id,
        name: selectedHomework.name,
        details: selectedHomework.details,
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
        Select assignment (optional)
      </label>
      <select
        value={value || ''}
        onChange={handleSelectChange}
        disabled={disabled || loading}
        style={styles.select}
      >
        <option value="">-- Choose an assignment --</option>
        {homeworks.map((homework) => (
          <option key={homework.id} value={homework.id}>
            {homework.name}
          </option>
        ))}
      </select>
      
      {loading && (
        <div style={styles.loading}>Loading assignments...</div>
      )}
      
      {error && (
        <div style={styles.error}>
          {error}
          <br />
          <small>Make sure Airtable API is configured in .env file</small>
        </div>
      )}
      
      {!loading && !error && homeworks.length === 0 && (
        <div style={styles.empty}>No assignments found in Airtable</div>
      )}
    </div>
  );
}

