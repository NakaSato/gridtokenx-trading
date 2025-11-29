export default function PoolMetricStats() {
  const stats = [
    { label: 'Total Users', data: '100000' },
    { label: 'Total TVL', data: '$100000000' },
    { label: 'Total Volume', data: '$100000000' },
    { label: 'Total Fees', data: '$100000000' },
    { label: 'Total Trades', data: '$10000000' },
  ]
  return (
    <div className="flex w-full space-x-4">
      {stats.map((stat, idx) => (
        <div className="flex w-32 flex-col justify-center space-y-2" key={idx}>
          <span className="text-sm text-secondary-foreground">
            {stat.label}
          </span>
          <span className="text-foreground">{stat.data}</span>
        </div>
      ))}
    </div>
  )
}
