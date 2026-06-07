import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { FileText, FileDown } from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { useEditorStore } from '@/stores/editor.store'

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

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const defaultName = `CV_${new Date().toISOString().split('T')[0]}.${exportFormat}`
      
      const filePath = await window.api.showSaveDialog(defaultName, [
        { name: exportFormat === 'pdf' ? 'PDF Documents' : 'Word Documents', extensions: [exportFormat] }
      ])
      
      if (!filePath) {
        setIsExporting(false)
        return // User cancelled
      }

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
                /* Template specific styles would be injected here */
              </style>
            </head>
            <body>
              <div class="cv-template-${templateId}">${content}</div>
            </body>
          </html>
        `
        await window.api.exportPDF(fullHtml, filePath)
      } else {
        // For DOCX, we send the content JSON/HTML to the backend which uses the docx package
        await window.api.exportDOCX(content, templateId, filePath)
      }
      
      addToast({ title: 'Export Successful', message: `Saved to ${filePath}`, type: 'success' })
      onClose()
    } catch (e: any) {
      addToast({ title: 'Export Failed', message: e.message || 'An error occurred during export', type: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal title="Export Document" onClose={onClose}>
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
          <Button onClick={handleExport} isLoading={isExporting}>
            Export CV
          </Button>
        </div>
      </div>
    </Modal>
  )
}
