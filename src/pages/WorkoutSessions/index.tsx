import { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, Plus, Dumbbell, PlayCircle, CheckCircle } from 'lucide-react';
import * as workoutApi from '@/pages/WorkoutSessions/api';
import type { WorkoutSessionResponse, SessionExerciseLogResponse } from '@/pages/WorkoutSessions/type';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkoutDetailView } from './WorkoutDetailView';
import { StartWorkoutModal } from './StartWorkoutModal';
import LoadingState from '@/components/LoadingState';
import { toast } from 'sonner';

const WorkoutSessionsPage = () => {
  const [sessions, setSessions] = useState<WorkoutSessionResponse[]>([]);
  const [selectedSession, setSelectedSession] = useState<WorkoutSessionResponse | null>(null);
  const [logs, setLogs] = useState<SessionExerciseLogResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'active'>('history');
  const [showStartWorkout, setShowStartWorkout] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  
  // Active workout tracking
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSessionResponse | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState<number>(0); // Total paused duration in seconds
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds

  useEffect(() => {
    fetchSessions();
    // Load active workout from localStorage and verify with server
    const savedActiveWorkout = localStorage.getItem('activeWorkout');
    const savedStartTime = localStorage.getItem('workoutStartTime');
    if (savedActiveWorkout && savedStartTime) {
      const workout = JSON.parse(savedActiveWorkout);
      
      // Verify session ownership by fetching from server
      workoutApi.getSessionById(workout.id)
        .then((serverSession) => {
          // Session exists and user has access, restore it
          setActiveWorkout(serverSession);
          setWorkoutStartTime(parseInt(savedStartTime));
          setActiveTab('active');
        })
        .catch((err) => {
          // Session doesn't exist or user doesn't have access
          console.warn('Active workout session no longer accessible:', err);
          localStorage.removeItem('activeWorkout');
          localStorage.removeItem('workoutStartTime');
          toast.error('Buổi tập trước đó không còn khả dụng. Vui lòng bắt đầu buổi tập mới.');
        });
    }
  }, []);

  // Timer effect - count elapsed time when workout is active and not paused
  useEffect(() => {
    if (!workoutStartTime || isWorkoutPaused) return;
    
    const interval = setInterval(() => {
      const totalElapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
      const activeElapsed = totalElapsed - pausedTime;
      setElapsedTime(activeElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [workoutStartTime, isWorkoutPaused, pausedTime]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await workoutApi.getAllSessions();
      setSessions(data);
    } catch (err) {
      console.error('Không thể tải danh sách buổi tập:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (sessionId: string) => {
    try {
      console.log('Fetching logs for session:', sessionId);
      const data = await workoutApi.getLogsBySession(sessionId);
      console.log('Logs received:', data);
      setLogs(data);
    } catch (err: any) {
      console.error('Không thể tải logs:', err);
      if (err.response?.status === 400) {
        toast.error('Session không hợp lệ. Vui lòng thử lại.');
        setSelectedSession(null);
      }
      setLogs([]);
    }
  };

  const handleSelectSession = async (session: WorkoutSessionResponse) => {
    console.log('Selected session:', session);
    setSelectedSession(session);
    await fetchLogs(session.id);
  };

  const handleDeleteSession = async (id: string) => {
    setDeleteSessionId(id);
  };
  
  const confirmDeleteSession = async () => {
    if (!deleteSessionId) return;
    try {
      await workoutApi.deleteSession(deleteSessionId);
      await fetchSessions();
      if (selectedSession?.id === deleteSessionId) {
        setSelectedSession(null);
        setLogs([]);
      }
      toast.success('Xóa buổi tập thành công');
      setDeleteSessionId(null);
    } catch (err) {
      console.error('Không thể xóa buổi tập:', err);
      toast.error('Không thể xóa buổi tập. Vui lòng thử lại.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', { 
        weekday: 'short',
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      });
    }
  };

  // Generate workout session name like Strong app
  const generateWorkoutName = (session: WorkoutSessionResponse) => {
    const sessionDate = new Date(session.sessionDate);
    const timeOfDay = sessionDate.getHours();
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = dayNames[sessionDate.getDay()];
    
    // Time-based prefixes
    let timePrefix = '';
    if (timeOfDay >= 5 && timeOfDay < 12) {
      timePrefix = 'Sáng';
    } else if (timeOfDay >= 12 && timeOfDay < 17) {
      timePrefix = 'Chiều';
    } else if (timeOfDay >= 17 && timeOfDay < 21) {
      timePrefix = 'Tối';
    } else {
      timePrefix = 'Đêm';
    }

    // Use notes if available and descriptive
    if (session.notes && session.notes.trim().length > 0) {
      const notes = session.notes.trim();
      // Common workout types that should be highlighted
      const workoutTypes = ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Full Body', 'Cardio', 'HIIT', 'Strength'];
      const foundType = workoutTypes.find(type => 
        notes.toLowerCase().includes(type.toLowerCase())
      );
      
      if (foundType) {
        return `${foundType} - ${timePrefix} ${dayName}`;
      } else if (notes.length <= 25) {
        return `${notes} - ${timePrefix}`;
      }
    }

    // Fallback to time-based naming
    return `${timePrefix} ${dayName}`;
  };

  const groupSessionsByDate = () => {
    const grouped: { [key: string]: WorkoutSessionResponse[] } = {};
    sessions.forEach(session => {
      const dateKey = new Date(session.sessionDate).toLocaleDateString('vi-VN');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    return grouped;
  };

  const handlePauseResume = () => {
    if (isWorkoutPaused) {
      // Resuming - add paused duration
      if (pauseStartTime) {
        const pauseDuration = Math.floor((Date.now() - pauseStartTime) / 1000);
        setPausedTime(prev => prev + pauseDuration);
        setPauseStartTime(null);
      }
      setIsWorkoutPaused(false);
    } else {
      // Pausing - record pause start time
      setPauseStartTime(Date.now());
      setIsWorkoutPaused(true);
    }
  };

  const handleFinishWorkout = async () => {
    if (!activeWorkout) return;
    
    try {
      // Refresh session from server first to ensure ownership
      let currentSession = activeWorkout;
      try {
        currentSession = await workoutApi.getSessionById(activeWorkout.id);
      } catch (err: any) {
        if (err.response?.status === 403 || err.response?.status === 404) {
          // Session no longer accessible
          localStorage.removeItem('activeWorkout');
          localStorage.removeItem('workoutStartTime');
          setActiveWorkout(null);
          setWorkoutStartTime(null);
          toast.error('Buổi tập không còn khả dụng. Vui lòng bắt đầu buổi tập mới.');
          await fetchSessions();
          setActiveTab('history');
          return;
        }
        throw err;
      }
      
      // Calculate actual duration in minutes
      const durationMinutes = Math.floor(elapsedTime / 60);
      
      // Update session with actual duration - only send valid request fields
      const updateData: {
        programId?: string;
        sessionDate: string;
        durationMinutes: number;
        notes?: string;
      } = {
        sessionDate: currentSession.sessionDate,
        durationMinutes: durationMinutes || 1, // At least 1 minute
      };
      
      // Only include optional fields if they exist
      if (currentSession.programId) {
        updateData.programId = currentSession.programId;
      }
      if (currentSession.notes) {
        updateData.notes = currentSession.notes;
      }
      
      await workoutApi.updateSession(currentSession.id, updateData);
      
      // Clear active workout
      localStorage.removeItem('activeWorkout');
      localStorage.removeItem('workoutStartTime');
      setActiveWorkout(null);
      setWorkoutStartTime(null);
      setElapsedTime(0);
      setIsWorkoutPaused(false);
      
      // Refresh sessions and switch to history
      await fetchSessions();
      setActiveTab('history');
      
      toast.success(`Buổi tập hoàn thành! Thời gian: ${durationMinutes} phút`, {
        duration: 5000,
      });
    } catch (err) {
      console.error('Không thể kết thúc buổi tập:', err);
      toast.error('Lỗi khi kết thúc buổi tập. Vui lòng thử lại.');
    }
  };

  // Show active workout detail view
  if (activeWorkout && activeTab === 'active') {
    return (
      <WorkoutDetailView
        session={activeWorkout}
        logs={logs}
        onBack={() => setActiveTab('history')}
        onDelete={handleDeleteSession}
        onRefresh={async () => {
          fetchSessions();
          await fetchLogs(activeWorkout.id);
        }}
        isActive={true}
        elapsedTime={elapsedTime}
        isPaused={isWorkoutPaused}
        onPauseResume={handlePauseResume}
        onFinishWorkout={handleFinishWorkout}
      />
    );
  }

  // Show selected session detail view
  if (selectedSession) {
    return (
      <WorkoutDetailView
        session={selectedSession}
        logs={logs}
        onBack={() => {
          setSelectedSession(null);
          setLogs([]);
        }}
        onDelete={handleDeleteSession}
        onRefresh={() => {
          fetchSessions();
          fetchLogs(selectedSession.id);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header với Stats */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lịch Tập Luyện</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý và theo dõi buổi tập của bạn</p>
            </div>
            <div className="flex items-center gap-3">
              {activeWorkout && (
                <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium font-mono">
                    {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              <Button
                onClick={() => setShowStartWorkout(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                size="lg"
                disabled={!!activeWorkout}
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                {activeWorkout ? 'Đang Tập...' : 'Bắt Đầu Tập'}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{sessions.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tổng buổi tập</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {sessions.filter(s => new Date(s.sessionDate).toDateString() === new Date().toDateString()).length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hôm nay</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {sessions.slice(0, 7).length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">7 ngày qua</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Lịch Sử
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Đang Tập
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            {loading && <LoadingState message="Đang tải lịch tập..." />}

            {!loading && sessions.length === 0 && (
              <Card className="p-12 text-center">
                <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Chưa có buổi tập nào
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Bắt đầu ghi lại hành trình thể hình của bạn
                </p>
                <Button onClick={() => setShowStartWorkout(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Tạo Buổi Tập Đầu Tiên
                </Button>
              </Card>
            )}

            {!loading && sessions.length > 0 && (
              <div className="space-y-6">
                {Object.entries(groupSessionsByDate())
                  .sort(([dateA], [dateB]) => {
                    // Sắp xếp theo ngày giảm dần (mới nhất trên cùng)
                    const dateObjA = new Date(dateA.split('/').reverse().join('-'));
                    const dateObjB = new Date(dateB.split('/').reverse().join('-'));
                    return dateObjB.getTime() - dateObjA.getTime();
                  })
                  .map(([date, daySessions]) => (
                    <div key={date}>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                        {formatDate(daySessions[0].sessionDate)}
                      </h3>
                      <div className="space-y-3">
                        {daySessions
                          .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
                          .map((session) => (
                          <Card
                            key={session.id}
                            className="p-5 cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                            onClick={() => handleSelectSession(session)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <Dumbbell className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                      {generateWorkoutName(session)}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {new Date(session.sessionDate).toLocaleTimeString('vi-VN', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6 ml-15">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                      {session.durationMinutes} phút
                                    </span>
                                  </div>
                                  
                                  {session.notes && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                        {session.notes}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-gray-600"
                              >
                                Xem chi tiết →
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {activeWorkout ? (
              <Card
                className="p-6 cursor-pointer hover:shadow-xl hover:border-green-400 dark:hover:border-green-600 transition-all border-2 border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                onClick={async () => {
                  await fetchLogs(activeWorkout.id);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse">
                        <Dumbbell className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-xl">
                          🏋️ {generateWorkoutName(activeWorkout)}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Bắt đầu lúc {new Date(activeWorkout.sessionDate).toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 ml-[68px]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-lg font-bold text-green-700 dark:text-green-300 font-mono">
                          {Math.floor(elapsedTime / 3600) > 0 
                            ? `${Math.floor(elapsedTime / 3600)}:${Math.floor((elapsedTime % 3600) / 60).toString().padStart(2, '0')}:${(elapsedTime % 60).toString().padStart(2, '0')}`
                            : `${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60).toString().padStart(2, '0')}`
                          }
                        </span>
                      </div>
                      
                      {isWorkoutPaused && (
                        <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
                          ⏸ Đã tạm dừng
                        </div>
                      )}

                      {activeWorkout.notes && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                            {activeWorkout.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700 font-semibold"
                  >
                    Xem chi tiết →
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <PlayCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Không có buổi tập đang diễn ra
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Bắt đầu một buổi tập mới để theo dõi tiến độ
                </p>
                <Button onClick={() => setShowStartWorkout(true)} className="bg-blue-600 hover:bg-blue-700">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Bắt Đầu Tập Ngay
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Start Workout Modal */}
      {showStartWorkout && (
        <StartWorkoutModal
          onClose={() => setShowStartWorkout(false)}
          onSuccess={async () => {
            setShowStartWorkout(false);
            await fetchSessions();
            // Reload active workout
            const savedActiveWorkout = localStorage.getItem('activeWorkout');
            const savedStartTime = localStorage.getItem('workoutStartTime');
            if (savedActiveWorkout && savedStartTime) {
              const workout = JSON.parse(savedActiveWorkout);
              setActiveWorkout(workout);
              setWorkoutStartTime(parseInt(savedStartTime));
              // Fetch logs for the new session
              await fetchLogs(workout.id);
              setActiveTab('active');
            }
          }}
        />
      )}

      {/* Delete Session Confirmation Dialog */}
      <Dialog open={deleteSessionId !== null} onOpenChange={() => setDeleteSessionId(null)}>
        <DialogContent className="bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Xác nhận xóa buổi tập
            </DialogTitle>
            <DialogDescription className="text-slate-700">
              Bạn có chắc chắn muốn xóa buổi tập này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteSessionId(null)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              onClick={confirmDeleteSession}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
            >
              Xóa buổi tập
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutSessionsPage;