interface AlertMessageProps {
  type: 'error' | 'success';
  message: string;
}

export function AlertMessage({ type, message }: AlertMessageProps) {
  const styles =
    type === 'error'
      ? 'bg-red-100 border-red-400 text-red-700'
      : 'bg-green-100 border-green-400 text-green-700';

  return (
    <div className={`border ${styles} px-4 py-3 rounded text-sm`}>{message}</div>
  );
}
