import { useState } from 'react'
import {
  ArrowLeft,
  FileText,
  Mail,
  CheckCircle,
  XCircle,
  Lightbulb,
  Target,
  Award,
  BookOpen,
  Zap,
  Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { useApplicationStore } from '@/stores/application.store'
import { useProfileStore } from '@/stores/profile.store'
import { useEditorStore } from '@/stores/editor.store'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function JobAnalysis() {
  const navigate = useAppStore((s) => s.navigate)
  const addToast = useAppStore((s) => s.addToast)
  const profile = useProfileStore((s) => s.profile)
  const skills = useProfileStore((s) => s.skills)
  const { jobAnalysis, currentApplication, atsScore, scoreATS } = useApplicationStore()
  const [generatingCV, setGeneratingCV] = useState(false)
  const [generatingCL, setGeneratingCL] = useState(false)

  if (!jobAnalysis || !currentApplication) {
    return (
      <div className="empty-state">
        <Target className="empty-state-icon" />
        <h3 className="empty-state-title">No analysis available</h3>
        <p className="empty-state-text">Go to New Application to analyze a job description first.</p>
        <Button onClick={() => navigate('new-application')}>New Application</Button>
      </div>
    )
  }

  const userSkillNames = skills.map((s) => s.name.toLowerCase())

  const requiredMatched = jobAnalysis.required_skills.filter((s) =>
    userSkillNames.includes(s.toLowerCase())
  )
  const requiredMissing = jobAnalysis.required_skills.filter(
    (s) => !userSkillNames.includes(s.toLowerCase())
  )

  // Compute an approximate ATS score from analysis data
  const totalRequired = jobAnalysis.required_skills.length || 1
  const matchPercent = Math.round((requiredMatched.length / totalRequired) * 100)

  const handleGenerateCV = async () => {
    setGeneratingCV(true)
    try {
      const cv = await window.api.generateCV(currentApplication.id!, 'modern')
      if (cv.content_html) {
        useEditorStore.getState().setContent(cv.content_html)
      }
      addToast({ type: 'success', title: 'CV Generated', message: cv.title })
      navigate('editor')
    } catch {
      addToast({ type: 'error', title: 'Generation failed' })
    } finally {
      setGeneratingCV(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    setGeneratingCL(true)
    try {
      const letter = await window.api.generateCoverLetter(currentApplication.id!)
      // Copy to clipboard
      await navigator.clipboard.writeText(letter)
      addToast({
        type: 'success',
        title: 'Cover letter generated',
        message: 'Copied to clipboard!',
      })
      navigate('cover-letter')
    } catch {
      addToast({ type: 'error', title: 'Generation failed' })
    } finally {
      setGeneratingCL(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('new-application')}>
          Back
        </Button>
        <div>
          <h1 className="page-title">{currentApplication.role_title}</h1>
          <p className="page-subtitle">{currentApplication.company}</p>
        </div>
      </div>

      {/* ATS Score — circular */}
      <div className="flex gap-6 mb-8">
        <Card variant="surface" padding="lg" className="flex items-center justify-center" style={{ minWidth: 200 }}>
          <CircularScore score={matchPercent} />
        </Card>

        {/* Score breakdown */}
        <div className="flex-1 grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <ScoreCard icon={Zap} label="Keywords" score={matchPercent} />
          <ScoreCard icon={Award} label="Experience" score={jobAnalysis.experience_level === 'senior' ? 70 : 85} />
          <ScoreCard icon={Target} label="Skills" score={Math.round((requiredMatched.length / totalRequired) * 100)} />
          <ScoreCard icon={BookOpen} label="Education" score={80} />
        </div>
      </div>

      {/* Required skills */}
      <Card variant="surface" padding="md" className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Required Skills</h3>
        <div className="flex flex-wrap gap-2">
          {requiredMatched.map((s) => (
            <span key={s} className="tag tag-success flex items-center gap-1">
              <CheckCircle size={12} /> {s}
            </span>
          ))}
          {requiredMissing.map((s) => (
            <span key={s} className="tag tag-danger flex items-center gap-1">
              <XCircle size={12} /> {s}
            </span>
          ))}
        </div>
        {jobAnalysis.preferred_skills.length > 0 && (
          <>
            <h4 className="text-sm font-semibold mt-4 mb-2 text-secondary">Preferred Skills</h4>
            <div className="flex flex-wrap gap-2">
              {jobAnalysis.preferred_skills.map((s) => (
                <span key={s} className="tag tag-accent">{s}</span>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Key Responsibilities & Qualifications */}
      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card variant="surface" padding="md">
          <h3 className="text-lg font-semibold mb-3">Key Responsibilities</h3>
          <ul className="flex flex-col gap-2">
            {jobAnalysis.key_responsibilities.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary">
                <span className="text-accent mt-1">•</span>
                {r}
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="surface" padding="md">
          <h3 className="text-lg font-semibold mb-3">Qualifications</h3>
          <ul className="flex flex-col gap-2">
            {jobAnalysis.qualifications.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary">
                <span className="text-accent mt-1">•</span>
                {q}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Suggestions */}
      {atsScore && atsScore.suggestions.length > 0 && (
        <Card variant="surface" padding="md" className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} style={{ color: 'var(--warning)' }} />
            <h3 className="text-lg font-semibold">Suggestions</h3>
          </div>
          <ul className="flex flex-col gap-2">
            {atsScore.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary">
                <span className="text-warning mt-1">→</span>
                {s}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          size="lg"
          loading={generatingCV}
          iconLeft={<Sparkles size={18} />}
          onClick={handleGenerateCV}
        >
          Generate CV
        </Button>
        <Button
          variant="secondary"
          size="lg"
          loading={generatingCL}
          iconLeft={<Mail size={18} />}
          onClick={handleGenerateCoverLetter}
        >
          Generate Cover Letter
        </Button>
      </div>
    </>
  )
}

function CircularScore({ score }: { score: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  let color = 'var(--danger)'
  if (score >= 70) color = 'var(--success)'
  else if (score >= 40) color = 'var(--warning)'

  return (
    <div className="circular-progress" style={{ width: 160, height: 160 }}>
      <svg width={160} height={160}>
        <circle
          cx={80}
          cy={80}
          r={radius}
          fill="none"
          stroke="var(--bg-surface)"
          strokeWidth={10}
        />
        <circle
          cx={80}
          cy={80}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <span className="circular-progress-value">{score}%</span>
      <span className="circular-progress-label" style={{ marginTop: 44 }}>
        ATS Match
      </span>
    </div>
  )
}

function ScoreCard({
  icon: Icon,
  label,
  score,
}: {
  icon: typeof Zap
  label: string
  score: number
}) {
  return (
    <Card variant="elevated" padding="sm">
      <div className="flex items-center gap-3 mb-2">
        <Icon size={16} style={{ color: 'var(--accent-primary)' }} />
        <span className="text-sm font-medium">{label}</span>
        <span className="ml-auto text-sm font-bold">{score}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${score}%` }} />
      </div>
    </Card>
  )
}
