'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useChartAbsensi } from '@/hooks/useDashboard'
import { useKelasList } from '@/hooks/useKelas'
import { TrendingUp } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  hadir:     { label: 'Hadir',     color: '#10b981' },
  terlambat: { label: 'Terlambat', color: '#f59e0b' },
  izin:      { label: 'Izin',      color: '#60a5fa' },
  sakit:     { label: 'Sakit',     color: '#fb923c' },
  alpha:     { label: 'Alpha',     color: '#f87171' },
}

function TrenTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">
        Kehadiran: <span className="font-semibold text-emerald-600">{payload[0]?.value}%</span>
      </p>
      <p className="text-muted-foreground">
        Total: {payload[0]?.payload?.hadir}/{payload[0]?.payload?.total} murid
      </p>
    </div>
  )
}

/** Persentase satu desimal, mis. 42.9 */
const persenDari = (jumlah: number, total: number) =>
  total > 0 ? Math.round((jumlah / total) * 1000) / 10 : 0

function DistribusiTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-foreground">{STATUS_CONFIG[item.status]?.label}</p>
      <p className="text-muted-foreground">
        {item.jumlah} absensi · {persenDari(item.jumlah, total)}%
      </p>
    </div>
  )
}

function ChartSkeleton({ height = 200 }: { height?: number }) {
  return <div className="animate-pulse rounded-lg bg-muted" style={{ height }} />
}

export default function ChartAbsensi() {
  const [kelasId, setKelasId] = useState<number | undefined>(undefined)

  const { data, isLoading } = useChartAbsensi(kelasId)
  const { data: kelasPaginated } = useKelasList({ is_aktif: true })
  const kelasList = kelasPaginated?.data ?? []

  const totalDistribusi = data?.distribusi.reduce((s, d) => s + d.jumlah, 0) ?? 0

  const selectItems = [
    { value: '', label: 'Semua Kelas' },
    ...kelasList.map((k) => ({ value: String(k.id), label: k.nama })),
  ]

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select
          value={kelasId !== undefined ? String(kelasId) : ''}
          onValueChange={(v) => setKelasId(v === '' ? undefined : Number(v))}
          items={selectItems}
        >
          <SelectTrigger size="sm" className="w-44">
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            {selectItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tren 6 Bulan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Tren Kehadiran (6 Bulan)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data?.tren.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.tren} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="bulan"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<TrenTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="persen"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Belum ada data absensi
              </p>
            )}
          </CardContent>
        </Card>

        {/* Distribusi Status Bulan Ini */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Distribusi Status Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : totalDistribusi > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie
                      data={data!.distribusi.filter((d) => d.jumlah > 0)}
                      dataKey="jumlah"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      strokeWidth={2}
                    >
                      {data!.distribusi
                        .filter((d) => d.jumlah > 0)
                        .map((entry) => (
                          <Cell
                            key={entry.status}
                            fill={STATUS_CONFIG[entry.status]?.color ?? '#94a3b8'}
                          />
                        ))}
                    </Pie>
                    <Tooltip content={<DistribusiTooltip total={totalDistribusi} />} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="flex-1 min-w-0 space-y-2">
                  {data!.distribusi.map((d) => (
                    <li key={d.status} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm"
                          style={{ background: STATUS_CONFIG[d.status]?.color }}
                        />
                        <span className="text-foreground">{STATUS_CONFIG[d.status]?.label}</span>
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        <span className="font-medium text-foreground">{persenDari(d.jumlah, totalDistribusi)}%</span>
                        {' '}({d.jumlah})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Belum ada data absensi bulan ini
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
