import { create } from 'zustand'
import type { Application, JobAnalysis, ATSScore } from '@/types/ipc.types'

interface ApplicationState {
  applications: Application[]
  currentApplication: Application | null
  jobAnalysis: JobAnalysis | null
  atsScore: ATSScore | null
  isLoading: boolean

  loadApplications: () => Promise<void>
  loadApplication: (id: number) => Promise<void>
  saveApplication: (app: Application) => Promise<Application>
  updateApplicationStatus: (id: number, status: string) => Promise<void>
  deleteApplication: (id: number) => Promise<void>

  analyzeJob: (description: string) => Promise<JobAnalysis>
  scoreATS: (cvContent: string, jobDescription: string) => Promise<ATSScore>

  setCurrentApplication: (app: Application | null) => void
  setJobAnalysis: (analysis: JobAnalysis | null) => void
  setAtsScore: (score: ATSScore | null) => void
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  currentApplication: null,
  jobAnalysis: null,
  atsScore: null,
  isLoading: false,

  loadApplications: async () => {
    set({ isLoading: true })
    try {
      const applications = await window.api.getApplications()
      set({ applications })
    } finally {
      set({ isLoading: false })
    }
  },

  loadApplication: async (id: number) => {
    set({ isLoading: true })
    try {
      const app = await window.api.getApplication(id)
      set({ currentApplication: app })
    } finally {
      set({ isLoading: false })
    }
  },

  saveApplication: async (app: Application) => {
    const saved = await window.api.saveApplication(app)
    await get().loadApplications()
    set({ currentApplication: saved })
    return saved
  },

  updateApplicationStatus: async (id: number, status: string) => {
    await window.api.updateApplicationStatus(id, status)
    await get().loadApplications()
    const current = get().currentApplication
    if (current?.id === id) {
      set({
        currentApplication: {
          ...current,
          status: status as Application['status'],
        },
      })
    }
  },

  deleteApplication: async (id: number) => {
    await window.api.deleteApplication(id)
    await get().loadApplications()
    if (get().currentApplication?.id === id) {
      set({ currentApplication: null })
    }
  },

  analyzeJob: async (description: string) => {
    set({ isLoading: true })
    try {
      const analysis = await window.api.analyzeJob(description)
      set({ jobAnalysis: analysis })
      return analysis
    } finally {
      set({ isLoading: false })
    }
  },

  scoreATS: async (cvContent: string, jobDescription: string) => {
    set({ isLoading: true })
    try {
      const score = await window.api.scoreATS(cvContent, jobDescription)
      set({ atsScore: score })
      return score
    } finally {
      set({ isLoading: false })
    }
  },

  setCurrentApplication: (app) => set({ currentApplication: app }),
  setJobAnalysis: (analysis) => set({ jobAnalysis: analysis }),
  setAtsScore: (score) => set({ atsScore: score }),
}))
