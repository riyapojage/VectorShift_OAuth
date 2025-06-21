import React, { useState } from 'react';
import { startHubspotAuth, useFetchHubspotItems } from '../integrations/HubspotIntegration';
import ContactList from './ContactList';

/**
 * Wrapper component for ContactList that handles token expiry errors
 */
const ContactListWithErrorHandling = ({ userId, onTokenExpired }) => {
  const { contacts, loading, error, fetchContacts } = useFetchHubspotItems(userId);
  
  // Check if error indicates token expiry
  React.useEffect(() => {
    if (error && error.includes('Token expired, please reconnect.')) {
      console.log('🔄 Token expired, resetting connection state');
      onTokenExpired();
    }
  }, [error, onTokenExpired]);
  
  // If token expired, show reconnection message
  if (error && error.includes('Token expired, please reconnect.')) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '2rem',
          marginBottom: '15px'
        }}>
          🔐
        </div>
        <h3 style={{ 
          color: '#856404',
          margin: '0 0 10px 0'
        }}>
          Session Expired
        </h3>
        <p style={{ 
          color: '#856404',
          margin: '0 0 15px 0'
        }}>
          Your HubSpot connection has expired. Please reconnect to continue accessing your contacts.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff7a59',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Reconnect HubSpot
        </button>
      </div>
    );
  }
  
  // Render normal ContactList for all other cases
  return <ContactList userId={userId} />;
};

const IntegrationSelector = () => {
  // Generate a session-based user ID (could be replaced with actual auth system)
  const [sessionUserId] = useState(() => {
    // Try to get existing session ID from localStorage, or create new one
    let userId = localStorage.getItem('vectorshift_session_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('vectorshift_session_id', userId);
    }
    return userId;
  });

  // State to track which integration is currently selected
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  
  // State to track connection status for each integration
  const [connectionStatus, setConnectionStatus] = useState({
    hubspot: 'disconnected' // 'disconnected', 'connecting', 'connected', 'error'
  });

  // State for OAuth loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // List of available integrations
  const availableIntegrations = [
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Connect to HubSpot CRM to import contacts and deals',
      icon: '🔗',
      status: connectionStatus.hubspot
    }
    // TODO: Add more integrations here (Salesforce, Google, etc.)
  ];

  // Handle integration card click
  const handleIntegrationSelect = (integrationId) => {
    if (integrationId === 'hubspot') {
      handleHubspotConnect();
    } else {
      // For other integrations, just show the component
      setSelectedIntegration(integrationId);
    }
  };

  // Handle HubSpot connection - FIXED: No longer immediately shows "Connected"
  const handleHubspotConnect = async () => {
    console.log('🔗 Connecting to HubSpot for user:', sessionUserId);
    
    // Update status to connecting (this shows "Connecting..." button)
    setConnectionStatus(prev => ({
      ...prev,
      hubspot: 'connecting'
    }));
    
    setIsLoading(true);
    setError(null);

    try {
      // Start the OAuth process - this will redirect the user to HubSpot
      // The user will be redirected away from this page
      await startHubspotAuth(sessionUserId);
      
      // NOTE: Code after this line won't execute because the user gets redirected
      // The "Connected" state will be set by the callback component after successful OAuth
      
    } catch (error) {
      console.error('HubSpot connection error:', error);
      
      // Reset connection status on error
      setConnectionStatus(prev => ({
        ...prev,
        hubspot: 'error'
      }));
      
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Check if user just returned from OAuth (handle both success and error cases)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const oauthError = urlParams.get('oauth_error');
    
    if (oauthSuccess === 'true') {
      // User successfully completed OAuth
      console.log('🎉 OAuth completed successfully');
      setConnectionStatus(prev => ({
        ...prev,
        hubspot: 'connected'
      }));
      setError(null);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (oauthError) {
      // OAuth failed
      console.error('❌ OAuth failed:', oauthError);
      setConnectionStatus(prev => ({
        ...prev,
        hubspot: 'error'
      }));
      
      // Set appropriate error message
      let errorMessage = 'OAuth authentication failed';
      if (oauthError === 'authorization_denied') {
        errorMessage = 'You denied authorization to access HubSpot. Please try again if you want to connect.';
      } else if (oauthError === 'callback_failed') {
        errorMessage = 'OAuth callback processing failed. Please try connecting again.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Get button text based on connection status
  const getButtonText = (integration) => {
    switch (integration.status) {
      case 'connecting':
        return 'Redirecting to HubSpot...';
      case 'connected':
        return 'Connected ✅';
      case 'error':
        return 'Retry Connection';
      default:
        return 'Connect HubSpot';
    }
  };

  // Get button disabled state
  const getButtonDisabled = (integration) => {
    return integration.status === 'connecting' || isLoading;
  };

  return (
    <div className="integration-selector" style={{ padding: '20px' }}>
      <div className="integration-list">
        <h2 style={{ fontSize: '2rem', marginBottom: '10px', color: '#333' }}>Available Integrations</h2>
        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>Choose an integration to connect your data sources:</p>
        
        <div className="integration-grid" style={{ display: 'grid', gap: '20px', maxWidth: '800px' }}>
          {availableIntegrations.map((integration) => (
            <div
              key={integration.id}
              className={`integration-card ${integration.status}`}
              style={{
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                padding: '25px',
                backgroundColor: '#f9f9f9',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
              onClick={() => handleIntegrationSelect(integration.id)}
            >
              <div className="integration-icon" style={{ fontSize: '3rem', marginBottom: '15px' }}>
                {integration.icon}
              </div>
              <h3 style={{ fontSize: '1.5rem', margin: '0 0 10px 0', color: '#333' }}>{integration.name}</h3>
              <p style={{ fontSize: '1rem', color: '#666', margin: '0 0 20px 0' }}>{integration.description}</p>
              
              <button 
                className={`select-button ${integration.status}`}
                disabled={getButtonDisabled(integration)}
                style={{
                  backgroundColor: integration.status === 'connected' ? '#4CAF50' : '#007cba',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: integration.status === 'connecting' ? 'not-allowed' : 'pointer',
                  opacity: integration.status === 'connecting' ? 0.7 : 1
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleIntegrationSelect(integration.id);
                }}
              >
                {getButtonText(integration)}
              </button>

              {/* Show connection status */}
              {integration.status === 'connecting' && (
                <div className="status-indicator" style={{ marginTop: '15px' }}>
                  <span style={{ color: '#007cba', fontSize: '0.9rem' }}>🔄 Starting connection...</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Show ContactList only when HubSpot is connected */}
        {connectionStatus.hubspot === 'connected' && (
          <div className="hubspot-contacts-section" style={{ marginTop: '40px' }}>
            <div style={{
              border: '2px solid #4CAF50',
              borderRadius: '12px',
              backgroundColor: '#f8fff8',
              padding: '20px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '1px solid #e0e0e0'
              }}>
                <span style={{ fontSize: '2rem', marginRight: '15px' }}>🔗</span>
                <div>
                  <h2 style={{ 
                    margin: '0 0 5px 0', 
                    color: '#2e7d32',
                    fontSize: '1.8rem'
                  }}>
                    HubSpot Connected Successfully!
                  </h2>
                  <p style={{ 
                    margin: '0', 
                    color: '#666',
                    fontSize: '1rem'
                  }}>
                    Your contacts are now being loaded from HubSpot CRM
                  </p>
                </div>
              </div>
              
              {/* Render the ContactList component with error handling */}
              <ContactListWithErrorHandling 
                userId={sessionUserId} 
                onTokenExpired={() => {
                  // Reset connection status when token expires
                  console.log('🔄 Token expired for user:', sessionUserId, '- resetting connection');
                  setConnectionStatus(prev => ({
                    ...prev,
                    hubspot: 'disconnected'
                  }));
                }}
              />
            </div>
          </div>
        )}
        
        {/* Show error message if connection failed */}
        {error && (
          <div className="error-section" style={{ marginTop: '30px' }}>
            <div style={{
              border: '2px solid #f44336',
              borderRadius: '8px',
              backgroundColor: '#ffebee',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#d32f2f', margin: '0 0 10px 0' }}>Connection Error</h3>
              <p style={{ color: '#666', margin: '0' }}>{error}</p>
            </div>
          </div>
        )}
        
        <div className="coming-soon" style={{ marginTop: '40px', textAlign: 'center' }}>
          <h3 style={{ color: '#666', marginBottom: '15px' }}>Coming Soon:</h3>
          <div className="coming-soon-list" style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', borderRadius: '20px', color: '#666' }}>📊 Salesforce</span>
            <span style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', borderRadius: '20px', color: '#666' }}>📧 Gmail</span>
            <span style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', borderRadius: '20px', color: '#666' }}>📈 Google Analytics</span>
            <span style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', borderRadius: '20px', color: '#666' }}>💼 LinkedIn</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSelector; 