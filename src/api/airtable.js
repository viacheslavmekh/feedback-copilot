/**
 * Airtable API integration for fetching homework assignments and student profiles
 */

/**
 * Fetch all homeworks from Airtable
 * @returns {Promise<Array<{id: string, name: string, details: string}>>}
 */
export async function fetchHomeworks() {
  try {
    const response = await fetch('/api/airtable/homeworks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch homeworks' }));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.homeworks || [];
  } catch (error) {
    console.error('Error fetching homeworks from Airtable:', error);
    throw error;
  }
}

/**
 * Fetch all student profiles from Airtable
 * @returns {Promise<Array<{id: string, profile: string, recommendations: string}>>}
 */
export async function fetchProfiles() {
  try {
    const response = await fetch('/api/airtable/profiles', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch profiles' }));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.profiles || [];
  } catch (error) {
    console.error('Error fetching profiles from Airtable:', error);
    throw error;
  }
}

