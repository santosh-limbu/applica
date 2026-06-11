import React, { useState, useEffect } from 'react'
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  Edit2,
  Plus,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  PlusCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useProfileStore } from '@/stores/profile.store'
import { useAppStore } from '@/stores/app.store'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import type { Experience, Education, Skill, Certification } from '@/types/ipc.types'

export default function ProfilePanel() {
  const { addToast } = useAppStore()
  const {
    profile,
    loadProfile,
    saveProfile,
    experiences,
    loadExperiences,
    saveExperience,
    deleteExperience,
    education,
    loadEducation,
    saveEducation,
    deleteEducation,
    skills,
    loadSkills,
    saveSkill,
    deleteSkill,
    certifications,
    loadCertifications,
    saveCertification,
    deleteCertification,
  } = useProfileStore()

  // Inner tab state: 'about' | 'experience' | 'education'
  const [activeTab, setActiveTab] = useState<'about' | 'experience' | 'education'>('about')

  // Modals state
  const [personalInfoModal, setPersonalInfoModal] = useState(false)
  const [experienceModal, setExperienceModal] = useState<{ open: boolean; data?: Partial<Experience> }>({
    open: false,
  })
  const [educationModal, setEducationModal] = useState<{ open: boolean; data?: Partial<Education> }>({
    open: false,
  })
  const [certModal, setCertModal] = useState<{ open: boolean; data?: Partial<Certification> }>({
    open: false,
  })

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'experience' | 'education' | 'skill' | 'certification'
    id: number
    title: string
    onConfirm: () => void
  } | null>(null)

  // Skill input state
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillCategory, setNewSkillCategory] = useState('Technical')

  // Personal Info Form State
  const [personalForm, setPersonalForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    portfolio_url: '',
    professional_summary: '',
    references: '',
  })

  // Sync personal info state
  useEffect(() => {
    if (profile) {
      setPersonalForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        linkedin_url: profile.linkedin_url || '',
        portfolio_url: profile.portfolio_url || '',
        professional_summary: profile.professional_summary || '',
        references: profile.references || '',
      })
    }
  }, [profile])

  // Initial loading
  useEffect(() => {
    loadProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePersonalSave = async () => {
    if (!personalForm.full_name.trim()) {
      addToast({ type: 'error', title: 'Name is required' })
      return
    }
    try {
      await saveProfile({
        ...profile,
        ...personalForm,
      })
      addToast({ type: 'success', title: 'Profile details updated' })
      setPersonalInfoModal(false)
    } catch {
      addToast({ type: 'error', title: 'Failed to update profile' })
    }
  }

  // Skill Add
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return
    if (!newSkillName.trim()) return

    try {
      await saveSkill({
        profile_id: profile.id,
        name: newSkillName.trim(),
        category: newSkillCategory,
      })
      setNewSkillName('')
      addToast({ type: 'success', title: 'Skill added' })
    } catch {
      addToast({ type: 'error', title: 'Failed to add skill' })
    }
  }

  const handleDeleteSkill = async (id: number) => {
    try {
      await deleteSkill(id)
      addToast({ type: 'success', title: 'Skill deleted' })
    } catch {
      addToast({ type: 'error', title: 'Failed to delete skill' })
    }
  }

  // Experience Save
  const handleExperienceSave = async (data: Partial<Experience>) => {
    if (!profile?.id) return
    if (!data.company?.trim() || !data.role?.trim() || !data.start_date?.trim()) {
      addToast({ type: 'error', title: 'Company, role, and start date are required' })
      return
    }

    try {
      await saveExperience({
        ...data,
        profile_id: profile.id,
      } as Experience)
      addToast({ type: 'success', title: data.id ? 'Experience updated' : 'Experience added' })
      setExperienceModal({ open: false })
    } catch {
      addToast({ type: 'error', title: 'Failed to save experience' })
    }
  }

  const handleDeleteExp = async (id: number) => {
    try {
      await deleteExperience(id)
      addToast({ type: 'success', title: 'Experience deleted' })
    } catch {
      addToast({ type: 'error', title: 'Failed to delete experience' })
    }
  }

  // Education Save
  const handleEducationSave = async (data: Partial<Education>) => {
    if (!profile?.id) return
    if (!data.institution?.trim() || !data.degree?.trim()) {
      addToast({ type: 'error', title: 'Institution and degree are required' })
      return
    }

    try {
      await saveEducation({
        ...data,
        profile_id: profile.id,
      } as Education)
      addToast({ type: 'success', title: data.id ? 'Education updated' : 'Education added' })
      setEducationModal({ open: false })
    } catch {
      addToast({ type: 'error', title: 'Failed to save education' })
    }
  }

  const handleDeleteEdu = async (id: number) => {
    try {
      await deleteEducation(id)
      addToast({ type: 'success', title: 'Education deleted' })
    } catch {
      addToast({ type: 'error', title: 'Failed to delete education' })
    }
  }

  // Certification Save
  const handleCertSave = async (data: Partial<Certification>) => {
    if (!profile?.id) return
    if (!data.name?.trim()) {
      addToast({ type: 'error', title: 'Certification name is required' })
      return
    }

    try {
      await saveCertification({
        ...data,
        profile_id: profile.id,
      } as Certification)
      addToast({ type: 'success', title: data.id ? 'Certification updated' : 'Certification added' })
      setCertModal({ open: false })
    } catch {
      addToast({ type: 'error', title: 'Failed to save certification' })
    }
  }

  const handleDeleteCert = async (id: number) => {
    try {
      await deleteCertification(id)
      addToast({ type: 'success', title: 'Certification deleted' })
    } catch {
      addToast({ type: 'error', title: 'Failed to delete certification' })
    }
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <>
      <Card variant="surface" padding="none" className="flex flex-col overflow-hidden" style={{ minHeight: 'calc(100vh - 160px)', position: 'sticky', top: 'var(--titlebar-height)' }}>
        {/* Header Profile Header */}
        <div className="p-5 flex flex-col items-center text-center border-bottom" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
          <div className="sidebar-avatar mb-3" style={{ width: 64, height: 64, fontSize: 'var(--text-xl)' }}>{initials}</div>
          <h3 className="text-lg font-bold text-primary flex items-center justify-center gap-2">
            {profile?.full_name || 'Set Up Profile'}
            <button
              onClick={() => setPersonalInfoModal(true)}
              className="text-tertiary hover:text-accent p-1 rounded transition-colors"
              title="Edit Profile Info"
            >
              <Edit2 size={14} />
            </button>
          </h3>
          <p className="text-sm text-tertiary mt-1 flex items-center justify-center gap-1">
            <MapPin size={12} /> {profile?.location || 'Add location'}
          </p>

          {/* Quick contact details row */}
          <div className="flex justify-center gap-4 mt-3 text-tertiary text-xs">
            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="text-accent hover:text-primary transition-colors" title={profile.email}>
                <Mail size={16} />
              </a>
            )}
            {profile?.phone && (
              <span className="text-accent hover:text-primary cursor-default" title={profile.phone}>
                <Phone size={16} />
              </span>
            )}
            {profile?.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-accent hover:text-primary transition-colors" title="LinkedIn">
                <Linkedin size={16} />
              </a>
            )}
            {profile?.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="text-accent hover:text-primary transition-colors" title="Portfolio">
                <Globe size={16} />
              </a>
            )}
          </div>
        </div>

        {/* Small tabs menu inside panel */}
        <div className="flex p-1 border-bottom" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === 'about' ? 'bg-subtle text-accent font-semibold' : 'text-tertiary hover:text-secondary'
            }`}
            style={activeTab === 'about' ? { background: 'var(--accent-muted)' } : undefined}
          >
            About & Skills
          </button>
          <button
            onClick={() => setActiveTab('experience')}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === 'experience' ? 'bg-subtle text-accent font-semibold' : 'text-tertiary hover:text-secondary'
            }`}
            style={activeTab === 'experience' ? { background: 'var(--accent-muted)' } : undefined}
          >
            Experience
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === 'education' ? 'bg-subtle text-accent font-semibold' : 'text-tertiary hover:text-secondary'
            }`}
            style={activeTab === 'education' ? { background: 'var(--accent-muted)' } : undefined}
          >
            Edu & Certs
          </button>
        </div>

        {/* Tab Content area */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4 text-sm" style={{ maxHeight: 'calc(100vh - 350px)' }}>
          {/* TAB 1: About & Skills */}
          {activeTab === 'about' && (
            <>
              {/* Summary */}
              <div>
                <h4 className="font-semibold text-secondary uppercase tracking-wider text-xs mb-2">Professional Summary</h4>
                {profile?.professional_summary ? (
                  <div className="text-secondary leading-relaxed text-xs bg-surface p-3 rounded-lg border border-default">
                    <ExpandableText text={profile.professional_summary} maxLines={4} />
                  </div>
                ) : (
                  <p className="text-tertiary text-xs italic">No professional summary added yet. Click edit above to add one.</p>
                )}
              </div>

              {/* References */}
              <div>
                <h4 className="font-semibold text-secondary uppercase tracking-wider text-xs mb-2">References</h4>
                {profile?.references ? (
                  <div className="text-secondary leading-relaxed text-xs bg-surface p-3 rounded-lg border border-default">
                    <ExpandableText text={profile.references} maxLines={3} />
                  </div>
                ) : (
                  <p className="text-tertiary text-xs italic">No reference info added yet. Click edit above to add references.</p>
                )}
              </div>

              {/* Skills */}
              <div>
                <h4 className="font-semibold text-secondary uppercase tracking-wider text-xs mb-2">Skills</h4>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {skills.map((skill) => (
                      <span key={skill.id} className="tag tag-accent text-xs pr-1 flex items-center gap-1">
                        {skill.name}
                        <button
                          onClick={() =>
                            skill.id &&
                            setDeleteConfirm({
                              type: 'skill',
                              id: skill.id,
                              title: skill.name,
                              onConfirm: () => handleDeleteSkill(skill.id!),
                            })
                          }
                          className="hover:bg-subtle rounded-full p-0.5 text-accent hover:text-danger transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-tertiary text-xs italic mb-3">No skills added yet.</p>
                )}

                {/* Add Skill form inline */}
                {profile?.id && (
                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <input
                      type="text"
                      className="input-field py-1 px-2 text-xs flex-1"
                      placeholder="Add a skill..."
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                    />
                    <Button size="sm" type="submit" style={{ padding: '4px 8px' }}>
                      <Plus size={14} />
                    </Button>
                  </form>
                )}
              </div>
            </>
          )}

          {/* TAB 2: Experience */}
          {activeTab === 'experience' && (
            <>
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-secondary uppercase tracking-wider text-xs">Work History</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExperienceModal({ open: true })}
                  style={{ padding: '2px 6px', height: 'auto', fontSize: 'var(--text-xs)' }}
                >
                  <Plus size={12} className="mr-1" /> Add
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {experiences.length > 0 ? (
                  experiences.map((exp) => (
                    <div key={exp.id} className="p-3 bg-surface rounded-lg border border-default flex flex-col gap-1 relative group min-w-0">
                      <div className="pr-10">
                        <div className="font-semibold text-primary text-xs break-words leading-snug">{exp.role}</div>
                        <div className="text-tertiary text-xs mt-0.5 break-words">{exp.company} {exp.location && `· ${exp.location}`}</div>
                        <div className="text-[10px] text-tertiary font-medium mt-1">{exp.start_date} - {exp.end_date || 'Present'}</div>
                        {exp.description && (
                          <div className="text-tertiary text-xs leading-normal mt-1">
                            <ExpandableText text={exp.description} maxLines={2} />
                          </div>
                        )}
                      </div>
                      
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface/80 pl-1 rounded">
                        <button
                          onClick={() => setExperienceModal({ open: true, data: exp })}
                          className="p-1 text-tertiary hover:text-accent rounded hover:bg-subtle transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() =>
                            exp.id &&
                            setDeleteConfirm({
                              type: 'experience',
                              id: exp.id,
                              title: `${exp.role} at ${exp.company}`,
                              onConfirm: () => handleDeleteExp(exp.id!),
                            })
                          }
                          className="p-1 text-tertiary hover:text-danger rounded hover:bg-subtle transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-tertiary text-xs italic">No experience entries. Click Add above to add your work history.</p>
                )}
              </div>
            </>
          )}

          {/* TAB 3: Education & Certs */}
          {activeTab === 'education' && (
            <>
              {/* Education */}
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-secondary uppercase tracking-wider text-xs">Education</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEducationModal({ open: true })}
                  style={{ padding: '2px 6px', height: 'auto', fontSize: 'var(--text-xs)' }}
                >
                  <Plus size={12} className="mr-1" /> Add
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {education.length > 0 ? (
                  education.map((edu) => (
                    <div key={edu.id} className="p-3 bg-surface rounded-lg border border-default flex flex-col gap-1 relative group min-w-0">
                      <div className="pr-10">
                        <div className="font-semibold text-primary text-xs break-words leading-snug">{edu.degree}</div>
                        <div className="text-tertiary text-xs mt-0.5 break-words">{edu.institution}</div>
                        <div className="text-[10px] text-tertiary font-medium mt-1">{edu.start_date} - {edu.end_date || 'Ongoing'}</div>
                        {edu.grade && <div className="text-[10px] text-accent font-medium mt-0.5">Grade: {edu.grade}</div>}
                        {edu.description && (
                          <div className="text-tertiary text-xs leading-normal mt-1">
                            <ExpandableText text={edu.description} maxLines={2} />
                          </div>
                        )}
                      </div>
                      
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface/80 pl-1 rounded">
                        <button
                          onClick={() => setEducationModal({ open: true, data: edu })}
                          className="p-1 text-tertiary hover:text-accent rounded hover:bg-subtle transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                         <button
                          onClick={() =>
                            edu.id &&
                            setDeleteConfirm({
                              type: 'education',
                              id: edu.id,
                              title: `${edu.degree} at ${edu.institution}`,
                              onConfirm: () => handleDeleteEdu(edu.id!),
                            })
                          }
                          className="p-1 text-tertiary hover:text-danger rounded hover:bg-subtle transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-tertiary text-xs italic">No education entries. Click Add above to document your education.</p>
                )}
              </div>

              <div className="divider my-1" />

              {/* Certifications */}
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-secondary uppercase tracking-wider text-xs">Certifications</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCertModal({ open: true })}
                  style={{ padding: '2px 6px', height: 'auto', fontSize: 'var(--text-xs)' }}
                >
                  <Plus size={12} className="mr-1" /> Add
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {certifications.length > 0 ? (
                  certifications.map((cert) => (
                    <div key={cert.id} className="p-3 bg-surface rounded-lg border border-default flex flex-col gap-1 relative group min-w-0">
                      <div className="pr-10">
                        <div className="font-semibold text-primary text-xs break-words leading-snug">{cert.name}</div>
                        <div className="text-tertiary text-xs mt-0.5 break-words">{cert.issuer}</div>
                        <div className="text-[10px] text-tertiary font-medium mt-1">Obtained: {cert.date_obtained || 'N/A'}</div>
                      </div>
                      
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface/80 pl-1 rounded">
                        <button
                          onClick={() => setCertModal({ open: true, data: cert })}
                          className="p-1 text-tertiary hover:text-accent rounded hover:bg-subtle transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() =>
                            cert.id &&
                            setDeleteConfirm({
                              type: 'certification',
                              id: cert.id,
                              title: cert.name,
                              onConfirm: () => handleDeleteCert(cert.id!),
                            })
                          }
                          className="p-1 text-tertiary hover:text-danger rounded hover:bg-subtle transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-tertiary text-xs italic">No certifications yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* MODAL 1: Personal Info & Summary Edit */}
      <Modal
        open={personalInfoModal}
        onClose={() => setPersonalInfoModal(false)}
        title="Edit Profile Information"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPersonalInfoModal(false)}>Cancel</Button>
            <Button onClick={handlePersonalSave}>Save Changes</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={personalForm.full_name}
            onChange={(e) => setPersonalForm({ ...personalForm, full_name: e.target.value })}
          />
          <Input
            label="Location"
            value={personalForm.location}
            onChange={(e) => setPersonalForm({ ...personalForm, location: e.target.value })}
            placeholder="City, Country"
          />
          <Input
            label="Email"
            type="email"
            value={personalForm.email}
            onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={personalForm.phone}
            onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
          />
          <Input
            label="LinkedIn URL"
            value={personalForm.linkedin_url}
            onChange={(e) => setPersonalForm({ ...personalForm, linkedin_url: e.target.value })}
            placeholder="https://linkedin.com/in/..."
          />
          <Input
            label="Portfolio URL"
            value={personalForm.portfolio_url}
            onChange={(e) => setPersonalForm({ ...personalForm, portfolio_url: e.target.value })}
            placeholder="https://..."
          />
          <div className="col-span-2">
            <Input
              label="Professional Summary"
              multiline
              rows={3}
              value={personalForm.professional_summary}
              onChange={(e) => setPersonalForm({ ...personalForm, professional_summary: e.target.value })}
              placeholder="Summarize your professional background..."
            />
          </div>
          <div className="col-span-2">
            <Input
              label="References"
              multiline
              rows={3}
              value={personalForm.references}
              onChange={(e) => setPersonalForm({ ...personalForm, references: e.target.value })}
              placeholder="Jane Smith, Director of Engineering at Acme Corp (jane.smith@acme.com) or 'References available upon request'..."
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Experience Add/Edit */}
      <ExperienceFormModal
        open={experienceModal.open}
        data={experienceModal.data}
        onClose={() => setExperienceModal({ open: false })}
        onSave={handleExperienceSave}
      />

      {/* MODAL 3: Education Add/Edit */}
      <EducationFormModal
        open={educationModal.open}
        data={educationModal.data}
        onClose={() => setEducationModal({ open: false })}
        onSave={handleEducationSave}
      />

      {/* MODAL 4: Certification Add/Edit */}
      <CertFormModal
        open={certModal.open}
        data={certModal.data}
        onClose={() => setCertModal({ open: false })}
        onSave={handleCertSave}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={`Delete ${deleteConfirm ? deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1) : ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => {
              if (deleteConfirm) {
                deleteConfirm.onConfirm()
                setDeleteConfirm(null)
              }
            }}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-secondary">
          Are you sure you want to delete <strong className="text-primary">{deleteConfirm?.title}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </>
  )
}

function ExpandableText({ text, maxLines = 3 }: { text: string; maxLines?: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = text.length > 120

  const clampStyle: React.CSSProperties = {
    display: '-webkit-box',
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word',
  }

  return (
    <div 
      onClick={() => isLong && setIsExpanded(!isExpanded)}
      className={isLong ? 'cursor-pointer hover:bg-subtle transition-colors rounded p-1 -m-1' : ''}
      title={isLong ? (isExpanded ? 'Click to collapse' : 'Click to expand') : undefined}
    >
      <div 
        style={isLong && !isExpanded ? clampStyle : { wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
      >
        {text}
      </div>
      {isLong && (
        <div className="flex justify-end mt-0.5 select-none">
          {isExpanded ? (
            <ChevronUp size={14} className="text-accent" />
          ) : (
            <ChevronDown size={14} className="text-accent" />
          )}
        </div>
      )}
    </div>
  )
}

/* Sub-modals for cleaner file structure */
function ExperienceFormModal({
  open,
  data,
  onClose,
  onSave,
}: {
  open: boolean
  data?: Partial<Experience>
  onClose: () => void
  onSave: (data: Partial<Experience>) => void
}) {
  const [form, setForm] = useState<Partial<Experience>>({
    company: '',
    role: '',
    start_date: '',
    end_date: '',
    location: '',
    description: '',
  })

  useEffect(() => {
    if (open) {
      setForm(
        data || {
          company: '',
          role: '',
          start_date: '',
          end_date: '',
          location: '',
          description: '',
        }
      )
    }
  }, [open, data])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={data?.id ? 'Edit Experience' : 'Add Experience'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Job Title / Role"
          value={form.role || ''}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          placeholder="e.g. Senior Software Engineer"
        />
        <Input
          label="Company Name"
          value={form.company || ''}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          placeholder="e.g. Acme Corp"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            value={form.start_date || ''}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            placeholder="e.g. Jan 2022"
          />
          <Input
            label="End Date"
            value={form.end_date || ''}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            placeholder="e.g. Present or Dec 2024"
          />
        </div>
        <Input
          label="Location"
          value={form.location || ''}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="e.g. San Francisco, CA (or Remote)"
        />
        <Input
          label="Description"
          multiline
          rows={3}
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Summarize your key responsibilities and accomplishments..."
        />
      </div>
    </Modal>
  )
}

function EducationFormModal({
  open,
  data,
  onClose,
  onSave,
}: {
  open: boolean
  data?: Partial<Education>
  onClose: () => void
  onSave: (data: Partial<Education>) => void
}) {
  const [form, setForm] = useState<Partial<Education>>({
    institution: '',
    degree: '',
    start_date: '',
    end_date: '',
    grade: '',
    description: '',
  })

  useEffect(() => {
    if (open) {
      setForm(
        data || {
          institution: '',
          degree: '',
          start_date: '',
          end_date: '',
          grade: '',
          description: '',
        }
      )
    }
  }, [open, data])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={data?.id ? 'Edit Education' : 'Add Education'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Degree / Program"
          value={form.degree || ''}
          onChange={(e) => setForm({ ...form, degree: e.target.value })}
          placeholder="e.g. B.S. in Computer Science"
        />
        <Input
          label="Institution / School"
          value={form.institution || ''}
          onChange={(e) => setForm({ ...form, institution: e.target.value })}
          placeholder="e.g. Stanford University"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            value={form.start_date || ''}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            placeholder="e.g. Sep 2018"
          />
          <Input
            label="End Date"
            value={form.end_date || ''}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            placeholder="e.g. Jun 2022"
          />
        </div>
        <Input
          label="Grade / GPA (Optional)"
          value={form.grade || ''}
          onChange={(e) => setForm({ ...form, grade: e.target.value })}
          placeholder="e.g. First Class Honours or 3.8/4.0"
        />
        <Input
          label="Description (Optional)"
          multiline
          rows={3}
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="e.g. Minor in Mathematics, Leadership roles..."
        />
      </div>
    </Modal>
  )
}

function CertFormModal({
  open,
  data,
  onClose,
  onSave,
}: {
  open: boolean
  data?: Partial<Certification>
  onClose: () => void
  onSave: (data: Partial<Certification>) => void
}) {
  const [form, setForm] = useState<Partial<Certification>>({
    name: '',
    issuer: '',
    date_obtained: '',
    expiry_date: '',
    credential_url: '',
  })

  useEffect(() => {
    if (open) {
      setForm(
        data || {
          name: '',
          issuer: '',
          date_obtained: '',
          expiry_date: '',
          credential_url: '',
        }
      )
    }
  }, [open, data])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={data?.id ? 'Edit Certification' : 'Add Certification'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Certification Name"
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. AWS Certified Solutions Architect"
        />
        <Input
          label="Issuing Organization"
          value={form.issuer || ''}
          onChange={(e) => setForm({ ...form, issuer: e.target.value })}
          placeholder="e.g. Amazon Web Services"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date Obtained"
            value={form.date_obtained || ''}
            onChange={(e) => setForm({ ...form, date_obtained: e.target.value })}
            placeholder="e.g. Oct 2023"
          />
          <Input
            label="Expiry Date"
            value={form.expiry_date || ''}
            onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
            placeholder="e.g. Oct 2026"
          />
        </div>
        <Input
          label="Credential URL"
          value={form.credential_url || ''}
          onChange={(e) => setForm({ ...form, credential_url: e.target.value })}
          placeholder="https://..."
        />
      </div>
    </Modal>
  )
}
