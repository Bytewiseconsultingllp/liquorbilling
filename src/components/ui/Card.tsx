export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 ${className}`}
    >
      {children}
    </div>
  )
}