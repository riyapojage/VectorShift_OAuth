import React from 'react';
import axios from 'axios';

/**
 * Hook to initiate HubSpot OAuth2 authorization flow.
 * 
 * This function redirects the browser directly to the backend authorization 
 * endpoint, which then redirects to HubSpot's permission screen.
 * 
 * @param {string} userId - Optional user ID for the OAuth session
 * @returns {Promise<void>} - Redirects user to HubSpot authorization page
 */
export async function startHubspotAuth(userId = 'test_user') {
  try {
    console.log('🚀 Starting HubSpot OAuth flow for user:', userId);
    
    // Build the authorization URL
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    const authUrl = `${apiBaseUrl}/api/integrations/hubspot/authorize?user_id=${encodeURIComponent(userId)}`;
    
    console.log('✅ Redirecting to authorization endpoint:', authUrl);
    
    // Direct browser navigation - no CORS issues!
    window.location.href = authUrl;
    
  } catch (error) {
    console.error('❌ Failed to start HubSpot OAuth:', error);
    throw new Error(`OAuth initialization failed: ${error.message}`);
  }
}

/**
 * Hook to handle HubSpot OAuth2 callback and exchange code for tokens.
 * 
 * This function should be called when HubSpot redirects back to your app
 * with the authorization code.
 * 
 * @param {string} code - Authorization code from HubSpot
 * @param {string} state - State parameter (user ID)
 * @returns {Promise<Object>} - Success response with user data
 */
export async function handleHubspotCallback(code, state = 'test_user') {
  try {
    console.log('🔄 Processing HubSpot OAuth callback');
    
    // Call backend callback endpoint
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    const response = await axios.get(
      `${apiBaseUrl}/api/integrations/hubspot/callback`,
      {
        params: {
          code: code,
          state: state
        }
      }
    );
    
    console.log('✅ HubSpot OAuth completed successfully:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ Failed to process HubSpot callback:', error);
    
    if (error.response) {
      const errorMessage = error.response.data?.detail || error.response.statusText;
      throw new Error(`OAuth callback failed: ${errorMessage}`);
    } else if (error.request) {
      throw new Error('Failed to connect to callback server');
    } else {
      throw new Error(`OAuth callback processing failed: ${error.message}`);
    }
  }
}

/**
 * React hook to fetch HubSpot contacts for the authenticated user.
 * 
 * This hook provides a clean interface for fetching contacts with proper
 * error handling and loading states.
 * 
 * @param {string} userId - User ID to fetch contacts for
 * @returns {Object} - Hook state containing contacts, loading, error states and refetch function
 */
export function useFetchHubspotItems(userId = 'test_user') {
  const [contacts, setContacts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  const fetchContacts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Fetching HubSpot contacts for user:', userId);
      
      // Call our backend contacts endpoint with automatic token refresh
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const response = await axios.get(
        `${apiBaseUrl}/api/integrations/hubspot/contacts`,
        {
          params: { user_id: userId }
        }
      );
      
      console.log('✅ HubSpot contacts fetched successfully:', response.data);
      
      // Check if the response contains an error (even with 200 status)
      if (response.data?.data?.error) {
        const backendError = response.data.data.error;
        console.error('❌ Backend returned error:', backendError);
        setError(backendError);
        setContacts([]);
        return [];
      }
      
      // Extract contacts from the API response
      const contactsData = response.data?.data?.contacts || [];
      setContacts(contactsData);
      
      return contactsData;
      
    } catch (error) {
      console.error('❌ Failed to fetch HubSpot contacts:', error);
      
      // Set error state for UI feedback
      let errorMessage = 'Failed to fetch contacts';
      
      if (error.response) {
        // Server responded with an error
        const serverError = error.response.data?.data?.error || error.response.data?.detail || error.response.statusText;
        errorMessage = serverError;
      } else if (error.request) {
        // Network error
        errorMessage = 'Unable to connect to server';
      } else {
        // Other error
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Return empty array on failure as requested
      setContacts([]);
      return [];
      
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  return {
    contacts,
    loading,
    error,
    fetchContacts,
    refetch: fetchContacts // Alias for convenience
  };
}

/**
 * Legacy function to fetch HubSpot items (kept for backward compatibility).
 * 
 * @param {string} userId - User ID to fetch items for
 * @returns {Promise<Array>} - Array of HubSpot contacts/items
 */
export async function fetchHubspotItems(userId = 'test_user') {
  try {
    console.log('📋 Fetching HubSpot contacts for user:', userId);
    
    // Updated to use the correct contacts endpoint
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    const response = await axios.get(
      `${apiBaseUrl}/api/integrations/hubspot/contacts`,
      {
        params: { user_id: userId }
      }
    );
    
    console.log('✅ HubSpot contacts fetched successfully:', response.data);
    
    // Extract contacts from the API response and return empty array on failure
    const contactsData = response.data?.data?.contacts || [];
    return contactsData;
    
  } catch (error) {
    console.error('❌ Failed to fetch HubSpot contacts:', error);
    
    // Return empty array on failure as requested
    return [];
  }
}

/**
 * React component for HubSpot integration UI.
 * 
 * This component provides a complete interface for HubSpot OAuth and data display.
 */
export default function HubspotIntegration({ userId = 'test_user' }) {
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [error, setError] = React.useState(null);
  
  // Handle OAuth initiation
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await startHubspotAuth(userId);
    } catch (err) {
      setError(err.message);
      setIsConnecting(false);
    }
  };
  
  // Use the new hook for fetching contacts
  const { contacts, loading: contactsLoading, error: contactsError, fetchContacts } = useFetchHubspotItems(userId);
  
  // Handle fetching items (updated to use the hook)
  const handleFetchItems = async () => {
    try {
      setError(null);
      const fetchedContacts = await fetchContacts();
      setItems(fetchedContacts);
      setIsConnected(true);
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Note: OAuth callback handling is now done in the dedicated /hubspot/callback route
  // This component focuses on initiating OAuth and displaying connection status
  
  return (
    <div className="hubspot-integration">
      <h3>HubSpot CRM Integration</h3>
      
      {error && (
        <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
          {error}
        </div>
      )}
      
      {!isConnected ? (
        <div>
          <p>Connect your HubSpot account to access your CRM data.</p>
          <button 
            onClick={handleConnect} 
            disabled={isConnecting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff7a59',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              opacity: isConnecting ? 0.6 : 1
            }}
          >
            {isConnecting ? 'Connecting...' : 'Connect HubSpot'}
          </button>
        </div>
      ) : (
        <div>
          <p>✅ HubSpot connected successfully!</p>
          <button 
            onClick={handleFetchItems}
            disabled={contactsLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: contactsLoading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: contactsLoading ? 'not-allowed' : 'pointer',
              marginRight: '10px',
              opacity: contactsLoading ? 0.6 : 1
            }}
          >
            {contactsLoading ? 'Loading...' : 'Refresh Data'}
          </button>
          
          {(contactsError || error) && (
            <div style={{ color: 'red', margin: '10px 0' }}>
              {contactsError || error}
            </div>
          )}
          
          {(contacts.length > 0 || items.length > 0) && (
            <div style={{ marginTop: '20px' }}>
              <h4>HubSpot Contacts:</h4>
              <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '5px', 
                maxHeight: '300px', 
                overflowY: 'auto',
                backgroundColor: '#f8f9fa'
              }}>
                {(contacts.length > 0 ? contacts : items).map((contact, index) => (
                  <div key={contact.id || index} style={{
                    padding: '10px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong>
                        {contact.firstname || ''} {contact.lastname || contact.title || 'Unknown Contact'}
                      </strong>
                      <br />
                      <small style={{ color: '#666' }}>
                        ID: {contact.id || 'N/A'}
                      </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        backgroundColor: '#e7f3ff', 
                        padding: '2px 8px', 
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {contact.email || contact.properties?.email || 'No email'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                Total contacts: {(contacts.length > 0 ? contacts : items).length}
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 