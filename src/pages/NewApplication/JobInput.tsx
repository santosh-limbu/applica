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
    <>
      <div className="page-header flex items-center gap-3">
        <Button variant="ghost" size="sm" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('dashboard')}>
          Back
        </Button>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>New Application</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Enter a job description to get started</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="tabs mb-6">
        <button
          className={`tab flex items-center gap-2 ${activeTab === 'paste' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('paste')}
        >
          <ClipboardPaste size={14} />
          Paste Description
        </button>
        <button
          className={`tab flex items-center gap-2 ${activeTab === 'url' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('url')}
        >
          <Link2 size={14} />
          Enter URL
        </button>
      </div>

      {/* Content */}
      <Card variant="surface" padding="lg" className="mb-6">
        {activeTab === 'paste' ? (
          <Input
            multiline
            placeholder="Paste the full job description here…&#10;&#10;Include the role title, requirements, responsibilities, qualifications, and any other relevant details."
            value={description}
            onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
            style={{ minHeight: 240 }}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="https://careers.example.com/job/software-engineer"
                  value={url}
                  onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
                  iconLeft={<Globe size={16} />}
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleFetchUrl}
                loading={fetching}
                disabled={!url.trim()}
              >
                Fetch
              </Button>
            </div>

            {description && (
              <div>
                <label className="input-label mb-2" style={{ display: 'block' }}>
                  Fetched Description
                </label>
                <Input
                  multiline
                  value={description}
                  onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                  style={{ minHeight: 180 }}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Company & Role */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Input
          label="Company Name"
          placeholder="Acme Corp"
          value={company}
          onChange={(e) => setCompany((e.target as HTMLInputElement).value)}
          iconLeft={<Building2 size={16} />}
        />
        <Input
          label="Role Title"
          placeholder="Senior Software Engineer"
          value={roleTitle}
          onChange={(e) => setRoleTitle((e.target as HTMLInputElement).value)}
          iconLeft={<Briefcase size={16} />}
        />
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <Button
          size="lg"
          loading={analyzing}
          disabled={!description.trim() || !company.trim() || !roleTitle.trim()}
          iconLeft={<Sparkles size={18} />}
          iconRight={<ArrowRight size={18} />}
          onClick={handleAnalyze}
        >
          Analyze Job
        </Button>
      </div>

      {analyzing && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <div className="btn-spinner" />
          <span className="text-sm text-secondary">AI is analyzing the job description…</span>
        </div>
      )}
    </>
  )
}
