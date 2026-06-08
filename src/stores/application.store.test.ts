import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApplicationStore } from './application.store'

describe('useApplicationStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useApplicationStore.setState({
      applications: [],
      currentApplication: null,
      jobAnalysis: null,
      atsScore: null,
      isLoading: false,
    })

    // Mock the window.api object
    globalThis.window = {
      api: {
        getApplications: vi.fn(),
        getApplication: vi.fn(),
        saveApplication: vi.fn(),
        updateApplicationStatus: vi.fn(),
        deleteApplication: vi.fn(),
        analyzeJob: vi.fn(),
        scoreATS: vi.fn(),
      } as any
    } as any
  })

  describe('loadApplications', () => {
    it('handles success path correctly', async () => {
      const mockApplications = [{ id: 1, position: 'Frontend Engineer' }]
      vi.mocked(window.api.getApplications).mockResolvedValueOnce(mockApplications as any)

      const store = useApplicationStore.getState()

      const promise = store.loadApplications()

      // Loading state should be true while fetching
      expect(useApplicationStore.getState().isLoading).toBe(true)

      await promise

      // State updates after fetch
      expect(useApplicationStore.getState().isLoading).toBe(false)
      expect(useApplicationStore.getState().applications).toEqual(mockApplications)
    })

    it('handles error path correctly', async () => {
      const error = new Error('Failed to load applications')
      vi.mocked(window.api.getApplications).mockRejectedValueOnce(error)

      const store = useApplicationStore.getState()

      const promise = store.loadApplications()

      // Loading state should be true while fetching
      expect(useApplicationStore.getState().isLoading).toBe(true)

      await expect(promise).rejects.toThrow('Failed to load applications')

      // Check state updates after failure
      expect(useApplicationStore.getState().isLoading).toBe(false)
      expect(useApplicationStore.getState().applications).toEqual([])
    })
  })
})
