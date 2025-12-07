import { useEffect, useState, useRef } from "react";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Star, Target, Calendar } from "lucide-react";
import { getAllPublicProgramsAPI, getPopularProgramsAPI, getProgramStatsAPI } from "./api";
import type { Program } from "@/types/program";
import { Link } from "react-router-dom";
import LoadingState from "@/components/LoadingState";
import { Button } from "@/components/ui/button";

export default function ExploreWorkouts() {
  const [search, setSearch] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [popularPrograms, setPopularPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"programs" | "coaches">("programs");
  const popularScrollRef = useRef<HTMLDivElement>(null);
  const recommendedScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const [allPrograms, popular] = await Promise.all([
          getAllPublicProgramsAPI(),
          getPopularProgramsAPI(6)
        ]);
        setPrograms(allPrograms);
        setPopularPrograms(popular);
      } catch (err) {
        console.error("Failed to load programs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  const filteredPrograms = programs.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  // Recommended programs (filtered programs excluding popular ones)
  const popularIds = new Set(popularPrograms.map(p => p.id));
  const recommendedPrograms = filteredPrograms.filter(p => !popularIds.has(p.id)).slice(0, 6);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 300;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getGoalLabel = (goal: string) => {
    const labels: Record<string, string> = {
      WEIGHT_LOSS: "Giảm cân",
      MUSCLE_GAIN: "Tăng cơ",
      STRENGTH: "Tăng sức mạnh",
      ENDURANCE: "Tăng sức bền",
      FLEXIBILITY: "Tăng độ dẻo",
      GENERAL_FITNESS: "Thể lực tổng quát"
    };
    return labels[goal] || goal;
  };

  const ProgramCard = ({ program }: { program: Program }) => {
    const [stats, setStats] = useState<{ averageRating: number; totalRatings: number } | null>(null);
    const mediaUrl = program.mediaList?.[0]?.url || "https://placehold.co/400x300/1a1a1a/white?text=Workout";
    
    useEffect(() => {
      const fetchStats = async () => {
        try {
          const statsData = await getProgramStatsAPI(program.id);
          setStats(statsData);
        } catch (err) {
          console.error("Failed to load stats:", err);
        }
      };
      fetchStats();
    }, [program.id]);

    return (
      <Link
        to={`/explore/${program.id}`}
        className="group block rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 w-[260px] flex-shrink-0 border border-gray-100 dark:border-gray-700"
      >
        <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
          <img
            src={mediaUrl}
            alt={program.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          {/* Goal badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
              <Target className="w-2.5 h-2.5" />
              {getGoalLabel(program.goal || "GENERAL_FITNESS")}
            </span>
          </div>

          {/* Public badge */}
          {program.visibility === 'PUBLIC' && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-0.5 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-lg">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                </svg>
                Công khai
              </span>
            </div>
          )}

          {/* Title overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-bold text-base line-clamp-2 mb-1.5 drop-shadow-lg">
              {program.title}
            </h3>
            {program.createdByName && (
              <div className="flex items-center gap-1.5 text-gray-200">
                <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-medium drop-shadow">{program.createdByName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          {program.description && (
            <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2 mb-3">
              {program.description}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="font-bold">{stats?.averageRating?.toFixed(1) || "0.0"}</span>
              </div>
              <span className="text-gray-400">·</span>
              <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-semibold">{program.durationWeeks}w</span>
              </div>
            </div>
            <div className="flex items-center text-red-600 dark:text-red-500 font-medium text-xs group-hover:translate-x-0.5 transition-transform">
              Chi tiết
              <svg className="w-3.5 h-3.5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="flex items-center gap-8 mb-6">
            <button
              onClick={() => setActiveTab("programs")}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                activeTab === "programs"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white font-semibold"
                  : "border-transparent text-gray-500 dark:text-gray-400"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Chương trình</span>
            </button>
            <button
              onClick={() => setActiveTab("coaches")}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                activeTab === "coaches"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white font-semibold"
                  : "border-transparent text-gray-500 dark:text-gray-400"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Huấn luyện viên</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm chương trình hoặc bài tập..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border-0 rounded-full focus:ring-2 focus:ring-red-500 focus:outline-none dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
            >
              <SlidersHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20">
          <LoadingState message="Đang tải chương trình..." />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
          {/* Popular Programs - Only show if there are programs */}
          {popularPrograms.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Chương trình phổ biến</h2>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => scroll(popularScrollRef, 'left')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => scroll(popularScrollRef, 'right')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div 
                ref={popularScrollRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
              >
                {popularPrograms.map((program) => <ProgramCard key={program.id} program={program} />)}
              </div>
            </section>
          )}

          {/* Recommended For You */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Đề xuất cho bạn</h2>
              <div className="flex gap-2">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => scroll(recommendedScrollRef, 'left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => scroll(recommendedScrollRef, 'right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div 
              ref={recommendedScrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
            >
              {recommendedPrograms.length > 0 ? (
                recommendedPrograms.map((program) => <ProgramCard key={program.id} program={program} />)
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Chưa có đề xuất nào</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
