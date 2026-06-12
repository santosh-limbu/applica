import { useEffect, useState, useMemo } from 'react'
import {
  PlusCircle,
  Trash2,
  MoreHorizontal,
  Briefcase,
  Target,
  Trophy,
  TrendingUp,
  RefreshCw,
  LayoutGrid,
  List,
} from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { useApplicationStore } from '@/stores/application.store'
import type { Application } from '@/types/ipc.types'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SearchField from '@/components/ui/SearchField'
import Tabs from '@/components/ui/Tabs'
import DataTable from '@/components/ui/DataTable'
import IconButton from '@/components/ui/IconButton'
import PageHeader from '@/components/layout/PageHeader'
import ProfilePanel from './ProfilePanel'
import Skeleton from '@/components/ui/Skeleton'

const statusFilters = [
  'all',
  'draft',
  'applied',
  'interview',
  'rejected',
  'offer',
  'accepted',
  'withdrawn',
] as const

const statusOptions: Exclude<Application['status'], undefined>[] = [
  'draft',
  'applied',
  'interview',
  'rejected',
  'offer',
  'accepted',
  'withdrawn',
]

export default function DashboardPage() {
  const navigate = useAppStore((s) => s.navigate)
  const addToast = useAppStore((s) => s.addToast)
  const {
    applications,
    loadApplications,
    deleteApplication,
    updateApplicationStatus,
    setCurrentApplication,
    isLoading,
    generatingApplications,
  } = useApplicationStore()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null)
  const [statusMenu, setStatusMenu] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const columns = useMemo(() => [
    {
      key: 'company',
      header: 'Company',
      render: (app: Application) => (
        <span className="font-semibold text-primary">{app.company}</span>
      ),
    },
    {
      key: 'role_title',
      header: 'Role',
      render: (app: Application) => (
        <span className="hover:text-accent font-semibold transition-colors">
          {app.role_title}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (app: Application) => <Badge status={app.status || 'draft'} />,
    },
    {
      key: 'applied_date',
      header: 'Applied Date',
      render: (app: Application) =>
        app.applied_date ? new Date(app.applied_date).toLocaleDateString() : '-',
    },
    {
      key: 'ats_score',
      header: 'ATS Score',
      render: (app: Application) =>
        app.ats_score !== undefined && app.ats_score !== null ? (
          <span className="font-bold text-accent">{app.ats_score}%</span>
        ) : (
          '-'
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (app: Application) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <IconButton
            onClick={() => {
              setDeleteTarget(app)
            }}
          >
            <Trash2 size={16} style={{ color: 'var(--danger)' }} />
          </IconButton>
        </div>
      ),
    },
  ], [navigate, setCurrentApplication])

  useEffect(() => {
    loadApplications()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        !search ||
        app.company.toLowerCase().includes(search.toLowerCase()) ||
        app.role_title.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [applications, search, statusFilter])

  // Stats
  const stats = useMemo(() => {
    const total = applications.length
    const active = applications.filter((a) =>
      ['applied', 'interview'].includes(a.status || '')
    ).length
    const interviews = applications.filter((a) => a.status === 'interview').length
    const offers = applications.filter((a) =>
      ['offer', 'accepted'].includes(a.status || '')
    ).length
    return { total, active, interviews, offers }
  }, [applications])

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    try {
      await deleteApplication(deleteTarget.id)
      addToast({ type: 'success', title: 'Application deleted' })
    } catch {
      addToast({ type: 'error', title: 'Delete failed' })
    }
    setDeleteTarget(null)
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateApplicationStatus(id, status)
      addToast({ type: 'success', title: 'Status updated' })
    } catch {
      addToast({ type: 'error', title: 'Update failed' })
    }
    setStatusMenu(null)
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Track and manage your job applications"
        actions={
          <Button iconLeft={<PlusCircle size={16} />} onClick={() => navigate('new-application')}>
            New Application
          </Button>
        }
      />

      <div className="dashboard-layout">
        {/* Left Column: Profile widget */}
        <ProfilePanel />

        {/* Right Column: Applications Tracker & Stats */}
        <div className="flex flex-col gap-6" style={{ minWidth: 0 }}>
          {/* Stats row */}
          <div className="grid gap-4 grid-cols-4">
            <StatCard icon={Briefcase} label="Total Applications" value={stats.total} />
            <StatCard icon={TrendingUp} label="Active" value={stats.active} color="var(--info)" />
            <StatCard icon={Target} label="Interviews" value={stats.interviews} color="var(--accent-primary)" />
            <StatCard icon={Trophy} label="Offers" value={stats.offers} color="var(--success)" />
          </div>

          {/* Filter bar */}
          <div className="flex items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-default">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search applications…"
              className="max-w-xs"
            />

            <div className="flex items-center gap-4">
              <Tabs
                activeTab={statusFilter}
                onChange={setStatusFilter}
                tabs={statusFilters.map((s) => ({
                  id: s,
                  label: s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1),
                }))}
                variant="pill"
              />

              <div className="flex items-center gap-1 border-l border-default pl-4">
                <IconButton
                  active={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </IconButton>
                <IconButton
                  active={viewMode === 'table'}
                  onClick={() => setViewMode('table')}
                  title="Table View"
                >
                  <List size={16} />
                </IconButton>
              </div>
            </div>
          </div>

          {/* Applications list */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={96} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state bg-surface rounded-xl border border-default p-12">
              <h3 className="empty-state-title">
                {applications.length === 0 ? 'No applications yet' : 'No matching applications'}
              </h3>
              <p className="empty-state-text">
                {applications.length === 0
                  ? 'Create your first application to start tracking your job search'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {applications.length === 0 && (
                <Button iconLeft={<PlusCircle size={16} />} onClick={() => navigate('new-application')}>
                  Create Application
                </Button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <DataTable
              data={filtered}
              columns={columns}
              keyExtractor={(app) => app.id!}
              onRowClick={(app) => {
                setCurrentApplication(app)
                navigate('editor')
              }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((app) => (
                <Card key={app.id} hover variant="surface" padding="none">
                  <div className="flex items-center gap-4 p-4">
                    {/* Company initial */}
                    <div
                      className="flex items-center justify-center rounded-lg font-bold text-lg"
                      style={{
                        width: 48,
                        height: 48,
                        background: 'var(--accent-muted)',
                        color: 'var(--accent-primary)',
                        flexShrink: 0,
                      }}
                    >
                      {app.company.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0" onClick={() => {
                      setCurrentApplication(app)
                      navigate('editor') // Click to open editor
                    }} style={{ cursor: 'pointer' }}>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-md font-semibold truncate hover:text-accent transition-colors">{app.role_title}</h4>
                        <Badge status={app.status || 'draft'} />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-secondary">
                        <span>{app.company}</span>
                        {app.applied_date && (
                          <>
                            <span>·</span>
                            <span>{new Date(app.applied_date).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Generating status aligned to the right */}
                    {app.id && generatingApplications[app.id] && (
                      <div className="flex items-center gap-2 text-xs text-accent-primary animate-pulse bg-accent-muted/40 px-3 py-1.5 rounded-lg border border-accent/20 font-medium whitespace-nowrap">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent" />
                        {generatingApplications[app.id] === 'cv' ? 'Generating CV...' : 'Generating Cover Letter...'}
                      </div>
                    )}

                    {/* ATS score */}
                    {app.ats_score !== undefined && app.ats_score !== null && (
                      <div className="flex flex-col items-end" style={{ minWidth: 80 }}>
                        <span className="text-xs text-secondary mb-1">ATS Score</span>
                        <div className="ats-bar" style={{ width: 80 }}>
                          <div className="ats-bar-track">
                            <div className="ats-bar-fill" style={{ width: `${app.ats_score}%` }} />
                          </div>
                          <span className="ats-bar-score">{app.ats_score}%</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <div className="relative">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation()
                            setStatusMenu(statusMenu === app.id ? null : (app.id ?? null))
                          }}
                        >
                          <MoreHorizontal size={16} />
                        </IconButton>

                        {statusMenu === app.id && (
                          <div
                            className="absolute right-0 top-full mt-1 p-1 card card-elevated rounded-md"
                            style={{ minWidth: 140, zIndex: 100 }}
                          >
                            {statusOptions.map((st) => (
                              <button
                                key={st}
                                className="btn btn-ghost btn-sm w-full"
                                style={{ justifyContent: 'flex-start' }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (app.id) handleStatusChange(app.id, st)
                                }}
                              >
                                <Badge status={st} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(app)
                        }}
                      >
                        <Trash2 size={16} style={{ color: 'var(--danger)' }} />
                      </IconButton>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Application"
        message={`Are you sure you want to delete the application for ${deleteTarget?.role_title} at ${deleteTarget?.company}? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Briefcase
  label: string
  value: number
  color?: string
}) {
  return (
    <Card variant="surface" padding="none">
      <div className="stat-card">
        <div className="flex items-center justify-between mb-2">
          <Icon size={20} style={{ color: color || 'var(--text-tertiary)' }} />
        </div>
        <span className="stat-value" style={color ? { color } : undefined}>
          {value}
        </span>
        <span className="stat-label">{label}</span>
      </div>
    </Card>
  )
}
