import { useState, useRef } from 'react'
import {
  Linkedin,
  Upload,
  Clipboard,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Info
} from 'lucide-react'
import { useProfileStore } from '@/stores/profile.store'
import { useAppStore } from '@/stores/app.store'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import ProgressCircle from '@/components/ui/ProgressCircle'

interface LinkedInImportModalProps {
  open: boolean
  onClose: () => void
}

type Step = 'method' | 'scraping' | 'review' | 'success'
type ImportMethod = 'automated' | 'paste'

export default function LinkedInImportModal({ open, onClose }: LinkedInImportModalProps) {
  const { addToast } = useAppStore()
  const {
    profile,
    experiences,
    education,
    skills,
    certifications,
    saveProfile,
    saveExperience,
    saveEducation,
    saveSkill,
    saveCertification,
    deleteExperience,
    deleteEducation,
    deleteSkill,
    deleteCertification,
    loadProfile
  } = useProfileStore()

  // Wizard Steps
  const [step, setStep] = useState<Step>('method')
  const [method, setMethod] = useState<ImportMethod>('automated')
  const [loadingMsg, setLoadingMsg] = useState('')
  const [progress, setProgress] = useState(0)

  // Form inputs
  const [profileUrl, setProfileUrl] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [scraperOpen, setScraperOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parsed data from AI
  const [parsedData, setParsedData] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Selection states for Merge/Overwrite
  const [selectedProfileFields, setSelectedProfileFields] = useState<Record<string, boolean>>({
    full_name: true,
    location: true,
    email: true,
    phone: true,
    linkedin_url: true,
    portfolio_url: true,
    professional_summary: true,
  })

  const [selectedExperiences, setSelectedExperiences] = useState<Record<number, boolean>>({})
  const [selectedEducation, setSelectedEducation] = useState<Record<number, boolean>>({})
  const [selectedSkills, setSelectedSkills] = useState<Record<number, boolean>>({})
  const [selectedCertifications, setSelectedCertifications] = useState<Record<number, boolean>>({})

  const [mergePolicies, setMergePolicies] = useState<Record<string, 'merge' | 'overwrite'>>({
    experiences: 'merge',
    education: 'merge',
    skills: 'merge',
    certifications: 'merge',
  })

  // Handle resetting state on close
  const handleClose = () => {
    setStep('method')
    setMethod('automated')
    setLoadingMsg('')
    setProgress(0)
    setProfileUrl('')
    setPasteText('')
    setScraperOpen(false)
    setParsedData(null)
    setSelectedProfileFields({
      full_name: true,
      location: true,
      email: true,
      phone: true,
      linkedin_url: true,
      portfolio_url: true,
      professional_summary: true,
    })
    setSelectedExperiences({})
    setSelectedEducation({})
    setSelectedSkills({})
    setSelectedCertifications({})
    setMergePolicies({
      experiences: 'merge',
      education: 'merge',
      skills: 'merge',
      certifications: 'merge',
    })
    setSaving(false)
    onClose()
  }

  // --- Step Actions ---

  const handleOpenBrowser = async () => {
    try {
      setLoadingMsg('Opening LinkedIn browser window...')
      await window.api.openLinkedInScraper(profileUrl)
      setScraperOpen(true)
      addToast({
        type: 'info',
        title: 'Browser window opened',
        message: 'Please log in if needed, navigate to your profile page, scroll down, then click "Complete Extraction".',
      })
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to open browser', message: err.message })
    }
  }

  const handleTriggerScrape = async () => {
    setStep('scraping')
    setLoadingMsg('Extracting text from LinkedIn page...')
    try {
      const rawText = await window.api.completeLinkedInScrape()
      setScraperOpen(false)
      await handleParseText(rawText)
    } catch (err: any) {
      setStep('method')
      addToast({ type: 'error', title: 'Extraction failed', message: err.message })
    }
  }

  const handleTriggerPaste = async () => {
    if (!pasteText.trim()) {
      addToast({ type: 'error', title: 'Input required', message: 'Please paste your profile text.' })
      return
    }
    setStep('scraping')
    await handleParseText(pasteText)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      if (text) {
        setStep('scraping')
        await handleParseText(text)
      }
    }
    reader.onerror = () => {
      addToast({ type: 'error', title: 'Read failed', message: 'Could not read text file.' })
    }
    reader.readAsText(file)
  }

  const handleParseText = async (text: string) => {
    setLoadingMsg('Applicai AI is analyzing profile text & structuring details...')
    setProgress(0)

    const unsubscribe = window.api.onParseProfileProgress((streamProgress) => {
      setProgress(streamProgress)
    })

    try {
      const result = await window.api.parseProfileText(text)
      setParsedData(result)

      // Initialize checkbox selection maps
      if (result.experiences) {
        const expMap: Record<number, boolean> = {}
        result.experiences.forEach((_: any, idx: number) => { expMap[idx] = true })
        setSelectedExperiences(expMap)
      }
      if (result.education) {
        const eduMap: Record<number, boolean> = {}
        result.education.forEach((_: any, idx: number) => { eduMap[idx] = true })
        setSelectedEducation(eduMap)
      }
      if (result.skills) {
        const skMap: Record<number, boolean> = {}
        result.skills.forEach((_: any, idx: number) => { skMap[idx] = true })
        setSelectedSkills(skMap)
      }
      if (result.certifications) {
        const certMap: Record<number, boolean> = {}
        result.certifications.forEach((_: any, idx: number) => { certMap[idx] = true })
        setSelectedCertifications(certMap)
      }

      setProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 400))

      setStep('review')
    } catch (err: any) {
      setStep('method')
      addToast({ type: 'error', title: 'AI Parsing Failed', message: err.message })
    } finally {
      unsubscribe()
    }
  }

  const handleImportSubmit = async () => {
    if (!profile?.id) {
      addToast({ type: 'error', title: 'No profile found', message: 'Please create a profile first.' })
      return
    }

    if (saving) return
    setSaving(true)
    setStep('scraping')
    setLoadingMsg('Saving imported details to database...')

    try {
      // 1. Update Profile general fields
      const updatedProfile = { ...profile } as any
      const profileData = parsedData.profile || {}
      Object.keys(selectedProfileFields).forEach((field) => {
        if (selectedProfileFields[field] && profileData[field] !== undefined && profileData[field] !== null) {
          updatedProfile[field] = profileData[field]
        }
      })
      await saveProfile(updatedProfile)

      // Helper to check and append/overwrite list sections
      // Experiences
      if (mergePolicies.experiences === 'overwrite') {
        await Promise.all(experiences.map((exp) => exp.id && deleteExperience(exp.id)))
      }
      if (parsedData.experiences) {
        for (let i = 0; i < parsedData.experiences.length; i++) {
          if (selectedExperiences[i]) {
            const exp = parsedData.experiences[i]
            await saveExperience({
              profile_id: profile.id,
              company: exp.company || 'Unknown Company',
              role: exp.role || 'Unknown Role',
              start_date: exp.start_date || 'N/A',
              end_date: exp.end_date,
              location: exp.location,
              description: exp.description,
            } as any)
          }
        }
      }

      // Education
      if (mergePolicies.education === 'overwrite') {
        await Promise.all(education.map((edu) => edu.id && deleteEducation(edu.id)))
      }
      if (parsedData.education) {
        for (let i = 0; i < parsedData.education.length; i++) {
          if (selectedEducation[i]) {
            const edu = parsedData.education[i]
            await saveEducation({
              profile_id: profile.id,
              institution: edu.institution || 'Unknown School',
              degree: edu.degree || 'Degree',
              field_of_study: edu.field_of_study,
              start_date: edu.start_date,
              end_date: edu.end_date,
              grade: edu.grade,
              description: edu.description,
            } as any)
          }
        }
      }

      // Skills
      if (mergePolicies.skills === 'overwrite') {
        await Promise.all(skills.map((sk) => sk.id && deleteSkill(sk.id)))
      }
      if (parsedData.skills) {
        for (let i = 0; i < parsedData.skills.length; i++) {
          if (selectedSkills[i]) {
            const sk = parsedData.skills[i]
            await saveSkill({
              profile_id: profile.id,
              name: sk.name,
              category: sk.category || 'Technical',
            } as any)
          }
        }
      }

      // Certifications
      if (mergePolicies.certifications === 'overwrite') {
        await Promise.all(certifications.map((c) => c.id && deleteCertification(c.id)))
      }
      if (parsedData.certifications) {
        for (let i = 0; i < parsedData.certifications.length; i++) {
          if (selectedCertifications[i]) {
            const cert = parsedData.certifications[i]
            await saveCertification({
              profile_id: profile.id,
              name: cert.name,
              issuer: cert.issuer,
              date_obtained: cert.date_obtained,
              expiry_date: cert.expiry_date,
              credential_url: cert.credential_url,
            } as any)
          }
        }
      }

      // Reload profile store to refresh UI
      await loadProfile()

      setStep('success')
      addToast({ type: 'success', title: 'LinkedIn Profile Synced!' })
    } catch (err: any) {
      setStep('review')
      addToast({ type: 'error', title: 'Failed to save imported details', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  // --- Rendering Helpers ---

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="LinkedIn Profile Sync"
      maxWidth={step === 'review' ? '800px' : '580px'}
    >
      {step === 'method' && (
        <div className="flex flex-col gap-5">
          <div className="flex bg-surface p-1 rounded-lg border border-default">
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
              <Clipboard size={14} /> Paste Text / Upload file
            </button>
          </div>

          {method === 'automated' ? (
            <div className="flex flex-col gap-4">
              <div className="text-secondary text-xs bg-surface/60 border border-default p-4 rounded-lg flex gap-3 items-start">
                <Info size={16} className="text-accent shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-primary">How automated sync works:</span>
                  <span>1. Enter your LinkedIn profile URL below (optional) and click <strong>"Open LinkedIn Browser"</strong>.</span>
                  <span>2. Sign in to your account if required in the popup window.</span>
                  <span>3. Navigate to your Profile page and scroll to the bottom (loads lazy-loaded skills/experiences).</span>
                  <span>4. Return to this window and click <strong>"Complete Extraction"</strong>.</span>
                </div>
              </div>

              <Input
                label="LinkedIn Profile URL (Optional)"
                placeholder="e.g. https://www.linkedin.com/in/your-username"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
              />

              <div className="flex gap-3 mt-2 justify-end">
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
                style={{ minHeight: 200, resize: 'vertical', borderRadius: 'var(--radius-md)' }}
                placeholder="Paste copied LinkedIn profile text here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />

              <div className="flex justify-between items-center mt-1">
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
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                  <Button onClick={handleTriggerPaste}>Parse Profile</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'scraping' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <ProgressCircle progress={progress} />
          <h4 className="text-base font-semibold">{loadingMsg}</h4>
          <p className="text-xs text-tertiary max-w-xs">This might take a minute as our AI structures your details into specific database schemas.</p>
        </div>
      )}

      {step === 'review' && parsedData && (
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-hidden">
          <p className="text-xs text-secondary border-bottom pb-2">
            Review the extracted details from LinkedIn. Choose which fields and sections to sync and whether to merge or replace.
          </p>

          <div className="overflow-y-auto pr-2 flex flex-col gap-5 text-xs" style={{ maxHeight: '50vh' }}>
            
            {/* GENERAL PROFILE DETAILS */}
            <Card variant="surface" padding="md" className="flex flex-col gap-3">
              <h4 className="font-semibold text-accent text-sm flex items-center gap-1">
                General Profile Details
              </h4>
              <div className="grid grid-cols-2 gap-3 mt-1 text-secondary">
                {Object.keys(selectedProfileFields).map((field) => {
                  const val = parsedData.profile?.[field]
                  if (!val) return null
                  const label = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                  return (
                    <label key={field} className="flex gap-2 items-start p-1.5 rounded hover:bg-hover cursor-pointer border border-subtle">
                      <input
                        type="checkbox"
                        checked={selectedProfileFields[field]}
                        onChange={(e) => setSelectedProfileFields({ ...selectedProfileFields, [field]: e.target.checked })}
                        className="mt-0.5 text-accent"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-[10px] text-tertiary">{label}</span>
                        <span className="truncate max-w-[280px]" title={val}>{val}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </Card>

            {/* EXPERIENCES */}
            <Card variant="surface" padding="md" className="flex flex-col gap-3">
              <div className="flex justify-between items-center border-bottom pb-2">
                <h4 className="font-semibold text-accent text-sm">Work History</h4>
                <div className="flex gap-2">
                  <select
                    className="bg-base border border-default rounded px-2 py-0.5 text-[10px] text-secondary font-medium"
                    value={mergePolicies.experiences}
                    onChange={(e) => setMergePolicies({ ...mergePolicies, experiences: e.target.value as any })}
                  >
                    <option value="merge">Merge (Keep Current + Add Selected)</option>
                    <option value="overwrite">Overwrite (Wipe Current & Replace)</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                {parsedData.experiences && parsedData.experiences.length > 0 ? (
                  parsedData.experiences.map((exp: any, idx: number) => (
                    <label key={idx} className="flex gap-3 items-start p-3 bg-base border border-default rounded hover:bg-hover cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedExperiences[idx] || false}
                        onChange={(e) => setSelectedExperiences({ ...selectedExperiences, [idx]: e.target.checked })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-primary">{exp.role}</div>
                        <div className="text-secondary">{exp.company} {exp.location && `· ${exp.location}`}</div>
                        <div className="text-[10px] text-tertiary mt-0.5">{exp.start_date} - {exp.end_date || 'Present'}</div>
                        {exp.description && <p className="text-tertiary text-[11px] mt-1 line-clamp-2">{exp.description}</p>}
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-tertiary italic text-center py-2">No experiences extracted.</p>
                )}
              </div>
            </Card>

            {/* EDUCATION */}
            <Card variant="surface" padding="md" className="flex flex-col gap-3">
              <div className="flex justify-between items-center border-bottom pb-2">
                <h4 className="font-semibold text-accent text-sm">Education</h4>
                <select
                  className="bg-base border border-default rounded px-2 py-0.5 text-[10px] text-secondary font-medium"
                  value={mergePolicies.education}
                  onChange={(e) => setMergePolicies({ ...mergePolicies, education: e.target.value as any })}
                >
                  <option value="merge">Merge (Keep Current + Add Selected)</option>
                  <option value="overwrite">Overwrite (Wipe Current & Replace)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                {parsedData.education && parsedData.education.length > 0 ? (
                  parsedData.education.map((edu: any, idx: number) => (
                    <label key={idx} className="flex gap-3 items-start p-3 bg-base border border-default rounded hover:bg-hover cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEducation[idx] || false}
                        onChange={(e) => setSelectedEducation({ ...selectedEducation, [idx]: e.target.checked })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-primary">{edu.degree}</div>
                        <div className="text-secondary">{edu.institution} {edu.field_of_study && `· ${edu.field_of_study}`}</div>
                        <div className="text-[10px] text-tertiary mt-0.5">{edu.start_date} - {edu.end_date || 'Ongoing'}</div>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-tertiary italic text-center py-2">No education extracted.</p>
                )}
              </div>
            </Card>

            {/* SKILLS */}
            <Card variant="surface" padding="md" className="flex flex-col gap-3">
              <div className="flex justify-between items-center border-bottom pb-2">
                <h4 className="font-semibold text-accent text-sm">Skills</h4>
                <select
                  className="bg-base border border-default rounded px-2 py-0.5 text-[10px] text-secondary font-medium"
                  value={mergePolicies.skills}
                  onChange={(e) => setMergePolicies({ ...mergePolicies, skills: e.target.value as any })}
                >
                  <option value="merge">Merge (Keep Current + Add Selected)</option>
                  <option value="overwrite">Overwrite (Wipe Current & Replace)</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {parsedData.skills && parsedData.skills.length > 0 ? (
                  parsedData.skills.map((sk: any, idx: number) => (
                    <label key={idx} className="flex gap-1.5 items-center px-2 py-1 bg-base border border-default rounded hover:bg-hover cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSkills[idx] || false}
                        onChange={(e) => setSelectedSkills({ ...selectedSkills, [idx]: e.target.checked })}
                      />
                      <span className="font-medium text-primary text-[11px]">{sk.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-tertiary italic py-1">No skills extracted.</p>
                )}
              </div>
            </Card>

            {/* CERTIFICATIONS */}
            <Card variant="surface" padding="md" className="flex flex-col gap-3">
              <div className="flex justify-between items-center border-bottom pb-2">
                <h4 className="font-semibold text-accent text-sm">Certifications</h4>
                <select
                  className="bg-base border border-default rounded px-2 py-0.5 text-[10px] text-secondary font-medium"
                  value={mergePolicies.certifications}
                  onChange={(e) => setMergePolicies({ ...mergePolicies, certifications: e.target.value as any })}
                >
                  <option value="merge">Merge (Keep Current + Add Selected)</option>
                  <option value="overwrite">Overwrite (Wipe Current & Replace)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                {parsedData.certifications && parsedData.certifications.length > 0 ? (
                  parsedData.certifications.map((cert: any, idx: number) => (
                    <label key={idx} className="flex gap-3 items-start p-3 bg-base border border-default rounded hover:bg-hover cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCertifications[idx] || false}
                        onChange={(e) => setSelectedCertifications({ ...selectedCertifications, [idx]: e.target.checked })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-primary">{cert.name}</div>
                        <div className="text-secondary">{cert.issuer}</div>
                        <div className="text-[10px] text-tertiary mt-0.5">Obtained: {cert.date_obtained || 'N/A'}</div>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-tertiary italic text-center py-2">No certifications extracted.</p>
                )}
              </div>
            </Card>

          </div>

          <div className="flex justify-end gap-3 border-top pt-3 mt-2">
            <Button variant="secondary" onClick={() => setStep('method')}>Back</Button>
            <Button onClick={handleImportSubmit} variant="primary" loading={saving}>Apply to Profile</Button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
          <CheckCircle size={48} className="text-success" />
          <h3 className="text-xl font-bold">Profile Synced Successfully!</h3>
          <p className="text-xs text-secondary max-w-sm">
            Your general info, experiences, education, skills, and certifications have been updated in your profile database and are ready to be used in tailored CVs.
          </p>
          <Button onClick={handleClose} variant="primary" className="mt-2">
            Dismiss
          </Button>
        </div>
      )}
    </Modal>
  )
}
