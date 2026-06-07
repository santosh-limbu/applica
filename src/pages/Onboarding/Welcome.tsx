import { Sparkles, Brain, FileText, BarChart3, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    description: 'Analyzes job descriptions and tailors your CV to match requirements perfectly.',
  },
  {
    icon: FileText,
    title: 'Professional Templates',
    description: 'Beautifully designed, ATS-friendly templates that make you stand out.',
  },
  {
    icon: BarChart3,
    title: 'Application Tracking',
    description: 'Track every application from submission to offer in one dashboard.',
  },
]

export default function Welcome() {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <div className="onboarding-page">
      <div className="onboarding-bg" />

      <div className="onboarding-card" style={{ maxWidth: 580 }}>
        <div className="text-center mb-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles size={40} style={{ color: 'var(--accent-primary)' }} />
            <h1
              className="text-5xl font-extrabold text-gradient"
              style={{ letterSpacing: '-0.04em' }}
            >
              Applica
            </h1>
          </div>

          <p className="text-lg text-secondary" style={{ maxWidth: 400, margin: '0 auto' }}>
            Craft perfect CVs for every opportunity
          </p>
        </div>

        {/* Feature highlights */}
        <div className="flex flex-col gap-3 mb-8">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <Card key={f.title} padding="none" variant="surface">
                <div className="feature-card">
                  <div className="feature-icon">
                    <Icon size={22} />
                  </div>
                  <div className="feature-text">
                    <h4>{f.title}</h4>
                    <p>{f.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <StepIndicator current={0} total={3} />
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Button
            size="lg"
            iconRight={<ArrowRight size={18} />}
            onClick={() => navigate('onboarding-apikey')}
          >
            Get Started
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
