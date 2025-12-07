import { useEffect, useState } from 'react';
import LoadingState from '@/components/LoadingState';
import { Users, Calendar, TrendingUp, Activity, UserPlus, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { getCoachStatsAPI, type CoachStatsResponse } from '@/api/coachApi';
import { toast } from 'sonner';

export default function CoachDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CoachStatsResponse>({
    totalClients: 0,
    activeClients: 0,
    totalPrograms: 0,
    totalWorkoutsSessions: 0,
    avgClientProgress: 0,
    newClientsThisMonth: 0,
    activeProgramsAssigned: 0,
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getCoachStatsAPI();
        setStats(data);
      } catch (error) {
        console.error("Failed to load coach stats:", error);
        toast.error("Không thể tải thống kê");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingState />;

  const statCards = [
    {
      title: "Tổng học viên",
      value: stats.totalClients,
      icon: <Users className="w-7 h-7" />,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50"
    },
    {
      title: "Học viên hoạt động",
      value: stats.activeClients,
      icon: <TrendingUp className="w-7 h-7" />,
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-50 to-green-50"
    },
    {
      title: "Chương trình tạo",
      value: stats.totalPrograms,
      icon: <Calendar className="w-7 h-7" />,
      gradient: "from-slate-600 to-slate-700",
      bgGradient: "from-slate-50 to-gray-50"
    },
    {
      title: "Lịch hẹn thành công",
      value: stats.completedBookings,
      icon: <CheckCircle className="w-7 h-7" />,
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-50 to-purple-50"
    },
    {
      title: "Lịch hẹn đã hủy",
      value: stats.cancelledBookings,
      icon: <XCircle className="w-7 h-7" />,
      gradient: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-50 to-pink-50"
    },
    {
      title: "Tổng lịch hẹn",
      value: stats.totalBookings,
      icon: <BookOpen className="w-7 h-7" />,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 shadow-xl border border-slate-700">
          <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          <div className="relative">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Chào mừng Coach!
            </h1>
            <p className="text-slate-300 text-lg">
              Hãy tạo các chương trình tập luyện tuyệt vời cho học viên của bạn
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity`} />
              
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                </div>
                
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-2">
                    {card.title}
                  </p>
                  <p className={`text-4xl font-bold bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}>
                    {card.value}
                  </p>
                </div>
              </div>

              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Tiến độ học viên</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Tiến độ trung bình</span>
                <span className="text-2xl font-bold text-slate-900">
                  {stats.avgClientProgress.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(stats.avgClientProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 shadow-xl text-white">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <Activity className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Thống kê lịch hẹn</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Lịch hẹn thành công: <span className="font-bold text-white">{stats.completedBookings}</span></span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Lịch hẹn đã hủy: <span className="font-bold text-white">{stats.cancelledBookings}</span></span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Tổng lịch hẹn: <span className="font-bold text-white">{stats.totalBookings}</span></span>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Tỷ lệ thành công</span>
                  <span className="font-bold text-emerald-400">
                    {stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
