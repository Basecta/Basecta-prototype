interface MetricCardProps {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export function MetricCard({ title, onClick, children }: MetricCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-8 h-80 flex flex-col ${
        onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      <h3 className="text-xl font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="flex-1 flex items-center justify-center">{children}</div>
    </div>
  );
}
