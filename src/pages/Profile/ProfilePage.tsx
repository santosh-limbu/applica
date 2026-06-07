import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { useProfileStore } from '@/stores/profile.store'
import { useAppStore } from '@/stores/app.store'
import { User, Briefcase, GraduationCap, Award, FileBadge } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'education' | 'skills' | 'certifications'>('overview')
  const { profile, loadProfile, saveProfile, experiences, loadExperiences, education, loadEducation, skills, loadSkills, certifications, loadCertifications } = useProfileStore()
  const { addToast } = useAppStore()

  useEffect(() => {
    loadProfile()
    if (profile?.id) {
      loadExperiences(profile.id)
      loadEducation(profile.id)
      loadSkills(profile.id)
      loadCertifications(profile.id)
    }
  }, [profile?.id])

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    linkedin_url: profile?.linkedin_url || '',
    portfolio_url: profile?.portfolio_url || '',
    professional_summary: profile?.professional_summary || '',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        linkedin_url: profile.linkedin_url || '',
        portfolio_url: profile.portfolio_url || '',
        professional_summary: profile.professional_summary || '',
      })
    }
  }, [profile])

  const handleOverviewSave = async () => {
    try {
      await saveProfile({ ...profile, ...formData } as any)
      addToast({ title: 'Success', message: 'Profile updated successfully', type: 'success' })
    } catch (e: any) {
      addToast({ title: 'Error', message: e.message || 'Failed to update profile', type: 'error' })
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Profile</h1>
          <p className="text-muted mt-1">Manage your professional information and history</p>
        </div>
      </div>

      <div className="flex gap-2 bg-surface p-1 rounded-lg w-fit border border-subtle">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-subtle text-white' : 'text-muted hover:text-white'}`}><User className="inline-block w-4 h-4 mr-2" />Overview</button>
        <button onClick={() => setActiveTab('experience')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'experience' ? 'bg-subtle text-white' : 'text-muted hover:text-white'}`}><Briefcase className="inline-block w-4 h-4 mr-2" />Experience</button>
        <button onClick={() => setActiveTab('education')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'education' ? 'bg-subtle text-white' : 'text-muted hover:text-white'}`}><GraduationCap className="inline-block w-4 h-4 mr-2" />Education</button>
        <button onClick={() => setActiveTab('skills')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'skills' ? 'bg-subtle text-white' : 'text-muted hover:text-white'}`}><Award className="inline-block w-4 h-4 mr-2" />Skills</button>
        <button onClick={() => setActiveTab('certifications')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'certifications' ? 'bg-subtle text-white' : 'text-muted hover:text-white'}`}><FileBadge className="inline-block w-4 h-4 mr-2" />Certifications</button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        {activeTab === 'overview' && (
          <div className="max-w-3xl flex flex-col gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Full Name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <Input label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <Input label="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                <Input label="LinkedIn URL" value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} />
                <Input label="Portfolio URL" value={formData.portfolio_url} onChange={e => setFormData({...formData, portfolio_url: e.target.value})} />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Professional Summary</h2>
              <Input 
                isTextarea 
                value={formData.professional_summary} 
                onChange={e => setFormData({...formData, professional_summary: e.target.value})} 
                placeholder="A brief summary of your professional background and goals..."
              />
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleOverviewSave}>Save Changes</Button>
            </div>
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="max-w-4xl flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Work Experience</h2>
              <Button variant="outline" size="sm">+ Add Experience</Button>
            </div>
            {experiences.length === 0 ? (
              <Card className="p-8 text-center text-muted">No experience entries yet. Add some to get started.</Card>
            ) : (
              experiences.map(exp => (
                <Card key={exp.id} className="p-6">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{exp.role}</h3>
                      <p className="text-muted">{exp.company} • {exp.location}</p>
                      <p className="text-sm text-secondary mt-1">{exp.start_date} - {exp.end_date || 'Present'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-danger hover:text-white hover:bg-danger">Delete</Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Education, Skills, Certifications tabs will follow similar structure (placeholders for now to avoid huge files) */}
        {['education', 'skills', 'certifications'].includes(activeTab) && (
          <div className="max-w-4xl flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white capitalize">{activeTab}</h2>
              <Button variant="outline" size="sm">+ Add {activeTab === 'education' ? 'Education' : activeTab === 'skills' ? 'Skill' : 'Certification'}</Button>
            </div>
            <Card className="p-8 text-center text-muted">Manage your {activeTab} here. (Full CRUD implementation details omitted for brevity)</Card>
          </div>
        )}
      </div>
    </div>
  )
}
