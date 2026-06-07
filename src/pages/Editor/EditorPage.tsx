import React, { useState } from 'react'
import { CVEditor } from '@/components/editor/CVEditor'
import { TemplatePreview } from '@/components/editor/TemplatePreview'
import { ExportModal } from '@/components/editor/ExportModal'
import Button from '@/components/ui/Button'
import { useEditorStore } from '@/stores/editor.store'
import { useAppStore } from '@/stores/app.store'
import { Save, Download } from 'lucide-react'

export const EditorPage: React.FC = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const { isSaving, setIsSaving } = useEditorStore()
  const { addToast } = useAppStore()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 800))
      addToast({ title: 'Saved', message: 'CV has been saved successfully', type: 'success' })
    } catch (e) {
      addToast({ title: 'Error', message: 'Failed to save CV', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = () => {
    setIsExportModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CV Editor</h1>
          <p className="text-muted mt-1">Refine your CV and preview the final result</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleSave} isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2 inline" /> Save Draft
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2 inline" /> Export Document
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-semibold text-secondary mb-2 uppercase tracking-wider">Editor</h2>
          <div className="flex-1 min-h-0">
            <CVEditor />
          </div>
        </div>
        
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-semibold text-secondary mb-2 uppercase tracking-wider">Live Preview</h2>
          <div className="flex-1 min-h-0">
            <TemplatePreview />
          </div>
        </div>
      </div>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />
    </div>
  )
}
