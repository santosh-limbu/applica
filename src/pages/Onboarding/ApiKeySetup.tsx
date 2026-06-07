import { useState, useEffect } from 'react'
import {
  Key,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Monitor,
  Plug,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import type { ProviderConfig, ProviderInfo } from '@/types/ipc.types'

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  Monitor: <Monitor size={24} />,
  Plug: <Plug size={24} />,
  Sparkles: <Sparkles size={24} />,
}

export default function ApiKeySetup() {
  const navigate = useAppStore((s) => s.navigate)
  const addToast = useAppStore((s) => s.addToast)

  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [config, setConfig] = useState<ProviderConfig>({
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
  })
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  // Load available providers
  useEffect(() => {
    const load = async () => {
      try {
        const available = await window.api.getAvailableProviders()
        setProviders(available)
      } catch (e) {
        console.error('Failed to load providers', e)
      }
    }
    load()
  }, [])

  // Fetch models when provider/endpoint changes
  useEffect(() => {
    if (config.provider === 'gemini') return
    const fetchModels = async () => {
      setIsLoadingModels(true)
      try {
        const modelList = await window.api.listProviderModels(config)
        setModels(modelList)
        if (modelList.length > 0 && !config.model) {
          setConfig(prev => ({ ...prev, model: modelList[0] }))
        }
      } catch {
        setModels([])
      } finally {
        setIsLoadingModels(false)
      }
    }
    const timer = setTimeout(fetchModels, 600)
    return () => clearTimeout(timer)
  }, [config.provider, config.endpoint])

  const handleSelectProvider = (id: ProviderConfig['provider']) => {
    const info = providers.find(p => p.id === id)
    setConfig({
      provider: id,
      endpoint: info?.defaultEndpoint || config.endpoint,
      model: undefined,
      apiKey: undefined,
    })
    setApiKeyInput('')
    setTestResult(null)
    setModels([])
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const testConfig: ProviderConfig = {
        ...config,
        apiKey: apiKeyInput || undefined,
      }
      const ok = await window.api.testProviderConnection(testConfig)
      setTestResult(ok ? 'success' : 'error')
      if (ok) {
        // Save on successful test
        await window.api.saveProviderConfig(testConfig)
        addToast({ type: 'success', title: 'Connected!', message: `Successfully connected to ${config.provider}` })
      } else {
        addToast({ type: 'error', title: 'Connection failed', message: 'Check your endpoint and model.' })
      }
    } catch {
      setTestResult('error')
      addToast({ type: 'error', title: 'Connection failed', message: 'Could not reach the AI provider.' })
    } finally {
      setTesting(false)
    }
  }

  const handleContinue = () => {
    if (testResult === 'success') {
      navigate('onboarding-profile')
    }
  }

  const handleSkip = async () => {
    // Save the config even on skip so it persists
    try {
      await window.api.saveProviderConfig(config)
    } catch { /* ignore */ }
    addToast({
      type: 'warning',
      title: 'AI features disabled',
      message: 'You can configure your AI provider later in Settings',
    })
    navigate('onboarding-profile')
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-bg" />

      <div className="onboarding-card">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <StepIndicator current={1} total={3} />
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div
              className="feature-icon"
              style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)' }}
            >
              <Monitor size={28} />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Connect an AI Provider</h2>
          <p className="text-secondary text-sm" style={{ maxWidth: 440, margin: '0 auto' }}>
            Applica uses AI to analyze job descriptions and generate tailored CVs.
            Connect a local LLM or a cloud provider.
          </p>
        </div>

        {/* Provider selector */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {providers.map((p) => (
            <button
              key={p.id}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
                config.provider === p.id
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-subtle hover:border-accent/30 text-muted'
              }`}
              onClick={() => handleSelectProvider(p.id)}
            >
              {PROVIDER_ICONS[p.icon] || <Monitor size={24} />}
              <span className="text-xs font-semibold">{p.name}</span>
            </button>
          ))}
        </div>

        {/* Provider-specific fields */}
        <Card variant="surface" padding="md" className="mb-5">
          <div className="flex flex-col gap-3">
            {/* Endpoint (local providers) */}
            {config.provider !== 'gemini' && (
              <Input
                label="Endpoint URL"
                value={config.endpoint || ''}
                onChange={(e) => {
                  setConfig(prev => ({ ...prev, endpoint: (e.target as HTMLInputElement).value }))
                  setTestResult(null)
                }}
                placeholder={config.provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234'}
              />
            )}

            {/* API Key (Gemini required, OpenAI-compat optional) */}
            {(config.provider === 'gemini' || config.provider === 'openai-compat') && (
              <div>
                <Input
                  type="password"
                  label={config.provider === 'gemini' ? 'API Key' : 'API Key (optional)'}
                  placeholder={config.provider === 'gemini' ? 'Paste your Gemini API key' : 'Leave blank if not required'}
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput((e.target as HTMLInputElement).value)
                    setTestResult(null)
                  }}
                  iconLeft={<Key size={16} />}
                />
                {config.provider === 'gemini' && (
                  <p className="text-xs text-tertiary mt-1">
                    Get a free key from{' '}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent inline-flex items-center gap-1"
                    >
                      Google AI Studio <ExternalLink size={10} />
                    </a>
                  </p>
                )}
              </div>
            )}

            {/* Model selector */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Model</label>
              <div className="flex gap-2">
                {config.provider === 'gemini' ? (
                  <select
                    className="input-field flex-1"
                    value={config.model || 'gemini-2.0-flash'}
                    onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
                  >
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
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
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <div className="flex-1">
                    <Input
                      value={config.model || ''}
                      onChange={e => setConfig(prev => ({ ...prev, model: (e.target as HTMLInputElement).value }))}
                      placeholder={config.provider === 'ollama' ? 'e.g. llama3.2' : 'e.g. default'}
                    />
                  </div>
                )}
                {config.provider !== 'gemini' && (
                  <button
                    className="p-2.5 rounded-lg border border-subtle hover:bg-accent/10 text-muted hover:text-accent transition-colors"
                    onClick={async () => {
                      setIsLoadingModels(true)
                      try {
                        const list = await window.api.listProviderModels(config)
                        setModels(list)
                      } catch { setModels([]) }
                      finally { setIsLoadingModels(false) }
                    }}
                    title="Refresh models"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
              {isLoadingModels && (
                <p className="text-xs text-accent mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Detecting models...
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Test result */}
        {testResult && (
          <div
            className={`flex items-center gap-2 mb-4 p-3 rounded-md text-sm ${
              testResult === 'success' ? 'text-success' : 'text-danger'
            }`}
            style={{
              background: testResult === 'success' ? 'var(--success-muted)' : 'var(--danger-muted)',
            }}
          >
            {testResult === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {testResult === 'success'
              ? 'Connected successfully!'
              : 'Connection failed — check your settings and try again.'}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mb-4">
          <Button
            variant="secondary"
            size="md"
            onClick={handleTest}
            loading={testing}
            disabled={
              (config.provider === 'gemini' && !apiKeyInput.trim()) ||
              (config.provider !== 'gemini' && !config.endpoint)
            }
            className="flex-1"
          >
            Test Connection
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={testResult !== 'success'}
            onClick={handleContinue}
            iconRight={<ArrowRight size={16} />}
            className="flex-1"
          >
            Continue
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" iconLeft={<ArrowLeft size={14} />} onClick={() => navigate('onboarding-welcome')}>
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className={`step-dot ${
              i === current ? 'step-dot-active' : i < current ? 'step-dot-done' : ''
            }`}
          />
          {i < total - 1 && (
            <span className={`step-line ${i < current ? 'step-line-active' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}
