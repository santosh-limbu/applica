import { useState, useRef } from 'react'
import { Linkedin, Clipboard, Upload, RefreshCw, ArrowRight, ArrowLeft, Info } from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { useProfileStore } from '@/stores/profile.store'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import ProgressCircle from '@/components/ui/ProgressCircle'
import StepIndicator from '@/components/ui/StepIndicator'

type StepState = 'input' | 'processing'

export default function LinkedInImportStep() {
  const navigate = useAppStore((s) => s.navigate)
  const addToast = useAppStore((s) => s.addToast)
  const { saveProfile, saveExperience, saveEducation, saveSkill, saveCertification, loadProfile } = useProfileStore()

  const [stepState, setStepState] = useState<StepState>('input')
  const [method, setMethod] = useState<'automated' | 'paste'>('automated')
  const [loadingMsg, setLoadingMsg] = useState('')
  const [profileUrl, setProfileUrl] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [scraperOpen, setScraperOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState(0)

  const handleOpenBrowser = async () => {
    try {
      setLoadingMsg('Opening LinkedIn browser window...')
      await window.api.openLinkedInScraper(profileUrl)
      setScraperOpen(true)
      addToast({
        type: 'info',
        title: 'Browser window opened',
        message: 'Please log in, open your profile page, scroll down, then click "Complete Extraction" here.',
      })
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to open browser', message: err.message })
    }
  }

  const handleTriggerScrape = async () => {
    setStepState('processing')
    setLoadingMsg('Extracting text from LinkedIn page...')
    try {
      const rawText = await window.api.completeLinkedInScrape()
      setScraperOpen(false)
      await handleImportData(rawText)
    } catch (err: any) {
      setStepState('input')
      addToast({ type: 'error', title: 'Extraction failed', message: err.message })
    }
  }

  const handleTriggerPaste = async () => {
    if (!pasteText.trim()) {
      addToast({ type: 'error', title: 'Input required', message: 'Please paste your LinkedIn profile text.' })
      return
    }
    setStepState('processing')
    await handleImportData(pasteText)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      if (text) {
        setStepState('processing')
        await handleImportData(text)
      }
    }
    reader.onerror = () => {
      addToast({ type: 'error', title: 'Read failed', message: 'Could not read text file.' })
    }
    reader.readAsText(file)
  }

  const handleImportData = async (text: string) => {
    setLoadingMsg('Applicai AI is analyzing profile text & structuring details...')
    setProgress(0)

    const unsubscribe = window.api.onParseProfileProgress((streamProgress) => {
      setProgress(streamProgress)
    })

    try {
      const parsed = await window.api.parseProfileText(text)
      
      // Save parsed details directly to the database
      const profileData = parsed.profile || {}
      const savedProfile = await saveProfile({
        full_name: profileData.full_name || 'Candidate Name',
        email: profileData.email || '',
        phone: profileData.phone || '',
        location: profileData.location || '',
        linkedin_url: profileData.linkedin_url || profileUrl || '',
        portfolio_url: profileData.portfolio_url || '',
        professional_summary: profileData.professional_summary || '',
      })

      // Save Experiences
      if (parsed.experiences && Array.isArray(parsed.experiences)) {
        for (const exp of parsed.experiences) {
          await saveExperience({
            profile_id: savedProfile.id!,
            company: exp.company || 'Unknown Company',
            role: exp.role || 'Unknown Role',
            start_date: exp.start_date || 'N/A',
            end_date: exp.end_date,
            location: exp.location,
            description: exp.description,
          } as any)
        }
      }

      // Save Education
      if (parsed.education && Array.isArray(parsed.education)) {
        for (const edu of parsed.education) {
          await saveEducation({
            profile_id: savedProfile.id!,
            institution: edu.institution || 'Unknown Institution',
            degree: edu.degree || 'Degree',
            field_of_study: edu.field_of_study,
            start_date: edu.start_date,
            end_date: edu.end_date,
            grade: edu.grade,
            description: edu.description,
          } as any)
        }
      }

      // Save Skills
      if (parsed.skills && Array.isArray(parsed.skills)) {
        for (const sk of parsed.skills) {
          await saveSkill({
            profile_id: savedProfile.id!,
            name: sk.name,
            category: sk.category || 'Technical',
          } as any)
        }
      }

      // Save Certifications
      if (parsed.certifications && Array.isArray(parsed.certifications)) {
        for (const cert of parsed.certifications) {
          await saveCertification({
            profile_id: savedProfile.id!,
            name: cert.name,
            issuer: cert.issuer,
            date_obtained: cert.date_obtained,
            expiry_date: cert.expiry_date,
            credential_url: cert.credential_url,
          } as any)
        }
      }

      // Force reload the profile store
      await loadProfile()

      // Sweep to 100%
      setProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 400))

      addToast({
        type: 'success',
        title: 'LinkedIn data imported!',
        message: 'Let\'s review and complete your details.',
      })

      navigate('onboarding-profile')
    } catch (err: any) {
      setStepState('input')
      addToast({
        type: 'error',
        title: 'Import failed',
        message: err.message || 'Could not parse LinkedIn profile.',
      })
    } finally {
      unsubscribe()
    }
  }

  const handleSkip = () => {
    navigate('onboarding-profile')
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-bg" />

      <div className="onboarding-card" style={{ maxWidth: 580 }}>
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <StepIndicator current={2} total={4} />
        </div>

        {stepState === 'processing' ? (
          <Card variant="surface" padding="lg" className="flex flex-col items-center justify-center py-12 gap-5 text-center">
            <ProgressCircle progress={progress} />
            <h3 className="text-xl font-bold">{loadingMsg}</h3>
            <p className="text-sm text-secondary max-w-xs">
              Our AI is parsing your profile text, identifying your roles, education, and extracting technical skills...
            </p>
          </Card>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-3">
                <div
                  className="feature-icon"
                  style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)' }}
                >
                  <Linkedin size={28} />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Import from LinkedIn</h2>
              <p className="text-secondary text-sm" style={{ maxWidth: 440, margin: '0 auto' }}>
                Quickly build your profile, work history, and skills by connecting LinkedIn or pasting your profile text.
              </p>
            </div>

            {/* Methods Tabs */}
            <div className="flex bg-surface p-1 rounded-lg border border-default mb-5">
              <button
                className={`flex-1 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  method === 'automated' ? 'bg-subtle text-accent' : 'text-tertiary hover:text-secondary'
                }`}
                style={method === 'automated' ? { background: 'var(--accent-muted)', color: 'var(--accent-primary)' } : undefined}
                onClick={() => setMethod('automated')}
              >
                <Linkedin size={14} /> Guided Browser Sync
              </button>
              <button
                className={`flex-1 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  method === 'paste' ? 'bg-subtle text-accent' : 'text-tertiary hover:text-secondary'
                }`}
                style={method === 'paste' ? { background: 'var(--accent-muted)', color: 'var(--accent-primary)' } : undefined}
                onClick={() => setMethod('paste')}
              >
                <Clipboard size={14} /> Paste Text / File
              </button>
            </div>

            {method === 'automated' ? (
              <div className="flex flex-col gap-4">
                <div className="text-secondary text-xs bg-surface/60 border border-default p-4 rounded-lg flex gap-3 items-start">
                  <Info size={16} className="text-accent shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 leading-relaxed">
                    <span className="font-semibold text-primary">How automated sync works:</span>
                    <span>1. Enter your LinkedIn profile URL below (optional) and click <strong>"Open LinkedIn Browser"</strong>.</span>
                    <span>2. Sign in if required in the popup window.</span>
                    <span>3. Navigate to your Profile page and scroll down to load all sections.</span>
                    <span>4. Click <strong>"Complete Extraction"</strong> to parse your details.</span>
                  </div>
                </div>

                <Input
                  label="LinkedIn Profile URL (Optional)"
                  placeholder="e.g. https://www.linkedin.com/in/your-username"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                />

                <div className="flex gap-3 justify-end mt-2">
                  {scraperOpen && (
                    <Button variant="outline" onClick={handleTriggerScrape} iconLeft={<RefreshCw size={14} className="animate-spin" />}>
                      Complete Extraction
                    </Button>
                  )}
                  <Button onClick={handleOpenBrowser} variant="primary">
                    {scraperOpen ? 'Focus Browser Window' : 'Open LinkedIn Browser'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-secondary leading-relaxed">
                  Copy all text from your LinkedIn profile page (Ctrl+A, Ctrl+C) and paste it below. Alternatively, drag and drop a <code>.txt</code> file here.
                </p>

                <textarea
                  className="input-field p-3 text-xs w-full font-mono bg-surface border-default focus:border-accent"
                  style={{ minHeight: 180, resize: 'vertical', borderRadius: 'var(--radius-md)' }}
                  placeholder="Paste copied LinkedIn profile text here..."
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />

                <div className="flex justify-between items-center mt-2">
                  <div>
                    <input
                      type="file"
                      accept=".txt"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={<Upload size={14} />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload .txt file
                    </Button>
                  </div>
                  <Button onClick={handleTriggerPaste} variant="primary">
                    Parse Profile
                  </Button>
                </div>
              </div>
            )}

            <div className="divider my-6" />

            {/* Step navigation actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<ArrowLeft size={14} />}
                onClick={() => navigate('onboarding-apikey')}
              >
                Back
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconRight={<ArrowRight size={14} />}
                onClick={handleSkip}
              >
                Skip & Setup Manually
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

