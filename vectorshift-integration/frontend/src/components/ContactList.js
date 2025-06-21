import React, { useEffect } from 'react';
import { useFetchHubspotItems } from '../integrations/HubspotIntegration';

/**
 * ContactList Component
 * 
 * A React component that fetches and displays HubSpot contacts using the
 * useFetchHubspotItems hook. Provides loading states and clean contact display.
 */
export default function ContactList({ userId = 'user_' + Date.now() }) {
  // Use the hook to fetch contacts data
  const { contacts, loading, error, fetchContacts } = useFetchHubspotItems(userId);

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Loading state with enhanced spinner
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 40px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e3f2fd',
            borderTop: '3px solid #2196f3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{
            fontSize: '18px',
            fontWeight: '500',
            color: '#495057'
          }}>
            Loading your HubSpot contacts...
          </div>
        </div>
        <div style={{
          fontSize: '14px',
          color: '#6c757d',
          lineHeight: '1.4'
        }}>
          This may take a moment while we fetch your data from HubSpot CRM
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '5px',
        color: '#721c24',
        textAlign: 'center'
      }}>
        <strong>Error loading contacts:</strong>
        <br />
        {error}
        <br />
        <button 
          onClick={fetchContacts}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (!contacts || contacts.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px',
        textAlign: 'center',
        color: '#666'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px'
        }}>
          📋
        </div>
        <h3 style={{ 
          margin: '0 0 8px 0',
          color: '#333'
        }}>
          No contacts found
        </h3>
        <p style={{ 
          margin: '0 0 16px 0',
          fontSize: '14px'
        }}>
          Your HubSpot account doesn't have any contacts yet.
        </p>
        <button 
          onClick={fetchContacts}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>
    );
  }

  // Contact list display with enhanced styling
  return (
    <div style={{
      padding: '0'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <div>
          <h2 style={{ 
            margin: '0 0 4px 0',
            color: '#212529',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            HubSpot Contacts
          </h2>
          <p style={{
            margin: '0',
            color: '#6c757d',
            fontSize: '14px'
          }}>
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} from your CRM
          </p>
        </div>
        <button 
          onClick={fetchContacts}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: loading ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            boxShadow: loading ? 'none' : '0 2px 4px rgba(40, 167, 69, 0.2)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#218838';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(40, 167, 69, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#28a745';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(40, 167, 69, 0.2)';
            }
          }}
        >
          {loading && (
            <div style={{
              width: '14px',
              height: '14px',
              border: '2px solid #ffffff40',
              borderTop: '2px solid #ffffff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          )}
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {contacts.map((contact, index) => {
          // Build full name from first and last name
          const fullName = [contact.firstname, contact.lastname]
            .filter(name => name && name.trim())
            .join(' ') || 'Unknown Contact';

          return (
            <div 
              key={contact.id || index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.borderColor = '#adb5bd';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.borderColor = '#dee2e6';
              }}
            >
              {/* Contact Info */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                flex: 1
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#212529',
                  lineHeight: '1.2'
                }}>
                  {fullName}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#6c757d'
                  }}>
                    📧
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: '#495057',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    {contact.email || 'No email available'}
                  </span>
                </div>
              </div>

              {/* Contact ID Badge */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '4px'
              }}>
                <div style={{
                  padding: '6px 12px',
                  backgroundColor: '#e3f2fd',
                  color: '#1565c0',
                  fontSize: '11px',
                  borderRadius: '16px',
                  fontFamily: 'system-ui, monospace',
                  fontWeight: '500',
                  letterSpacing: '0.5px'
                }}>
                  ID: {contact.id || 'N/A'}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#adb5bd',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '500'
                }}>
                  HubSpot Contact
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with additional info */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '13px',
          color: '#6c757d',
          marginBottom: '4px'
        }}>
          ✅ Successfully loaded {contacts.length} contact{contacts.length !== 1 ? 's' : ''} from HubSpot CRM
        </div>
        <div style={{
          fontSize: '12px',
          color: '#adb5bd'
        }}>
          Data refreshed automatically • Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
} 