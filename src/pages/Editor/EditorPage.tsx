import React, { useState, useEffect } from 'react'
import { CVEditor } from '@/components/editor/CVEditor'
import { TemplatePreview } from '@/components/editor/TemplatePreview'
import { ExportModal } from '@/components/editor/ExportModal'
import Button from '@/components/ui/Button'
import { useEditorStore } from '@/stores/editor.store'
import { useAppStore } from '@/stores/app.store'
import { useApplicationStore } from '@/stores/application.store'
import { Save, Download, ArrowLeft, Briefcase, X, RefreshCw } from 'lucide-react'

export const EditorPage: React.FC = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [showReference, setShowReference] = useState(true)
  const [refTab, setRefTab] = useState<'analysis' | 'description'>('analysis')
  const [isRegenerating, setIsRegenerating] = useState(false)

  const { content, setContent, templateId, setTemplateId, viewMode, setViewMode, isSaving, setIsSaving } = useEditorStore()
  const { addToast, navigate } = useAppStore()
  const { currentApplication, jobAnalysis } = useApplicationStore()

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
  }, [currentApplication, setContent, setTemplateId])

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
    setIsRegenerating(true)
    try {
      const regenerated = await window.api.generateCV(currentApplication.id, templateId)
      if (regenerated.content_html) {
        setContent(regenerated.content_html)
        addToast({ title: 'CV Regenerated', message: 'CV has been regenerated using the latest profile info.', type: 'success' })
      } else {
        throw new Error('Regenerated content was empty')
      }
    } catch (e) {
      console.error('Failed to regenerate CV:', e)
      addToast({ title: 'Regeneration Failed', message: (e as Error).message || 'Failed to regenerate CV', type: 'error' })
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleExport = () => {
    setIsExportModalOpen(true)
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

          {/* View Toggles */}
          <div className="flex gap-0.5 p-1 rounded-lg border border-default" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all`}
              style={{
                background: viewMode === 'editor' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'editor' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Write Focus
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all`}
              style={{
                background: viewMode === 'split' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'split' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all`}
              style={{
                background: viewMode === 'preview' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'preview' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Preview Focus
            </button>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-default)', margin: '0 4px' }} />

          {viewMode !== 'preview' && viewMode !== 'editor' && (
            <Button variant="outline" onClick={() => setShowReference(!showReference)}>
              <Briefcase className="w-4 h-4 mr-2 inline" /> {showReference ? 'Hide Job Info' : 'Show Job Info'}
            </Button>
          )}
          <Button variant="outline" onClick={handleSave} loading={isSaving} disabled={isRegenerating}>
            <Save className="w-4 h-4 mr-2 inline" /> Save Draft
          </Button>
          <Button variant="outline" onClick={handleRegenerate} loading={isRegenerating} disabled={isSaving}>
            <RefreshCw className="w-4 h-4 mr-2 inline" /> Regenerate
          </Button>
          <Button onClick={handleExport} disabled={isSaving || isRegenerating}>
            <Download className="w-4 h-4 mr-2 inline" /> Export Document
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Reference Panel (Collapsible) */}
        {viewMode !== 'preview' && viewMode !== 'editor' && showReference && (
          <div className="flex flex-col w-80 min-h-0 bg-surface border border-default rounded-xl overflow-hidden" style={{ flexShrink: 0 }}>
            <div className="flex justify-between items-center p-4 border-b border-default bg-surface-elevated">
              <h3 className="font-semibold text-white flex items-center gap-2" style={{ margin: 0 }}>
                <Briefcase className="w-4 h-4 text-accent" /> Reference Info
              </h3>
              <button onClick={() => setShowReference(false)} className="text-muted hover:text-white transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
              <div className="flex gap-1 bg-surface-elevated p-1 rounded-lg" style={{ border: '1px solid var(--border-default)' }}>
                <button 
                  onClick={() => setRefTab('analysis')} 
                  className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all`}
                  style={{
                    background: refTab === 'analysis' ? 'var(--accent-primary)' : 'transparent',
                    color: refTab === 'analysis' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Analysis
                </button>
                <button 
                  onClick={() => setRefTab('description')} 
                  className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all`}
                  style={{
                    background: refTab === 'description' ? 'var(--accent-primary)' : 'transparent',
                    color: refTab === 'description' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Job Description
                </button>
              </div>

              {refTab === 'analysis' ? (
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
              ) : (
                <div className="text-xs text-secondary whitespace-pre-wrap leading-relaxed" style={{ fontSize: '11px' }}>
                  {currentApplication?.job_description || 'No job description provided.'}
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
              <CVEditor />
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
    </div>
  )
}
