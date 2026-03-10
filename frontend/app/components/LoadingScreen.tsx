interface LoadingScreenProps {
  variant?: 'blue' | 'emerald';
}

export function LoadingScreen({ variant = 'blue' }: LoadingScreenProps) {
  const gradient =
    variant === 'emerald'
      ? 'from-emerald-50 to-teal-100'
      : 'from-blue-50 to-indigo-100';

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${gradient}`}>
      <div className="text-gray-600 text-lg">Loading...</div>
    </div>
  );
}
