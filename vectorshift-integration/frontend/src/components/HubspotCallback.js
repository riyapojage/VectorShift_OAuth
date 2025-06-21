import React, { useState, useEffect } from 'react';
import { handleHubspotCallback } from '../integrations/HubspotIntegration';

/**
 * HubSpot OAuth Callback Component
 * 
 * This component handles the OAuth redirect from HubSpot.
 * It extracts the authorization code from URL parameters and processes the callback.
 */
export default function HubspotCallback() {
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Processing HubSpot connection...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        console.log('🔍 HubSpot callback received:', { code: !!code, state, error });

        // Handle OAuth error from HubSpot
        if (error) {
          setStatus('error');
          setMessage('HubSpot authorization failed');
          setError(errorDescription || error);
          return;
        }

        // Handle missing authorization code
        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          setError('Missing authorization code in callback URL');
          return;
        }

        // Process the OAuth callback
        console.log('🔄 Processing OAuth callback with code:', code.substring(0, 10) + '...');
        
        const result = await handleHubspotCallback(code, state);
        
        console.log('✅ OAuth callback processed successfully:', result);
        setStatus('success');
        setMessage('HubSpot connected successfully!');
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to main app with success indicator
        setTimeout(() => {
          window.location.href = '/?oauth_success=true';
        }, 2000);

      } catch (err) {
        console.error('❌ OAuth callback processing failed:', err);
        setStatus('error');
        setMessage('Failed to connect HubSpot');
        setError(err.message || 'Unknown error occurred');
      }
    };

    processCallback();
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
      }}>
        {/* HubSpot Logo/Icon */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#ff7a59',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            fontSize: '24px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            HS
          </div>
        </div>

        {/* Status Message */}
        <h2 style={{ 
          color: status === 'success' ? '#28a745' : status === 'error' ? '#dc3545' : '#6c757d',
          marginBottom: '15px'
        }}>
          {status === 'processing' && '🔄 Processing...'}
          {status === 'success' && '✅ Connected!'}
          {status === 'error' && '❌ Connection Failed'}
        </h2>

        <p style={{ 
          fontSize: '16px', 
          color: '#666', 
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        {/* Error Details */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            <strong>Error Details:</strong><br />
            {error}
          </div>
        )}

        {/* Action Buttons */}
        {status === 'success' && (
          <div style={{ color: '#28a745', fontSize: '14px' }}>
            Redirecting to main app in 2 seconds...
          </div>
        )}

        {status === 'error' && (
          <div>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                marginRight: '10px'
              }}
            >
              Back to Home
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {status === 'processing' && (
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #ff7a59',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        )}
      </div>
    </div>
  );
} 