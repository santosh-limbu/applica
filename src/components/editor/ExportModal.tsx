import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { FileText, FileDown } from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { useEditorStore } from '@/stores/editor.store'
import { useProfileStore } from '@/stores/profile.store'
import { useApplicationStore } from '@/stores/application.store'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  applicationId?: number
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, applicationId }) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx'>('pdf')
  const [isExporting, setIsExporting] = useState(false)
  const { addToast } = useAppStore()
  const { content, templateId } = useEditorStore()
  const { currentApplication } = useApplicationStore()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const outputDir = await window.api.getSettings('output_directory')
      let filePath: string | null = null
      let fileName = ''

      if (outputDir) {
        const company = currentApplication?.company || 'Applica'
        const role = currentApplication?.role_title || 'CV'
        const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_')
        fileName = `CV_${sanitize(company)}_${sanitize(role)}.${exportFormat}`
      } else {
        const defaultName = `CV_${new Date().toISOString().split('T')[0]}.${exportFormat}`
        filePath = await window.api.showSaveDialog(defaultName, [
          { name: exportFormat === 'pdf' ? 'PDF Documents' : 'Word Documents', extensions: [exportFormat] }
        ])
        
        if (!filePath) {
          setIsExporting(false)
          return // User cancelled
        }
      }

      let savedPath: string | null = null

      if (exportFormat === 'pdf') {
        // Build the HTML wrapper around the content
        const fullHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { margin: 0; padding: 2cm; font-family: 'Inter', sans-serif; }
                .prose { max-width: none; }
                .editor-columns, [data-type="columns"] { display: flex; gap: 1.5rem; width: 100%; margin-top: 1rem; margin-bottom: 1rem; }
                .editor-column, [data-type="column"] { flex: 1; min-width: 0; }
                /* Template specific styles would be injected here */
              </style>
            </head>
            <body>
              <div class="cv-template-${templateId}">${content}</div>
            </body>
          </html>
        `
        if (outputDir) {
          savedPath = await window.api.exportPDF(fullHtml, fileName, outputDir)
        } else {
          savedPath = await window.api.exportPDF(fullHtml, filePath!)
        }
      } else {
        // For DOCX, we send structured CV data to the backend
        const profileState = useProfileStore.getState()
        const cvData = {
          profile: profileState.profile || { full_name: 'Candidate Name' },
          experiences: profileState.experiences || [],
          education: profileState.education || [],
          skills: profileState.skills || [],
          certifications: profileState.certifications || [],
          professional_summary: profileState.profile?.professional_summary || ''
        }

        if (outputDir) {
          savedPath = await window.api.exportDOCX(cvData, templateId, fileName, outputDir)
        } else {
          savedPath = await window.api.exportDOCX(cvData, templateId, filePath!)
        }
      }
      
      if (savedPath) {
        if (outputDir) {
          addToast({
            title: 'Export Successful',
            message: (
              <span>
                Saved directly to the output folder.{' '}
                <button
                  onClick={() => window.api.openPath(outputDir)}
                  className="text-accent hover:underline font-semibold animate-pulse"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline' }}
                >
                  Open Folder
                </button>
              </span>
            ),
            type: 'success'
          })
        } else {
          addToast({ title: 'Export Successful', message: `Saved to ${savedPath}`, type: 'success' })
        }
      }
      onClose()
    } catch (e: any) {
      addToast({ title: 'Export Failed', message: e.message || 'An error occurred during export', type: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal open={isOpen} title="Export Document" onClose={onClose}>
      <div className="flex flex-col gap-6 p-6">
        <p className="text-muted text-sm">Select a format to export your CV.</p>
        
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className={`p-4 cursor-pointer flex flex-col items-center justify-center gap-3 transition-colors ${
              exportFormat === 'pdf' ? 'border-accent bg-accent/10 text-white' : 'hover:border-subtle text-muted'
            }`}
            onClick={() => setExportFormat('pdf')}
          >
            <FileText className={`w-8 h-8 ${exportFormat === 'pdf' ? 'text-accent' : ''}`} />
            <div className="text-center">
              <div className="font-semibold">PDF Document</div>
              <div className="text-xs opacity-80 mt-1">Best for sharing & printing</div>
            </div>
          </Card>

          <Card 
            className={`p-4 cursor-pointer flex flex-col items-center justify-center gap-3 transition-colors ${
              exportFormat === 'docx' ? 'border-accent bg-accent/10 text-white' : 'hover:border-subtle text-muted'
            }`}
            onClick={() => setExportFormat('docx')}
          >
            <FileDown className={`w-8 h-8 ${exportFormat === 'docx' ? 'text-accent' : ''}`} />
            <div className="text-center">
              <div className="font-semibold">Word Document (.docx)</div>
              <div className="text-xs opacity-80 mt-1">Best for manual edits</div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-4 border-t border-subtle pt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport} loading={isExporting}>
            Export CV
          </Button>
        </div>
      </div>
    </Modal>
  )
}
