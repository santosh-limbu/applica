import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAppStore } from '@/stores/app.store'
import type { ProviderConfig, ProviderInfo } from '@/types/ipc.types'
import {
  Settings, Key, Palette, HardDrive, AlertTriangle,
  Monitor, Plug, Sparkles, CheckCircle, XCircle, Loader2, RefreshCw, Folder
} from 'lucide-react'

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  Monitor: <Monitor className="w-6 h-6" />,
  Plug: <Plug className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
}

export const SettingsPage: React.FC = () => {
  const { addToast } = useAppStore()

  // Provider state
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [config, setConfig] = useState<ProviderConfig>({ provider: 'ollama', endpoint: 'http://localhost:11434' })
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isSaving, setIsSaving] = useState(false)
  const [outputDirectory, setOutputDirectory] = useState<string | null>(null)

  // Load provider info on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [availableProviders, savedConfig, savedOutputDir] = await Promise.all([
          window.api.getAvailableProviders(),
          window.api.getProviderConfig(),
          window.api.getSettings('output_directory'),
        ])
        setProviders(availableProviders)
        setConfig(savedConfig)
        setOutputDirectory(savedOutputDir)
        if (savedConfig.apiKey && savedConfig.apiKey !== '••••••••') {
          setApiKeyInput(savedConfig.apiKey)
        } else if (savedConfig.apiKey === '••••••••') {
          setApiKeyInput('••••••••')
        }
      } catch (e) {
        console.error('Failed to load provider config', e)
      }
    }
    load()
  }, [])

  // Fetch models when provider or endpoint changes
  useEffect(() => {
    if (config.provider === 'gemini') return // Gemini models are hardcoded
    const fetchModels = async () => {
      setIsLoadingModels(true)
      try {
        const modelList = await window.api.listProviderModels(config)
        setModels(modelList)
        // Auto-select first model if none selected
        if (modelList.length > 0 && !config.model) {
          setConfig(prev => ({ ...prev, model: modelList[0] }))
        }
      } catch {
        setModels([])
      } finally {
        setIsLoadingModels(false)
      }
    }
    // Debounce slightly so rapid typing doesn't spam requests
    const timer = setTimeout(fetchModels, 500)
    return () => clearTimeout(timer)
  }, [config.provider, config.endpoint])

  const handleSelectProvider = (providerId: ProviderConfig['provider']) => {
    const info = providers.find(p => p.id === providerId)
    setConfig({
      provider: providerId,
      endpoint: info?.defaultEndpoint || config.endpoint,
      model: undefined,
      apiKey: undefined,
    })
    setApiKeyInput('')
    setConnectionStatus('idle')
    setModels([])
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setConnectionStatus('idle')
    try {
      const testConfig: ProviderConfig = {
        ...config,
        apiKey: apiKeyInput && apiKeyInput !== '••••••••' ? apiKeyInput : undefined,
      }
      const success = await window.api.testProviderConnection(testConfig)
      setConnectionStatus(success ? 'success' : 'error')
      if (success) {
        addToast({ title: 'Connected', message: `Successfully connected to ${config.provider}`, type: 'success' })
      } else {
        addToast({ title: 'Connection Failed', message: 'Could not connect. Check the endpoint and model.', type: 'error' })
      }
    } catch (e: any) {
      setConnectionStatus('error')
      addToast({ title: 'Error', message: e.message || 'Connection test failed', type: 'error' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const saveConfig: ProviderConfig = {
        ...config,
        apiKey: apiKeyInput && apiKeyInput !== '••••••••' ? apiKeyInput : undefined,
      }
      await window.api.saveProviderConfig(saveConfig)
      addToast({ title: 'Saved', message: 'AI provider settings saved', type: 'success' })
    } catch (e: any) {
      addToast({ title: 'Error', message: e.message || 'Failed to save settings', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefreshModels = async () => {
    setIsLoadingModels(true)
    try {
      const modelList = await window.api.listProviderModels(config)
      setModels(modelList)
      addToast({ title: 'Models Refreshed', message: `Found ${modelList.length} models`, type: 'success' })
    } catch {
      setModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  const handleBrowseDirectory = async () => {
    try {
      const selected = await window.api.selectDirectory()
      if (selected) {
        await window.api.setSettings('output_directory', selected)
        setOutputDirectory(selected)
        addToast({ title: 'Export Folder Set', message: `Exports will be saved to ${selected}`, type: 'success' })
      }
    } catch (e: any) {
      addToast({ title: 'Error', message: e.message || 'Failed to select folder', type: 'error' })
    }
  }

  const handleResetDirectory = async () => {
    try {
      await window.api.setSettings('output_directory', '')
      setOutputDirectory(null)
      addToast({ title: 'Export Folder Reset', message: 'You will be prompted for save location every time', type: 'info' })
    } catch (e: any) {
      addToast({ title: 'Error', message: e.message || 'Failed to reset folder', type: 'error' })
    }
  }

  const selectedProviderInfo = providers.find(p => p.id === config.provider)

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-muted mt-1">Manage application preferences and integrations</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 max-w-3xl flex flex-col gap-8">
        
        {/* AI Provider Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold text-white">AI Provider</h2>
          </div>

          {/* Provider selector cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {providers.map((p) => (
              <Card
                key={p.id}
                className={`p-4 cursor-pointer transition-all ${
                  config.provider === p.id
                    ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                    : 'hover:border-subtle'
                }`}
                onClick={() => handleSelectProvider(p.id)}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`${config.provider === p.id ? 'text-accent' : 'text-muted'}`}>
                    {PROVIDER_ICONS[p.icon] || <Monitor className="w-6 h-6" />}
                  </div>
                  <div className="font-semibold text-sm text-white">{p.name}</div>
                  <div className="text-xs text-muted leading-tight">{p.description}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Provider-specific configuration */}
          <Card className="p-6 flex flex-col gap-4">
            {/* Endpoint input (for local providers) */}
            {config.provider !== 'gemini' && (
              <div>
                <Input
                  label="Endpoint URL"
                  value={config.endpoint || ''}
                  onChange={e => setConfig(prev => ({ ...prev, endpoint: (e.target as HTMLInputElement).value }))}
                  placeholder={selectedProviderInfo?.defaultEndpoint || 'http://localhost:11434'}
                />
                <p className="text-xs text-secondary mt-1">
                  {config.provider === 'ollama'
                    ? 'Make sure Ollama is running. Default: http://localhost:11434'
                    : 'Enter the base URL of your OpenAI-compatible server.'}
                </p>
              </div>
            )}

            {/* API key input (for Gemini and optional for OpenAI-compat) */}
            {(config.provider === 'gemini' || config.provider === 'openai-compat') && (
              <div>
                <Input
                  label={config.provider === 'gemini' ? 'Gemini API Key' : 'API Key (optional)'}
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput((e.target as HTMLInputElement).value)}
                  placeholder={config.provider === 'gemini' ? 'Paste your Gemini API key' : 'Leave blank if not required'}
                />
                {config.provider === 'gemini' && (
                  <p className="text-xs text-secondary mt-1">
                    Get a free key from{' '}
                    <a href="#" className="text-accent hover:underline">Google AI Studio</a>.
                  </p>
                )}
              </div>
            )}

            {/* Model selector */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Model</label>
              <div className="flex gap-2">
                {config.provider === 'gemini' ? (
                  <select
                    className="input-field flex-1"
                    value={config.model || 'gemini-2.0-flash'}
                    onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
                  >
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  </select>
                ) : models.length > 0 ? (
                  <select
                    className="input-field flex-1"
                    value={config.model || ''}
                    onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
                  >
                    {!config.model && <option value="">Select a model...</option>}
                    {models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={config.model || ''}
                    onChange={e => setConfig(prev => ({ ...prev, model: (e.target as HTMLInputElement).value }))}
                    placeholder={config.provider === 'ollama' ? 'e.g. llama3.2' : 'e.g. default'}
                  />
                )}
                {config.provider !== 'gemini' && (
                  <button
                    className="p-2.5 rounded-lg bg-surface border border-subtle hover:bg-accent/10 text-muted hover:text-accent transition-colors"
                    onClick={handleRefreshModels}
                    disabled={isLoadingModels}
                    title="Refresh models"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
              {isLoadingModels && (
                <p className="text-xs text-accent mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Fetching available models...
                </p>
              )}
            </div>

            {/* Connection status */}
            {connectionStatus !== 'idle' && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                connectionStatus === 'success'
                  ? 'bg-success/10 text-success border border-success/20'
                  : 'bg-danger/10 text-danger border border-danger/20'
              }`}>
                {connectionStatus === 'success'
                  ? <><CheckCircle className="w-4 h-4" /> Connection successful!</>
                  : <><XCircle className="w-4 h-4" /> Connection failed. Check your settings.</>
                }
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleTestConnection} loading={isTesting}>
                Test Connection
              </Button>
              <Button onClick={handleSave} loading={isSaving}>
                Save Settings
              </Button>
            </div>
          </Card>
        </section>

        {/* Export Folder Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Folder className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold text-white">Export Settings</h2>
          </div>
          <Card className="p-6 flex flex-col gap-4">
            <p className="text-sm text-muted">Configure where your generated CVs and cover letters are saved when exported.</p>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-secondary">Output Directory</label>
              <div className="flex gap-3 items-center">
                <div className="flex-1 input-field py-2 px-3 text-sm text-white bg-surface-elevated rounded-lg border border-subtle overflow-hidden text-ellipsis whitespace-nowrap min-h-[38px] flex items-center">
                  {outputDirectory || 'Prompt every time'}
                </div>
                <Button variant="outline" onClick={handleBrowseDirectory}>Browse</Button>
                {outputDirectory && (
                  <Button variant="ghost" onClick={handleResetDirectory} className="text-danger hover:bg-danger/10">Reset</Button>
                )}
              </div>
              <p className="text-xs text-secondary mt-1">
                If set, documents will be exported directly to this folder. If empty, you will be prompted for a save location each time.
              </p>
            </div>
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
