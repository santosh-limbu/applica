import React, { useState, useEffect } from 'react'
import { CVEditor } from '@/components/editor/CVEditor'
import { TemplatePreview } from '@/components/editor/TemplatePreview'
import { ExportModal } from '@/components/editor/ExportModal'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useEditorStore } from '@/stores/editor.store'
import { useAppStore } from '@/stores/app.store'
import { useApplicationStore } from '@/stores/application.store'
import { 
  Save, Download, ArrowLeft, Briefcase, X, RefreshCw, Eye, EyeOff,
  Zap, Award, Target, BookOpen, Lightbulb, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'

export const EditorPage: React.FC = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [showReference, setShowReference] = useState(true)
  const [refTab, setRefTab] = useState<'analysis' | 'description' | 'ats'>('analysis')
  const [isRunningAts, setIsRunningAts] = useState(false)

  const { content, setContent, templateId, setTemplateId, viewMode, setViewMode, isSaving, setIsSaving } = useEditorStore()
  const { addToast, navigate } = useAppStore()
  const { currentApplication, jobAnalysis, atsScore, scoreATS, loadApplication, setGenerating, generatingApplications } = useApplicationStore()

  const isRegenerating = currentApplication?.id
    ? generatingApplications[currentApplication.id] === 'cv'
    : false

  // Load existing CV on mount/load
  useEffect(() => {
    const loadCv = async () => {
      if (currentApplication?.id) {
        try {
          const cvs = await window.api.getCvs(currentApplication.id)
          if (cvs && cvs.length > 0) {
            const latestCv = cvs[0]
            if (latestCv.content) {
              try {
                const parsed = JSON.parse(latestCv.content)
                if (parsed.content_html) {
                  setContent(parsed.content_html)
                } else if (typeof parsed === 'string') {
                  setContent(parsed)
                }
              } catch {
                setContent(latestCv.content)
              }
            }
            if (latestCv.template_id) {
              setTemplateId(latestCv.template_id)
            }
          }
        } catch (err) {
          console.error('Failed to load CV:', err)
        }
      }
    }
    loadCv()
  }, [currentApplication?.id, setContent, setTemplateId])

  const handleSave = async () => {
    if (!currentApplication?.id) return
    setIsSaving(true)
    try {
      const cvContent = {
        content_html: content
      }
      await window.api.saveCv({
        application_id: currentApplication.id,
        profile_id: currentApplication.profile_id,
        title: `${currentApplication.role_title} at ${currentApplication.company}`,
        template_id: templateId,
        content: JSON.stringify(cvContent)
      })
      addToast({ title: 'Saved', message: 'CV has been saved successfully', type: 'success' })
    } catch (e) {
      addToast({ title: 'Error', message: 'Failed to save CV', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerate = async () => {
    if (!currentApplication?.id) return
    const appId = currentApplication.id
    setGenerating(appId, 'cv')
    try {
      const regenerated = await window.api.generateCV(appId, templateId)
      if (regenerated.content_html) {
        setContent(regenerated.content_html)
        await loadApplication(appId)
        addToast({ title: 'CV Regenerated', message: 'CV has been regenerated using the latest profile info.', type: 'success' })
      } else {
        throw new Error('Regenerated content was empty')
      }
    } catch (e) {
      console.error('Failed to regenerate CV:', e)
      addToast({ title: 'Regeneration Failed', message: (e as Error).message || 'Failed to regenerate CV', type: 'error' })
    } finally {
      setGenerating(appId, null)
    }
  }

  const handleExport = () => {
    setIsExportModalOpen(true)
  }

  const handleRunAtsCheck = async () => {
    if (!currentApplication?.job_description) return
    setIsRunningAts(true)
    try {
      await scoreATS(content, currentApplication.job_description)
      addToast({ title: 'ATS Check Complete', message: 'CV has been successfully scored.', type: 'success' })
    } catch (e) {
      console.error(e)
      addToast({ title: 'ATS Check Failed', message: (e as Error).message || 'Failed to score CV', type: 'error' })
    } finally {
      setIsRunningAts(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('dashboard')} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">CV Editor</h1>
            <p className="text-muted mt-1">Refine your CV and preview the final result</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Template Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary font-medium">Template:</span>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="input-field py-1 px-2 text-xs font-semibold rounded-lg bg-surface border-default text-white"
              style={{ width: '110px', height: '32px', cursor: 'pointer', border: '1px solid var(--border-default)' }}
            >
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>

          {/* Toggle Live Preview */}
          <Button 
            variant="outline" 
            onClick={() => setViewMode(viewMode === 'editor' ? 'split' : 'editor')}
            disabled={isSaving || isRegenerating}
          >
            {viewMode === 'editor' ? (
              <>
                <Eye className="w-4 h-4 mr-2 inline" /> Show Live Preview
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2 inline" /> Hide Live Preview
              </>
            )}
          </Button>

          <Button variant="outline" onClick={handleSave} loading={isSaving} disabled={isRegenerating}>
            <Save className="w-4 h-4 mr-2 inline" /> Save Draft
          </Button>
          <Button onClick={handleExport} disabled={isSaving || isRegenerating}>
            <Download className="w-4 h-4 mr-2 inline" /> Export Document
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Reference Panel (Collapsible Toggle Strip when hidden) */}
        {viewMode !== 'preview' && !showReference && (
          <button 
            onClick={() => setShowReference(true)}
            className="flex flex-col items-center justify-center bg-surface border border-default rounded-xl hover:bg-hover text-secondary hover:text-accent transition-all duration-200 cursor-pointer gap-2"
            style={{ width: '48px', alignSelf: 'stretch', padding: '16px 0', borderStyle: 'solid', outline: 'none' }}
            title="Show Job Info"
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', margin: '8px 0 0 0' }}>Job Info</span>
          </button>
        )}

        {viewMode !== 'preview' && showReference && (
          <div className="card card-surface flex flex-col min-h-0 overflow-hidden" style={{ width: '360px', flexShrink: 0 }}>
            <div className="flex justify-between items-center p-4 border-b border-default bg-surface-elevated">
              <h3 className="font-semibold text-white flex items-center gap-2" style={{ margin: 0 }}>
                <Briefcase className="w-4 h-4 text-accent" /> Reference Info
              </h3>
              <button onClick={() => setShowReference(false)} className="text-muted hover:text-white transition-colors cursor-pointer" style={{ background: 'none', border: 'none', padding: 0 }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 scrollbar-thin">
              {/* Job Title & Company */}
              <div>
                <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-1" style={{ fontSize: '10px' }}>Target Role</h4>
                <div className="text-md font-bold text-white leading-tight">{currentApplication?.role_title || 'Unknown Role'}</div>
                <div className="text-sm text-secondary mt-0.5">{currentApplication?.company || 'Unknown Company'}</div>
              </div>

              {/* Tab selector */}
              <div className="flex gap-1 bg-surface-elevated p-1 rounded-lg border border-default">
                <button 
                  onClick={() => setRefTab('analysis')} 
                  className="flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer text-center"
                  style={{
                    background: refTab === 'analysis' ? 'var(--bg-hover)' : 'transparent',
                    color: refTab === 'analysis' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: 'none',
                    outline: 'none'
                  }}
                >
                  Analysis
                </button>
                <button 
                  onClick={() => setRefTab('description')} 
                  className="flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer text-center"
                  style={{
                    background: refTab === 'description' ? 'var(--bg-hover)' : 'transparent',
                    color: refTab === 'description' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: 'none',
                    outline: 'none'
                  }}
                >
                  JD
                </button>
                <button 
                  onClick={() => setRefTab('ats')} 
                  className="flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer text-center"
                  style={{
                    background: refTab === 'ats' ? 'var(--bg-hover)' : 'transparent',
                    color: refTab === 'ats' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: 'none',
                    outline: 'none'
                  }}
                >
                  ATS Check
                </button>
              </div>
 
              {refTab === 'analysis' && (
                <div className="flex flex-col gap-5">
                  {/* Required Skills */}
                  {jobAnalysis?.required_skills && jobAnalysis.required_skills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2" style={{ fontSize: '10px' }}>Required Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {jobAnalysis.required_skills.map((s, idx) => (
                          <span key={idx} className="tag tag-accent text-xs px-2 py-0.5" style={{ fontSize: '11px', whiteSpace: 'normal', height: 'auto' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
 
                  {/* Key Responsibilities */}
                  {jobAnalysis?.key_responsibilities && jobAnalysis.key_responsibilities.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2" style={{ fontSize: '10px' }}>Key Responsibilities</h4>
                      <ul className="flex flex-col gap-2" style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
                        {jobAnalysis.key_responsibilities.map((r, idx) => (
                          <li key={idx} className="text-xs text-secondary flex items-start gap-1.5 leading-relaxed">
                            <span className="text-accent mt-0.5">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
 
                  {/* Qualifications */}
                  {jobAnalysis?.qualifications && jobAnalysis.qualifications.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2" style={{ fontSize: '10px' }}>Qualifications</h4>
                      <ul className="flex flex-col gap-2" style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
                        {jobAnalysis.qualifications.map((q, idx) => (
                          <li key={idx} className="text-xs text-secondary flex items-start gap-1.5 leading-relaxed">
                            <span className="text-accent mt-0.5">•</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {refTab === 'description' && (
                <div className="flex flex-col gap-2 min-w-0">
                  <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-1" style={{ fontSize: '10px' }}>Full Description</h4>
                  <div 
                    className="text-xs text-secondary whitespace-pre-wrap break-words leading-relaxed bg-black/30 p-3 rounded-lg border border-default min-w-0 overflow-y-auto max-h-[350px]"
                    style={{ fontSize: '11px', wordBreak: 'break-word' }}
                  >
                    {currentApplication?.job_description || 'No job description provided.'}
                  </div>
                </div>
              )}

              {refTab === 'ats' && (
                <div className="flex flex-col gap-5">
                  {!atsScore ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center gap-4 bg-black/20 rounded-xl border border-default">
                      <AlertCircle className="w-8 h-8 text-tertiary" />
                      <div>
                        <h4 className="font-semibold text-white text-xs">No ATS Check Result</h4>
                        <p className="text-[11px] text-tertiary mt-1">Run a scan to evaluate how well this CV fits the Job Description.</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleRunAtsCheck} 
                        loading={isRunningAts}
                        disabled={isSaving || isRegenerating}
                        style={{ width: '100%' }}
                      >
                        Run ATS Check
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      <div className="flex justify-center py-2 bg-black/10 rounded-xl border border-default p-3">
                        <CircularScore score={atsScore.overall_score} />
                      </div>

                      {/* Sub-scores */}
                      <div className="grid gap-2 grid-cols-2">
                        <ScoreCard icon={Zap} label="Keywords" score={atsScore.keyword_match_score} />
                        <ScoreCard icon={Award} label="Experience" score={atsScore.content_score} />
                        <ScoreCard icon={Target} label="Skills" score={atsScore.keyword_match_score} />
                        <ScoreCard icon={BookOpen} label="Education" score={atsScore.format_score} />
                      </div>

                      {/* Matched / Missing Keywords */}
                      <div className="flex flex-col gap-3">
                        <div>
                          <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2" style={{ fontSize: '10px' }}>Matched Keywords ({atsScore.matched_keywords.length})</h4>
                          {atsScore.matched_keywords.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto scrollbar-thin">
                              {atsScore.matched_keywords.map((kw, idx) => (
                                <span key={idx} className="tag tag-success text-[10px] px-2 py-0.5 flex items-center gap-1">
                                  <CheckCircle size={10} /> {kw}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-tertiary italic">No matched keywords found.</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2" style={{ fontSize: '10px' }}>Missing Keywords ({atsScore.missing_keywords.length})</h4>
                          {atsScore.missing_keywords.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto scrollbar-thin">
                              {atsScore.missing_keywords.map((kw, idx) => (
                                <span key={idx} className="tag tag-danger text-[10px] px-2 py-0.5 flex items-center gap-1">
                                  <XCircle size={10} /> {kw}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-success italic">No missing keywords! Excellent.</p>
                          )}
                        </div>
                      </div>

                      {/* Suggestions */}
                      {atsScore.suggestions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2" style={{ fontSize: '10px' }}>Suggestions</h4>
                          <ul className="flex flex-col gap-2 max-h-[200px] overflow-y-auto scrollbar-thin" style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
                            {atsScore.suggestions.map((s, idx) => (
                              <li key={idx} className="text-xs text-secondary flex items-start gap-1.5 leading-relaxed font-normal">
                                <Lightbulb size={12} className="text-warning mt-0.5 flex-shrink-0" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Re-run button */}
                      <div className="pt-3 border-t border-default">
                        <Button 
                          size="sm" 
                          onClick={handleRunAtsCheck} 
                          loading={isRunningAts}
                          disabled={isSaving || isRegenerating}
                          style={{ width: '100%' }}
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-2 inline" /> Re-run ATS Check
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor Column */}
        {viewMode !== 'preview' && (
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-sm font-semibold text-secondary mb-2 uppercase tracking-wider">Editor</h2>
            <div className="flex-1 min-h-0">
              <CVEditor 
                onRegenerate={handleRegenerate}
                isRegenerating={isRegenerating}
                isSaving={isSaving}
              />
            </div>
          </div>
        )}

        {/* Live Preview Column */}
        {viewMode !== 'editor' && (
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-sm font-semibold text-secondary mb-2 uppercase tracking-wider">Live Preview</h2>
            <div className="flex-1 min-h-0">
              <TemplatePreview />
            </div>
          </div>
        )}
      </div>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />
      {isRegenerating && <RegenerationProgressOverlay />}
    </div>
  )
}

const RegenerationProgressOverlay: React.FC = () => {
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('Initializing...')

  useEffect(() => {
    let start = Date.now()
    const duration = 6000 // estimate 6 seconds for average generation
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const percentage = Math.min((elapsed / duration) * 95, 95)
      setProgress(Math.round(percentage))

      if (percentage < 20) {
        setStatusText('Reading candidate profile...')
      } else if (percentage < 45) {
        setStatusText('Analyzing job description...')
      } else if (percentage < 70) {
        setStatusText('Structuring achievements using STAR method...')
      } else if (percentage < 85) {
        setStatusText('Optimizing keyword density for ATS parsing...')
      } else {
        setStatusText('Generating HTML template output...')
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300">
      <div className="w-full max-w-md p-6 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl backdrop-blur-lg flex flex-col items-center">
        {/* Glow light effect */}
        <div className="w-16 h-16 rounded-full bg-primary/25 flex items-center justify-center mb-4 animate-pulse relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl"></div>
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>

        <h3 className="text-lg font-semibold text-white mb-1">Regenerating CV</h3>
        <p className="text-sm text-neutral-400 mb-6 text-center h-5">{statusText}</p>

        {/* Progress Bar Container */}
        <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden mb-2 relative">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-150 ease-out shadow-[0_0_8px_#3b82f6]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="text-xs text-neutral-400 font-mono">{progress}%</span>
      </div>
    </div>
  )
}

function CircularScore({ score }: { score: number }) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  let color = 'var(--danger)'
  if (score >= 70) color = 'var(--success)'
  else if (score >= 40) color = 'var(--warning)'

  return (
    <div className="circular-progress" style={{ width: 110, height: 110 }}>
      <svg width={110} height={110}>
        <circle
          cx={55}
          cy={55}
          r={radius}
          fill="none"
          stroke="var(--bg-surface)"
          strokeWidth={6}
        />
        <circle
          cx={55}
          cy={55}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <span className="circular-progress-value" style={{ fontSize: '20px' }}>{score}%</span>
      <span className="circular-progress-label" style={{ marginTop: 28, fontSize: '10px' }}>
        ATS Score
      </span>
    </div>
  )
}

function ScoreCard({
  icon: Icon,
  label,
  score,
}: {
  icon: any
  label: string
  score: number
}) {
  return (
    <div className="card card-elevated p-2 rounded-lg border border-default">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} style={{ color: 'var(--accent-primary)' }} />
        <span className="text-[10px] font-semibold text-secondary truncate">{label}</span>
        <span className="ml-auto text-[10px] font-bold text-white">{score}%</span>
      </div>
      <div className="progress-bar" style={{ height: '4px', background: 'var(--border-default)' }}>
        <div className="progress-fill" style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}
