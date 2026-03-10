interface SectionCardProps {
  children: React.ReactNode;
  /** Extra Tailwind classes — use this for margin, overflow, custom padding overrides, etc. */
  className?: string;
  /** Padding class. Defaults to 'p-6'. */
  padding?: string;
}

export function SectionCard({ children, className = '', padding = 'p-6' }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-lg ${padding} ${className}`}>{children}</div>
  );
}
