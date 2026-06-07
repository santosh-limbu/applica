import { create } from 'zustand'
import type { Profile, Experience, Education, Skill, Certification } from '@/types/ipc.types'

interface ProfileState {
  profile: Profile | null
  experiences: Experience[]
  education: Education[]
  skills: Skill[]
  certifications: Certification[]
  isLoading: boolean

  loadProfile: () => Promise<void>
  saveProfile: (profile: Profile) => Promise<Profile>

  loadExperiences: () => Promise<void>
  saveExperience: (exp: Experience) => Promise<Experience>
  deleteExperience: (id: number) => Promise<void>

  loadEducation: () => Promise<void>
  saveEducation: (edu: Education) => Promise<Education>
  deleteEducation: (id: number) => Promise<void>

  loadSkills: () => Promise<void>
  saveSkill: (skill: Skill) => Promise<Skill>
  deleteSkill: (id: number) => Promise<void>

  loadCertifications: () => Promise<void>
  saveCertification: (cert: Certification) => Promise<Certification>
  deleteCertification: (id: number) => Promise<void>
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  experiences: [],
  education: [],
  skills: [],
  certifications: [],
  isLoading: false,

  loadProfile: async () => {
    set({ isLoading: true })
    try {
      const profile = await window.api.getProfile()
      set({ profile })
      if (profile?.id) {
        await Promise.all([
          get().loadExperiences(),
          get().loadEducation(),
          get().loadSkills(),
          get().loadCertifications(),
        ])
      }
    } finally {
      set({ isLoading: false })
    }
  },

  saveProfile: async (profileData: Profile) => {
    const saved = await window.api.saveProfile(profileData)
    set({ profile: saved })
    return saved
  },

  loadExperiences: async () => {
    const profile = get().profile
    if (!profile?.id) return
    const experiences = await window.api.getExperiences(profile.id)
    set({ experiences })
  },

  saveExperience: async (exp: Experience) => {
    const saved = await window.api.saveExperience(exp)
    await get().loadExperiences()
    return saved
  },

  deleteExperience: async (id: number) => {
    await window.api.deleteExperience(id)
    await get().loadExperiences()
  },

  loadEducation: async () => {
    const profile = get().profile
    if (!profile?.id) return
    const education = await window.api.getEducation(profile.id)
    set({ education })
  },

  saveEducation: async (edu: Education) => {
    const saved = await window.api.saveEducation(edu)
    await get().loadEducation()
    return saved
  },

  deleteEducation: async (id: number) => {
    await window.api.deleteEducation(id)
    await get().loadEducation()
  },

  loadSkills: async () => {
    const profile = get().profile
    if (!profile?.id) return
    const skills = await window.api.getSkills(profile.id)
    set({ skills })
  },

  saveSkill: async (skill: Skill) => {
    const saved = await window.api.saveSkill(skill)
    await get().loadSkills()
    return saved
  },

  deleteSkill: async (id: number) => {
    await window.api.deleteSkill(id)
    await get().loadSkills()
  },

  loadCertifications: async () => {
    const profile = get().profile
    if (!profile?.id) return
    const certifications = await window.api.getCertifications(profile.id)
    set({ certifications })
  },

  saveCertification: async (cert: Certification) => {
    const saved = await window.api.saveCertification(cert)
    await get().loadCertifications()
    return saved
  },

  deleteCertification: async (id: number) => {
    await window.api.deleteCertification(id)
    await get().loadCertifications()
  },
}))
