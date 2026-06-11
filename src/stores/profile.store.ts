import { create } from 'zustand'
import type { Profile, Experience, Education, Skill, Certification } from '@/types/ipc.types'
import { useAppStore } from './app.store'

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

export const useProfileStore = create<ProfileState>((set, get) => {
  const createEntityHelpers = (
    entityName: 'Experiences' | 'Education' | 'Skills' | 'Certifications',
    pluralName: 'experiences' | 'education' | 'skills' | 'certifications',
    apiGet: 'getExperiences' | 'getEducation' | 'getSkills' | 'getCertifications',
    apiSave: 'saveExperience' | 'saveEducation' | 'saveSkill' | 'saveCertification',
    apiDelete: 'deleteExperience' | 'deleteEducation' | 'deleteSkill' | 'deleteCertification'
  ) => ({
    [`load${entityName}`]: async () => {
      const profile = get().profile
      if (!profile?.id) return
      // We use 'any' to bypass TS complains about indexing window.api with string
      const data = await (window.api as any)[apiGet](profile.id)
      set({ [pluralName]: data } as any)
    },
    [`save${entityName.replace('Experiences', 'Experience').replace('Certifications', 'Certification').replace('Skills', 'Skill')}`]: async (item: any) => {
      const saved = await (window.api as any)[apiSave](item)
      await get()[`load${entityName}`]()
      return saved
    },
    [`delete${entityName.replace('Experiences', 'Experience').replace('Certifications', 'Certification').replace('Skills', 'Skill')}`]: async (id: number) => {
      await (window.api as any)[apiDelete](id)
      await get()[`load${entityName}`]()
    }
  });

  return {
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
      } catch (error) {
        useAppStore.getState().addToast({
          type: 'error',
          title: 'Error loading profile',
          message: error instanceof Error ? error.message : 'Failed to load profile',
        })
        throw error
      } finally {
        set({ isLoading: false })
      }
    },

    saveProfile: async (profileData: Profile) => {
      const saved = await window.api.saveProfile(profileData)
      set({ profile: saved })
      return saved
    },

    ...(createEntityHelpers('Experiences', 'experiences', 'getExperiences', 'saveExperience', 'deleteExperience') as any),
    ...(createEntityHelpers('Education', 'education', 'getEducation', 'saveEducation', 'deleteEducation') as any),
    ...(createEntityHelpers('Skills', 'skills', 'getSkills', 'saveSkill', 'deleteSkill') as any),
    ...(createEntityHelpers('Certifications', 'certifications', 'getCertifications', 'saveCertification', 'deleteCertification') as any),
  };
});
