import { Award, Zap, Trophy } from "lucide-react";

interface Achievement {
  icon: typeof Award;
  title: string;
  desc: string;
  unlocked: boolean;
}

interface AchievementsProps {
  achievements?: Achievement[];
}

export function Achievements({ achievements }: AchievementsProps) {
  const defaultAchievements: Achievement[] = [
    { icon: Award, title: "Người mới", desc: "Hoàn thành workout đầu tiên", unlocked: true },
    { icon: Zap, title: "7 ngày liên tiếp", desc: "Tập 7 ngày không nghỉ", unlocked: true },
    { icon: Trophy, title: "Chiến binh", desc: "Hoàn thành 50 workouts", unlocked: false },
  ];

  const items = achievements || defaultAchievements;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl mt-4 shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden transition-colors">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Award size={18} className="text-blue-600 dark:text-blue-400" />
          Thành tựu
        </h3>
        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Xem tất cả</span>
      </div>
      <div className="p-4 flex gap-3 overflow-x-auto">
        {items.map((ach, i) => (
          <div key={i} className={`flex-shrink-0 w-24 text-center p-3 rounded-xl ${ach.unlocked ? "bg-blue-50 dark:bg-blue-950" : "bg-slate-100 dark:bg-gray-700 opacity-50"}`}>
            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${ach.unlocked ? "bg-blue-600 dark:bg-blue-700" : "bg-slate-300 dark:bg-gray-600"}`}>
              <ach.icon size={18} className="text-white" />
            </div>
            <p className="text-xs font-medium text-slate-800 dark:text-white truncate">{ach.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
