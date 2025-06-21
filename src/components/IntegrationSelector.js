import React, { useState } from 'react';
import HubspotIntegration, { useStartHubspotAuth } from '../integrations/HubspotIntegration';

const IntegrationSelector = () => {
  // State to track which integration is currently selected
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  
  // State to track connection status for each integration
  const [connectionStatus, setConnectionStatus] = useState({
    hubspot: 'disconnected' // 'disconnected', 'connecting', 'connected', 'error'
  });

  // Use HubSpot authentication hook
  const { startAuth, isLoading: isHubspotAuthLoading, error: hubspotAuthError } = useStartHubspotAuth();

  // List of available integrations
  const availableIntegrations = [
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Connect to HubSpot CRM to import contacts and deals',
      icon: '🔗',
      component: HubspotIntegration,
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

  // Handle HubSpot connection
  const handleHubspotConnect = async () => {
    console.log('🔗 Connecting to HubSpot...');
    
    // Update status to connecting
    setConnectionStatus(prev => ({
      ...prev,
      hubspot: 'connecting'
    }));

    try {
      // Start the OAuth process
      await startAuth();
      
      // For now, simulate success after auth starts
      // In real implementation, this will be handled by the callback
      setTimeout(() => {
        setConnectionStatus(prev => ({
          ...prev,
          hubspot: 'connected'
        }));
        // Show the HubSpot integration component
        setSelectedIntegration('hubspot');
      }, 2000);
      
    } catch (error) {
      console.error('HubSpot connection error:', error);
      setConnectionStatus(prev => ({
        ...prev,
        hubspot: 'error'
      }));
    }
  };

  // Go back to integration selection
  const handleBackToSelector = () => {
    setSelectedIntegration(null);
  };

  // Get button text based on connection status
  const getButtonText = (integration) => {
    switch (integration.status) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected ✅';
      case 'error':
        return 'Retry Connection';
      default:
        return 'Connect';
    }
  };

  // Get button disabled state
  const getButtonDisabled = (integration) => {
    return integration.status === 'connecting' || isHubspotAuthLoading;
  };

  // Render the selected integration component
  const renderSelectedIntegration = () => {
    const integration = availableIntegrations.find(
      (item) => item.id === selectedIntegration
    );
    
    if (!integration) return null;
    
    const IntegrationComponent = integration.component;
    
    return (
      <div className="selected-integration">
        <button onClick={handleBackToSelector} className="back-button">
          ← Back to Integrations
        </button>
        <IntegrationComponent />
      </div>
    );
  };

  return (
    <div className="integration-selector">
      {!selectedIntegration ? (
        <div className="integration-list">
          <h1>VectorShift Integrations</h1>
          <p>Choose an integration to connect your data sources:</p>
          
          <div className="integration-grid">
            {availableIntegrations.map((integration) => (
              <div
                key={integration.id}
                className={`integration-card ${integration.status}`}
                onClick={() => handleIntegrationSelect(integration.id)}
              >
                <div className="integration-icon">{integration.icon}</div>
                <h3>{integration.name}</h3>
                <p>{integration.description}</p>
                
                <button 
                  className={`select-button ${integration.status}`}
                  disabled={getButtonDisabled(integration)}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    handleIntegrationSelect(integration.id);
                  }}
                >
                  {getButtonText(integration)}
                </button>

                {/* Show connection status */}
                {integration.status === 'connecting' && (
                  <div className="status-indicator">
                    <span>🔄 Starting OAuth flow...</span>
                  </div>
                )}
                
                {integration.status === 'error' && hubspotAuthError && (
                  <div className="error-indicator">
                    <span>❌ {hubspotAuthError}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="coming-soon">
            <h3>Coming Soon:</h3>
            <div className="coming-soon-list">
              <span>📊 Salesforce</span>
              <span>📧 Gmail</span>
              <span>📈 Google Analytics</span>
              <span>💼 LinkedIn</span>
            </div>
          </div>

          {/* Global status messages */}
          {isHubspotAuthLoading && (
            <div className="global-status">
              <p>🚀 Initiating HubSpot connection...</p>
            </div>
          )}
        </div>
      ) : (
        renderSelectedIntegration()
      )}
    </div>
  );
};

export default IntegrationSelector; 