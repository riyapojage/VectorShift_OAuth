import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Custom Hook: Start HubSpot OAuth Authentication
export const useStartHubspotAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const startAuth = async () => {
    console.log('🚀 Starting HubSpot OAuth process...');
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Implement OAuth initiation logic
      // Will redirect user to HubSpot login page
      console.log('TODO: Redirect to HubSpot OAuth URL');
    } catch (err) {
      console.error('OAuth start error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { startAuth, isLoading, error };
};

// Custom Hook: Handle HubSpot OAuth Callback
export const useHandleHubspotCallback = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleCallback = async (authCode) => {
    console.log('🔄 Processing HubSpot OAuth callback...');
    setIsProcessing(true);
    setError(null);
    
    try {
      // TODO: Implement callback handling logic
      // Will exchange code for access token and save to backend
      console.log('TODO: Exchange code for access token:', authCode);
      setIsSuccess(true);
    } catch (err) {
      console.error('OAuth callback error:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return { handleCallback, isProcessing, isSuccess, error };
};

// Custom Hook: Fetch HubSpot Contacts/Items
export const useFetchHubspotItems = () => {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContacts = async (userId = 'test_user') => {
    console.log('📊 Fetching HubSpot contacts...');
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Implement contact fetching logic
      // Will call our FastAPI backend to get user's HubSpot contacts
      console.log('TODO: Fetch contacts for user:', userId);
      
      // Temporary mock data for testing
      const mockContacts = [
        { id: '1', title: 'John Doe', properties: { email: 'john@example.com' } },
        { id: '2', title: 'Jane Smith', properties: { email: 'jane@example.com' } }
      ];
      setContacts(mockContacts);
    } catch (err) {
      console.error('Contact fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { contacts, fetchContacts, isLoading, error };
};

const HubspotIntegration = () => {
  // Use our custom hooks
  const { startAuth, isLoading: isAuthLoading, error: authError } = useStartHubspotAuth();
  const { handleCallback, isProcessing, isSuccess } = useHandleHubspotCallback();
  const { contacts, fetchContacts, isLoading: isFetchLoading, error: fetchError } = useFetchHubspotItems();

  // Component state
  const [isConnected, setIsConnected] = useState(false);

  // Handle connect button click
  const handleConnect = () => {
    startAuth();
  };

  // Handle contact loading
  const handleLoadContacts = () => {
    fetchContacts();
  };

  // Update connection status when OAuth is successful
  useEffect(() => {
    if (isSuccess) {
      setIsConnected(true);
    }
  }, [isSuccess]);

  return (
    <div className="hubspot-integration">
      <h2>HubSpot Integration</h2>
      
      {!isConnected ? (
        <div className="connect-section">
          <p>Connect your HubSpot account to import contacts.</p>
          <button 
            onClick={handleConnect}
            disabled={isAuthLoading || isProcessing}
            className="connect-button"
          >
            {isAuthLoading ? 'Starting...' : 
             isProcessing ? 'Processing...' : 
             'Connect HubSpot'}
          </button>
        </div>
      ) : (
        <div className="connected-section">
          <p>✅ HubSpot Connected Successfully!</p>
          <button 
            onClick={handleLoadContacts}
            disabled={isFetchLoading}
            className="fetch-button"
          >
            {isFetchLoading ? 'Loading...' : 'Load Contacts'}
          </button>
          
          {contacts.length > 0 && (
            <div className="contacts-list">
              <h3>Your HubSpot Contacts:</h3>
              <ul>
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <strong>{contact.title}</strong> - {contact.properties.email}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(authError || fetchError) && (
        <div className="error-message">
          <p>❌ Error: {authError || fetchError}</p>
        </div>
      )}
    </div>
  );
};

export default HubspotIntegration; 