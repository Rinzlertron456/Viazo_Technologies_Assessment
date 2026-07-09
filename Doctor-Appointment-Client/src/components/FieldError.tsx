export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-red-600 mt-1">{message}</p>;
}
