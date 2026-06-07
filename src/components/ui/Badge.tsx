interface BadgeProps {
  status: 'draft' | 'applied' | 'interview' | 'rejected' | 'offer' | 'accepted' | 'withdrawn'
  className?: string
}

const labels: Record<string, string> = {
  draft: 'Draft',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  offer: 'Offer',
  accepted: 'Accepted',
  withdrawn: 'Withdrawn',
}

export default function Badge({ status, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${status} ${className}`}>
      <span className="badge-dot" />
      {labels[status] ?? status}
    </span>
  )
}
