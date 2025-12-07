import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeeklyProgressChartProps {
  data: { week: string; volume: number; workouts: number; duration: number }[];
}

export default function WeeklyProgressChart({ data }: WeeklyProgressChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorWorkouts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="week"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Area 
          type="monotone" 
          dataKey="volume" 
          name="Volume (kg)"
          stroke="#6366f1" 
          fillOpacity={1} 
          fill="url(#colorVolume)" 
        />
        <Area 
          type="monotone" 
          dataKey="workouts" 
          name="Buổi tập"
          stroke="#10b981" 
          fillOpacity={1} 
          fill="url(#colorWorkouts)" 
        />
        <Area 
          type="monotone" 
          dataKey="duration" 
          name="Thời gian (phút)"
          stroke="#a855f7" 
          fillOpacity={1} 
          fill="url(#colorDuration)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
