import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useAppStore } from '@/stores/app.store'
import { useApplicationStore } from '@/stores/application.store'
import { FileDown, RefreshCw, Wand2, ArrowLeft, Copy, Save } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export const CoverLetterPage: React.FC = () => {
  const { currentApplication, applications, setCurrentApplication } = useApplicationStore()
  const { addToast, navigate } = useAppStore()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [content, setContent] = useState<string>('')
  
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

  // Load cover letter on mount / application change
  useEffect(() => {
    async function loadCoverLetter() {
      if (currentApplication?.id) {
        try {
          const cls = await window.api.getCoverLetters(currentApplication.id)
          if (cls && cls.length > 0) {
            setContent(cls[0].content)
          } else {
            setContent('')
          }
        } catch (err) {
          console.error('Failed to load cover letter:', err)
        }
      }
    }
    loadCoverLetter()
  }, [currentApplication])

  // fallback logic
  useEffect(() => {
    if (!currentApplication && applications.length > 0) {
      setCurrentApplication(applications[0])
    }
  }, [currentApplication, applications, setCurrentApplication])

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
      const generatedText = await window.api.generateCoverLetter(currentApplication.id)
      
      const htmlContent = generatedText
        .split('\n\n')
        .map(p => `<p>${p}</p>`)
        .join('')
        
      setContent(htmlContent)

      // Auto-save generated cover letter
      await window.api.saveCoverLetter({
        application_id: currentApplication.id,
        profile_id: currentApplication.profile_id,
        content: htmlContent
      })

      addToast({ title: 'Generated', message: 'Cover letter generated and saved successfully', type: 'success' })
    } catch (e: any) {
      addToast({ title: 'Generation Failed', message: e.message || 'Failed to generate cover letter', type: 'error' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!currentApplication?.id) return
    setIsSaving(true)
    try {
      await window.api.saveCoverLetter({
        application_id: currentApplication.id,
        profile_id: currentApplication.profile_id,
        content: content
      })
      addToast({ title: 'Saved', message: 'Cover letter saved successfully', type: 'success' })
    } catch (e: any) {
      addToast({ title: 'Error', message: 'Failed to save cover letter', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = async () => {
    try {
      const parser = new DOMParser()
      const parsed = parser.parseFromString(content, 'text/html')
      const paragraphs = Array.from(parsed.querySelectorAll('p')).map(p => p.textContent || '')
      const plainText = paragraphs.length > 0 ? paragraphs.join('\n\n') : (parsed.body.textContent || '')
      
      await navigator.clipboard.writeText(plainText)
      addToast({ title: 'Copied', message: 'Cover letter copied to clipboard', type: 'success' })
    } catch (err: any) {
      addToast({ title: 'Copy Failed', message: err.message || 'Failed to copy text', type: 'error' })
    }
  }

  const handleExport = async () => {
    try {
      const outputDir = await window.api.getSettings('output_directory')
      let filePath: string | null = null
      let fileName = ''

      if (outputDir) {
        const company = currentApplication?.company || 'Applica'
        const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_')
        fileName = `CoverLetter_${sanitize(company)}.pdf`
      } else {
        const defaultName = `CoverLetter_${currentApplication?.company || 'Applica'}.pdf`
        filePath = await window.api.showSaveDialog(defaultName, [
          { name: 'PDF Documents', extensions: ['pdf'] }
        ])
        if (!filePath) return
      }
      
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

      let savedPath: string | null = null
      if (outputDir) {
        savedPath = await window.api.exportPDF(fullHtml, fileName, outputDir)
      } else {
        savedPath = await window.api.exportPDF(fullHtml, filePath!)
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
          <Button variant="outline" onClick={handleGenerate} loading={isGenerating}>
            <Wand2 className="w-4 h-4 mr-2 inline" /> 
            {content ? 'Regenerate' : 'Generate with AI'}
          </Button>
          {content && (
            <>
              <Button variant="outline" onClick={handleSave} loading={isSaving}>
                <Save className="w-4 h-4 mr-2 inline" /> Save Letter
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2 inline" /> Copy to Clipboard
              </Button>
            </>
          )}
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
