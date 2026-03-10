interface PageLayoutProps {
  children: React.ReactNode;
  variant?: 'blue' | 'emerald';
}

export function PageLayout({ children, variant = 'blue' }: PageLayoutProps) {
  const gradient =
    variant === 'emerald'
      ? 'bg-gradient-to-br from-emerald-50 to-teal-100'
      : 'bg-gradient-to-br from-blue-50 to-indigo-100';

  return <div className={`min-h-screen ${gradient}`}>{children}</div>;
}
