    export function Table({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
      <table className="w-full text-sm text-left text-gray-700">
        {children}
      </table>
    </div>
  )
}