import { type ReactNode, useState, useEffect, useRef } from 'react'

interface SplitPaneProps {
  left: ReactNode
  right: ReactNode
  minLeftWidth?: number // in px
  minRightWidth?: number // in px
  defaultSplit?: number // 0 to 1 percentage
}

export default function SplitPane({
  left,
  right,
  minLeftWidth = 300,
  minRightWidth = 300,
  defaultSplit = 0.5,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [split, setSplit] = useState(defaultSplit)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!isDragging) return

    function handleMouseMove(e: MouseEvent) {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newSplit = (e.clientX - rect.left) / rect.width
      
      const leftWidth = newSplit * rect.width
      const rightWidth = (1 - newSplit) * rect.width

      if (leftWidth >= minLeftWidth && rightWidth >= minRightWidth) {
        setSplit(newSplit)
      }
    }

    function handleMouseUp() {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, minLeftWidth, minRightWidth])

  return (
    <div ref={containerRef} className="flex w-full h-full relative overflow-hidden">
      <div style={{ width: `${split * 100}%` }} className="h-full overflow-hidden">
        {left}
      </div>
      <div
        className="cursor-col-resize h-full"
        style={{
          width: isDragging ? '6px' : '4px',
          background: isDragging ? 'var(--accent-primary)' : 'var(--border-default)',
          transition: 'background var(--transition-fast)',
        }}
        onMouseDown={() => setIsDragging(true)}
      />
      <div style={{ width: `${(1 - split) * 100}%` }} className="h-full overflow-hidden">
        {right}
      </div>
    </div>
  )
}
