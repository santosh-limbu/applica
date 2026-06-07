import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAppStore } from '@/stores/app.store'
import { Settings, Key, Palette, HardDrive, AlertTriangle } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const { addToast } = useAppStore()

  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const key = await window.api.getApiKey()
        if (key) {
          setApiKey('••••••••••••••••••••••••')
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadApiKey()
  }, [])

  const handleTestKey = async () => {
    if (apiKey === '••••••••••••••••••••••••' || !apiKey) {
      addToast({ title: 'Error', message: 'Please enter a valid API key to test', type: 'warning' })
      return
    }

    setIsTesting(true)
    try {
      const isValid = await window.api.testApiKey(apiKey)
      if (isValid) {
        await window.api.saveApiKey(apiKey)
        addToast({ title: 'Success', message: 'API key is valid and has been saved securely', type: 'success' })
        setApiKey('••••••••••••••••••••••••')
      } else {
        addToast({ title: 'Error', message: 'Invalid API key. Please check and try again', type: 'error' })
      }
    } catch (e: any) {
      addToast({ title: 'Error', message: e.message || 'Failed to test API key', type: 'error' })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-muted mt-1">Manage application preferences and integrations</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 max-w-3xl flex flex-col gap-8">
        
        {/* API Key Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold text-white">Gemini API Key</h2>
          </div>
          <Card className="p-6 flex flex-col gap-4">
            <p className="text-sm text-muted">
              Applica uses Google's Gemini AI to analyze job descriptions and generate tailored CVs. 
              Your API key is securely encrypted on your device.
            </p>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input 
                  label="API Key" 
                  type="password" 
                  value={apiKey} 
                  onChange={e => setApiKey(e.target.value)} 
                  placeholder="Paste your Gemini API key here"
                />
              </div>
              <Button onClick={handleTestKey} isLoading={isTesting} disabled={!apiKey || isTesting}>
                Update & Test
              </Button>
            </div>
            <p className="text-xs text-secondary mt-2">
              Don't have a key? Get one for free from <a href="#" onClick={(e) => {
                e.preventDefault()
                // Would normally open in system browser here
              }} className="text-accent hover:underline">Google AI Studio</a>.
            </p>
          </Card>
        </section>

        {/* Theme Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold text-white">Appearance</h2>
          </div>
          <Card className="p-6">
            <p className="text-sm text-muted mb-4">Choose your preferred theme.</p>
            <div className="flex gap-4">
              <Button variant="outline" className="border-accent text-accent bg-accent/10">Dark Mode (Default)</Button>
              <Button variant="outline" disabled className="opacity-50" title="Coming soon">Light Mode</Button>
            </div>
          </Card>
        </section>

        {/* Data Management Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold text-white">Data Management</h2>
          </div>
          <Card className="p-6 flex flex-col gap-4">
            <p className="text-sm text-muted">Manage your local database and application data.</p>
            <div className="flex gap-4">
              <Button variant="outline">Export All Data (JSON)</Button>
              <Button variant="outline">Import Data</Button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-danger/20">
              <h3 className="text-sm font-semibold text-danger flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> Danger Zone
              </h3>
              <p className="text-xs text-muted mb-3">This action cannot be undone. All profiles, applications, and CVs will be deleted.</p>
              <Button variant="danger" size="sm">Reset All Data</Button>
            </div>
          </Card>
        </section>

        {/* About Section */}
        <section className="text-center mt-8 pt-8 border-t border-subtle text-muted text-sm flex flex-col items-center gap-2">
          <div className="font-bold text-lg text-white">Applica</div>
          <div>Version {window.api?.getAppVersion ? window.api.getAppVersion() : '1.0.0'}</div>
          <div>Created for the modern job seeker.</div>
        </section>

      </div>
    </div>
  )
}
