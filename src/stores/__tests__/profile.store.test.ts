import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProfileStore } from '../profile.store'
import { useAppStore } from '../app.store'

// Mock the window.api
const mockApi = {
  getProfile: vi.fn(),
  getExperiences: vi.fn(),
  getEducation: vi.fn(),
  getSkills: vi.fn(),
  getCertifications: vi.fn(),
}

vi.stubGlobal('window', { api: mockApi })

describe('useProfileStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProfileStore.setState({
      profile: null,
      experiences: [],
      education: [],
      skills: [],
      certifications: [],
      isLoading: false,
    })
    useAppStore.setState({ toasts: [] })
  })

  describe('loadProfile', () => {
    it('should set isLoading to true then false on success', async () => {
      mockApi.getProfile.mockResolvedValueOnce({ id: 1, full_name: 'Test User' })
      mockApi.getExperiences.mockResolvedValueOnce([])
      mockApi.getEducation.mockResolvedValueOnce([])
      mockApi.getSkills.mockResolvedValueOnce([])
      mockApi.getCertifications.mockResolvedValueOnce([])

      const promise = useProfileStore.getState().loadProfile()

      expect(useProfileStore.getState().isLoading).toBe(true)

      await promise

      expect(useProfileStore.getState().isLoading).toBe(false)
      expect(useProfileStore.getState().profile).toEqual({ id: 1, full_name: 'Test User' })
    })

    it('should handle error when api call fails and update toast', async () => {
      const error = new Error('Failed to fetch profile')
      mockApi.getProfile.mockRejectedValueOnce(error)

      const addToastSpy = vi.spyOn(useAppStore.getState(), 'addToast')

      try {
        await useProfileStore.getState().loadProfile()
      } catch (e) {
        // expected
      }

      expect(useProfileStore.getState().isLoading).toBe(false)
      expect(addToastSpy).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error loading profile',
        message: 'Failed to fetch profile',
      })
    })
  })
})
