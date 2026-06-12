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
import PageHeader from '@/components/layout/PageHeader'

export default function JobAnalysis() {
  const navigate = useAppStore((s) => s.navigate)
  const addToast = useAppStore((s) => s.addToast)
  const profile = useProfileStore((s) => s.profile)
  const skills = useProfileStore((s) => s.skills)
  const { jobAnalysis, currentApplication, atsScore, loadApplication, setGenerating } = useApplicationStore()
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

  // Action buttons
  const handleGenerateCV = async () => {
    if (!currentApplication?.id) return
    const appId = currentApplication.id
    setGenerating(appId, 'cv')
    setGeneratingCV(true)
    try {
      const cv = await window.api.generateCV(appId, 'modern')
      if (cv.content_html) {
        useEditorStore.getState().setContent(cv.content_html)
      }
      // Reload the application from the database to get the updated ATS score and details
      await loadApplication(appId)
      addToast({ type: 'success', title: 'CV Generated', message: cv.title })
      navigate('editor')
    } catch (err) {
      console.error('CV generation failed', err)
      addToast({ type: 'error', title: 'Generation failed' })
    } finally {
      setGeneratingCV(false)
      setGenerating(appId, null)
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (!currentApplication?.id) return
    const appId = currentApplication.id
    setGenerating(appId, 'cover-letter')
    setGeneratingCL(true)
    try {
      const letter = await window.api.generateCoverLetter(appId)
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
      setGenerating(appId, null)
    }
  }

  return (
    <>
      <PageHeader
        title={currentApplication.role_title}
        subtitle={currentApplication.company}
        actions={
          <Button variant="ghost" size="sm" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('new-application')}>
            Back
          </Button>
        }
      />

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
