import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAppStore } from './app.store'

describe('useAppStore', () => {
  // Reset the store before each test to ensure a clean state
  beforeEach(() => {
    useAppStore.setState({
      currentPage: 'dashboard',
      isLoading: false,
      toasts: [],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with correct default state', () => {
    const state = useAppStore.getState()
    expect(state.currentPage).toBe('dashboard')
    expect(state.isLoading).toBe(false)
    expect(state.toasts).toEqual([])
  })

  it('should update currentPage on navigate', () => {
    const { navigate } = useAppStore.getState()
    navigate('profile')
    expect(useAppStore.getState().currentPage).toBe('profile')
  })

  it('should update isLoading on setLoading', () => {
    const { setLoading } = useAppStore.getState()

    setLoading(true)
    expect(useAppStore.getState().isLoading).toBe(true)

    setLoading(false)
    expect(useAppStore.getState().isLoading).toBe(false)
  })

  it('should add a toast and assign an auto-incrementing id', () => {
    const { addToast } = useAppStore.getState()

    addToast({ type: 'success', title: 'Success', message: 'Test message 1' })
    let toasts = useAppStore.getState().toasts
    expect(toasts.length).toBe(1)
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].title).toBe('Success')
    expect(toasts[0].message).toBe('Test message 1')
    expect(toasts[0].id).toMatch(/^toast-\d+$/)

    addToast({ type: 'error', title: 'Error' })
    toasts = useAppStore.getState().toasts
    expect(toasts.length).toBe(2)
    expect(toasts[1].type).toBe('error')
    expect(toasts[1].title).toBe('Error')
    expect(toasts[1].message).toBeUndefined()
    expect(toasts[1].id).toMatch(/^toast-\d+$/)

    // Check IDs are different
    expect(toasts[0].id).not.toBe(toasts[1].id)
  })

  it('should automatically dismiss a toast after 5 seconds', () => {
    vi.useFakeTimers()
    const { addToast } = useAppStore.getState()

    addToast({ type: 'info', title: 'Info Toast' })

    expect(useAppStore.getState().toasts.length).toBe(1)

    // Fast-forward time by 4999ms
    vi.advanceTimersByTime(4999)
    expect(useAppStore.getState().toasts.length).toBe(1)

    // Fast-forward 1ms to reach 5000ms
    vi.advanceTimersByTime(1)
    expect(useAppStore.getState().toasts.length).toBe(0)
  })

  it('should manually remove a toast by id', () => {
    const { addToast } = useAppStore.getState()

    addToast({ type: 'warning', title: 'Warning 1' })
    addToast({ type: 'warning', title: 'Warning 2' })

    const toasts = useAppStore.getState().toasts
    expect(toasts.length).toBe(2)

    const idToRemove = toasts[0].id

    useAppStore.getState().removeToast(idToRemove)

    const remainingToasts = useAppStore.getState().toasts
    expect(remainingToasts.length).toBe(1)
    expect(remainingToasts[0].title).toBe('Warning 2')
  })
})
