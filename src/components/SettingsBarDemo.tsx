import React from 'react';
import SettingsBar from './SettingsBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SettingsBarDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">Settings Bar Demo</h1>
        
        {/* Compact variant */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Compact Settings Bar</CardTitle>
            <p className="text-white/70">
              This is the compact version - perfect for headers or when space is limited
            </p>
          </CardHeader>
          <CardContent>
            <SettingsBar variant="compact" />
          </CardContent>
        </Card>

        {/* Default variant */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Default Settings Bar</CardTitle>
            <p className="text-white/70">
              This is the default horizontal bar layout - shows all options inline
            </p>
          </CardHeader>
          <CardContent>
            <SettingsBar variant="default" />
          </CardContent>
        </Card>

        {/* Usage instructions */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-white/80 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Features:</h3>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Delete Account:</strong> Permanently deletes the user's account with confirmation dialog</li>
                <li><strong>Choose Voice for AI:</strong> Opens a dialog to select from 6 different AI voice options</li>
                <li><strong>Cancel Subscription:</strong> Cancels the user's active subscription and updates the database</li>
                <li><strong>Log Out:</strong> Signs the user out and redirects to home page</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white">Usage:</h3>
              <pre className="bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto mt-2">
{`// Compact variant (dropdown menu)
<SettingsBar variant="compact" />

// Default variant (horizontal bar)
<SettingsBar variant="default" />

// With custom styling
<SettingsBar 
  variant="compact" 
  className="my-custom-class" 
/>`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Requirements:</h3>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>User must be authenticated (component returns null if no user)</li>
                <li>Uses existing AuthContext for user management and logout</li>
                <li>Integrates with Supabase for subscription and account deletion</li>
                <li>Stores voice preference in localStorage</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsBarDemo;