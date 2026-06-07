import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { useAppStore } from '@/stores/app.store'
import { useApplicationStore } from '@/stores/application.store'
import { FileDown, RefreshCw, Wand2, ArrowLeft } from 'lucide-react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export const CoverLetterPage: React.FC = () => {
  const { currentApplication, applications, setCurrentApplication } = useApplicationStore()
  const { addToast, navigate } = useAppStore()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [content, setContent] = useState<string>('')
  
  // Note: we'd ideally load this from DB, but for now we generate dynamically
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-6 text-black bg-white rounded-lg border border-subtle shadow-sm',
      },
    },
  })

  // We should fetch the cover letter if it exists, otherwise generate
  useEffect(() => {
    if (!currentApplication && applications.length > 0) {
      // Just grab the first one for demo purposes if coming directly
      setCurrentApplication(applications[0])
    }
  }, [currentApplication, applications])

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  const handleGenerate = async () => {
    if (!currentApplication?.id) {
      addToast({ title: 'Error', message: 'No application selected', type: 'error' })
      return
    }
    
    setIsGenerating(true)
    try {
      // In a real flow, we'd fetch the job analysis and profile first
      // Since ai.service handles this via IPC, we can just call the IPC method
      const generatedText = await window.api.generateCoverLetter(currentApplication.id)
      
      // Convert plain text to basic HTML paragraphs
      const htmlContent = generatedText
        .split('\n\n')
        .map(p => `<p>${p}</p>`)
        .join('')
        
      setContent(htmlContent)
      addToast({ title: 'Generated', message: 'Cover letter generated successfully', type: 'success' })
    } catch (e: any) {
      addToast({ title: 'Generation Failed', message: e.message || 'Failed to generate cover letter', type: 'error' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExport = async () => {
    try {
      const defaultName = `CoverLetter_${currentApplication?.company || 'Applica'}.pdf`
      
      const filePath = await window.api.showSaveDialog(defaultName, [
        { name: 'PDF Documents', extensions: ['pdf'] }
      ])
      
      if (!filePath) return
      
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { margin: 0; padding: 2cm; font-family: 'Inter', sans-serif; font-size: 11pt; line-height: 1.5; }
              p { margin-bottom: 1em; }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `
      await window.api.exportPDF(fullHtml, filePath)
      addToast({ title: 'Export Successful', message: `Saved to ${filePath}`, type: 'success' })
    } catch (e: any) {
      addToast({ title: 'Export Failed', message: e.message || 'An error occurred during export', type: 'error' })
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
            <h1 className="text-3xl font-bold text-white tracking-tight">Cover Letter</h1>
            <p className="text-muted mt-1">
              For {currentApplication?.role_title || 'Unknown Role'} at {currentApplication?.company || 'Unknown Company'}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleGenerate} isLoading={isGenerating}>
            <Wand2 className="w-4 h-4 mr-2 inline" /> 
            {content ? 'Regenerate' : 'Generate with AI'}
          </Button>
          <Button onClick={handleExport} disabled={!content}>
            <FileDown className="w-4 h-4 mr-2 inline" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 flex justify-center">
        <div className="w-full max-w-3xl">
          {!content && !isGenerating ? (
            <Card className="p-12 flex flex-col items-center justify-center text-center gap-4 h-full">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center text-accent mb-2">
                <FileDown className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-white">No Cover Letter Yet</h2>
              <p className="text-muted max-w-md">
                Generate a tailored cover letter matching your profile and the target job description.
              </p>
              <Button onClick={handleGenerate} className="mt-4">
                <Wand2 className="w-4 h-4 mr-2" /> Generate Now
              </Button>
            </Card>
          ) : isGenerating ? (
            <Card className="p-12 flex flex-col items-center justify-center text-center gap-4 h-full animate-pulse">
              <RefreshCw className="w-8 h-8 text-accent animate-spin" />
              <p className="text-white font-medium">Crafting the perfect cover letter...</p>
              <p className="text-sm text-muted">Analyzing job requirements and matching your experience.</p>
            </Card>
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>
      </div>
    </div>
  )
}
