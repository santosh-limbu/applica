import { create } from 'zustand'

interface EditorState {
  content: string
  templateId: string
  setContent: (content: string) => void
  setTemplateId: (templateId: string) => void
  isSaving: boolean
  setIsSaving: (isSaving: boolean) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  templateId: 'modern',
  setContent: (content) => set({ content }),
  setTemplateId: (templateId) => set({ templateId }),
  isSaving: false,
  setIsSaving: (isSaving) => set({ isSaving }),
}))
