import { useState } from 'react'
import {
  Key,
  ExternalLink,
  Copy,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function ApiKeySetup() {
  const navigate = useAppStore((s) => s.navigate)
  const addToast = useAppStore((s) => s.addToast)

  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const handleTest = async () => {
    if (!apiKey.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const ok = await window.api.testApiKey(apiKey.trim())
      setTestResult(ok ? 'success' : 'error')
      if (ok) {
        await window.api.saveApiKey(apiKey.trim())
        addToast({ type: 'success', title: 'API key verified', message: 'Connection to Gemini AI is working' })
      } else {
        addToast({ type: 'error', title: 'Invalid API key', message: 'Please check your key and try again' })
      }
    } catch {
      setTestResult('error')
      addToast({ type: 'error', title: 'Connection failed', message: 'Could not reach the Gemini API' })
    } finally {
      setTesting(false)
    }
  }

  const handleContinue = async () => {
    if (testResult === 'success') {
      navigate('onboarding-profile')
    }
  }

  const handleSkip = async () => {
    addToast({
      type: 'warning',
      title: 'AI features disabled',
      message: 'You can add your API key later in Settings',
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
              <Sparkles size={28} />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Connect to Gemini AI</h2>
          <p className="text-secondary text-sm" style={{ maxWidth: 400, margin: '0 auto' }}>
            Applica uses Google's Gemini AI to analyze job descriptions and generate tailored CVs
          </p>
        </div>

        {/* Steps guide */}
        <Card variant="surface" padding="md" className="mb-6">
          <div className="flex flex-col gap-4">
            <StepGuide
              number={1}
              title="Visit Google AI Studio"
              description={
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-accent"
                >
                  aistudio.google.com/apikey <ExternalLink size={12} />
                </a>
              }
            />
            <StepGuide
              number={2}
              title="Create an API key"
              description="Click 'Create API Key' and select a project"
            />
            <StepGuide
              number={3}
              title="Paste your key below"
              description="We store it securely on your device"
            />
          </div>
        </Card>

        {/* API key input */}
        <div className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder="Paste your Gemini API key…"
                value={apiKey}
                onChange={(e) => {
                  setApiKey((e.target as HTMLInputElement).value)
                  setTestResult(null)
                }}
                iconLeft={<Key size={16} />}
              />
            </div>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowKey(!showKey)}
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <div
            className={`flex items-center gap-2 mb-4 p-3 rounded-md text-sm ${
              testResult === 'success'
                ? 'text-success'
                : 'text-danger'
            }`}
            style={{
              background:
                testResult === 'success' ? 'var(--success-muted)' : 'var(--danger-muted)',
            }}
          >
            {testResult === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {testResult === 'success'
              ? 'API key is valid — connected successfully!'
              : 'Invalid API key — please check and try again'}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mb-4">
          <Button
            variant="secondary"
            size="md"
            onClick={handleTest}
            loading={testing}
            disabled={!apiKey.trim()}
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

function StepGuide({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex items-center justify-center rounded-full font-bold text-xs"
        style={{
          width: 24,
          height: 24,
          flexShrink: 0,
          background: 'var(--accent-muted)',
          color: 'var(--accent-primary)',
        }}
      >
        {number}
      </div>
      <div>
        <div className="text-sm font-semibold text-primary">{title}</div>
        <div className="text-xs text-tertiary mt-1">{description}</div>
      </div>
    </div>
  )
}
