import { useState } from 'react'
import {
  ClipboardPaste,
  Link2,
  ArrowRight,
  Globe,
  Loader2,
  Building2,
  Briefcase,
  Sparkles,
  ArrowLeft,
} from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { useApplicationStore } from '@/stores/application.store'
import { useProfileStore } from '@/stores/profile.store'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

type Tab = 'paste' | 'url'

export default function JobInput() {
  const navigate = useAppStore((s) => s.navigate)
  const addToast = useAppStore((s) => s.addToast)
  const profile = useProfileStore((s) => s.profile)
  const { analyzeJob, saveApplication, setCurrentApplication, setJobAnalysis } =
    useApplicationStore()

  const [activeTab, setActiveTab] = useState<Tab>('paste')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [company, setCompany] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [fetching, setFetching] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const handleFetchUrl = async () => {
    if (!url.trim()) return
    setFetching(true)
    try {
      const result = await window.api.scrapeJobUrl(url.trim())
      setDescription(result.description)
      setCompany(result.company || company)
      setRoleTitle(result.title || roleTitle)
      addToast({ type: 'success', title: 'Job fetched', message: `${result.title} at ${result.company}` })
    } catch {
      addToast({ type: 'error', title: 'Fetch failed', message: 'Could not scrape job from URL' })
    } finally {
      setFetching(false)
    }
  }

  const handleAnalyze = async () => {
    if (!description.trim()) {
      addToast({ type: 'warning', title: 'No description', message: 'Please enter or fetch a job description' })
      return
    }
    if (!company.trim() || !roleTitle.trim()) {
      addToast({ type: 'warning', title: 'Missing fields', message: 'Please enter company name and role title' })
      return
    }

    setAnalyzing(true)
    try {
      // Save application
      const app = await saveApplication({
        profile_id: profile?.id || 1,
        company: company.trim(),
        role_title: roleTitle.trim(),
        job_description: description.trim(),
        job_url: url.trim() || undefined,
        status: 'draft',
      })
      setCurrentApplication(app)

      // Analyze
      const analysis = await analyzeJob(description.trim())
      setJobAnalysis(analysis)

      addToast({ type: 'success', title: 'Analysis complete' })
      navigate('job-analysis')
    } catch {
      addToast({ type: 'error', title: 'Analysis failed', message: 'Could not analyze the job description' })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col h-full gap-6 overflow-hidden p-1">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          iconLeft={<ArrowLeft size={16} />} 
          onClick={() => navigate('dashboard')}
          style={{ padding: '8px' }}
        >
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight" style={{ margin: 0 }}>New Application</h1>
          <p className="text-muted mt-1" style={{ margin: 0 }}>Provide the job details to start tailoring your profile and documents</p>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid gap-6 flex-1 min-h-0 overflow-hidden" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Left Column: Input Panel */}
        <div className="flex flex-col gap-4 min-h-0">
          <Card variant="surface" className="p-6 flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-1" style={{ margin: 0 }}>Application Details</h3>
            
            <div className="flex flex-col gap-4">
              <Input
                label="Company Name"
                placeholder="e.g. Acme Corp"
                value={company}
                onChange={(e) => setCompany((e.target as HTMLInputElement).value)}
                iconLeft={<Building2 size={16} className="text-accent" />}
              />
              <Input
                label="Role Title"
                placeholder="e.g. Senior Software Engineer"
                value={roleTitle}
                onChange={(e) => setRoleTitle((e.target as HTMLInputElement).value)}
                iconLeft={<Briefcase size={16} className="text-accent" />}
              />
            </div>

            <div className="divider my-2" />

            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-tertiary uppercase tracking-wider">Description Source</label>
              {/* Tab switcher inside left card */}
              <div className="flex gap-1 bg-surface-elevated p-1 rounded-lg" style={{ border: '1px solid var(--border-default)' }}>
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all`}
                  style={{
                    background: activeTab === 'paste' ? 'var(--accent-primary)' : 'transparent',
                    color: activeTab === 'paste' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('paste')}
                >
                  <ClipboardPaste size={14} />
                  Paste Details
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all`}
                  style={{
                    background: activeTab === 'url' ? 'var(--accent-primary)' : 'transparent',
                    color: activeTab === 'url' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('url')}
                >
                  <Link2 size={14} />
                  Import URL
                </button>
              </div>
            </div>

            {/* URL Input sub-flow */}
            {activeTab === 'url' && (
              <div className="flex flex-col gap-2 mt-1">
                <Input
                  label="Job Post URL"
                  placeholder="https://careers.example.com/job/..."
                  value={url}
                  onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
                  iconLeft={<Globe size={16} className="text-accent" />}
                />
                <Button
                  variant="secondary"
                  onClick={handleFetchUrl}
                  loading={fetching}
                  disabled={!url.trim()}
                  style={{ width: '100%' }}
                >
                  Fetch Job Details
                </Button>
              </div>
            )}

             {/* Action CTA Button */}
            <div className="mt-4">
              <Button
                size="lg"
                loading={analyzing}
                disabled={!description.trim() || !company.trim() || !roleTitle.trim()}
                iconLeft={!analyzing ? <Sparkles size={18} /> : undefined}
                iconRight={!analyzing ? <ArrowRight size={18} /> : undefined}
                onClick={handleAnalyze}
                style={{ width: '100%', padding: '12px' }}
              >
                {analyzing ? 'AI is performing deep analysis...' : 'Analyze Job Description'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Description Editor */}
        <div className="flex flex-col min-h-0">
          <Card variant="surface" padding="none" className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ height: '100%' }}>
            <div className="p-4 border-b border-default bg-surface-elevated flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
              <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider m-0" style={{ margin: 0 }}>Job Description</h3>
              {description.trim() && (
                <span className="badge badge-draft text-[10px] uppercase font-bold py-0.5 px-2">
                  {description.trim().split(/\s+/).length} words
                </span>
              )}
            </div>
            <div className="flex-1 p-4 flex flex-col min-h-0">
              <textarea
                className="flex-1 input-field p-4 text-sm resize-none overflow-y-auto bg-black/10 rounded-xl"
                style={{
                  minHeight: '280px',
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                  border: '1px solid var(--border-default)',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-surface)'
                }}
                placeholder="Paste the full job description here...&#10;&#10;Include responsibilities, required skills, daily tasks, and qualifications. This text will be analyzed to tailor your CV templates and generate targeted cover letters."
                value={description}
                onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
