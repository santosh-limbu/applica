import { create } from 'zustand'

interface EditorState {
  content: string
  templateId: string
  viewMode: 'split' | 'editor' | 'preview'
  setContent: (content: string) => void
  setTemplateId: (templateId: string) => void
  setViewMode: (viewMode: 'split' | 'editor' | 'preview') => void
  isSaving: boolean
  setIsSaving: (isSaving: boolean) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  templateId: 'modern',
  viewMode: 'split',
  setContent: (content) => set({ content }),
  setTemplateId: (templateId) => set({ templateId }),
  setViewMode: (viewMode) => set({ viewMode }),
  isSaving: false,
  setIsSaving: (isSaving) => set({ isSaving }),
}))
