import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, Trash2, Plus, TrendingUp, Pause, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { WorkoutSessionResponse, SessionExerciseLogResponse } from './type';
import { AddExerciseModal } from './AddExerciseModal';
import * as workoutApi from './api';

interface WorkoutDetailViewProps {
  session: WorkoutSessionResponse;
  logs: SessionExerciseLogResponse[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  // Timer props for active workouts
  isActive?: boolean;
  elapsedTime?: number;
  isPaused?: boolean;
  onPauseResume?: () => void;
  onFinishWorkout?: () => void;
}

export const WorkoutDetailView = ({ 
  session, 
  logs, 
  onBack, 
  onDelete,
  onRefresh,
  isActive = false,
  elapsedTime = 0,
  isPaused = false,
  onPauseResume,
  onFinishWorkout
}: WorkoutDetailViewProps) => {
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingLog, setEditingLog] = useState<SessionExerciseLogResponse | null>(null);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [exerciseNames, setExerciseNames] = useState<{ [key: string]: string }>({});
  const [exerciseTypes, setExerciseTypes] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);

  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

  // Validate session
  useEffect(() => {
    if (!session || !session.id) {
      setError('Session không hợp lệ');
      console.error('Invalid session:', session);
    }
  }, [session]);

  // Fetch tên bài tập khi component mount
  useEffect(() => {
    const fetchExerciseNames = async () => {
      try {
        const exercises = await workoutApi.getAllExercises();
        const names: { [key: string]: string } = {};
        const types: { [key: string]: string } = {};
        exercises.forEach(ex => {
          names[ex.id] = ex.name;
          types[ex.id] = ex.exerciseType || 'WEIGHT_AND_REPS';
        });
        setExerciseNames(names);
        setExerciseTypes(types);
      } catch (err) {
        console.error('Không thể tải tên bài tập:', err);
      } finally {
        setLoadingNames(false);
      }
    };
    fetchExerciseNames();
  }, []);

  const groupLogsByExercise = () => {
    const grouped: { [exerciseId: string]: SessionExerciseLogResponse[] } = {};
    logs.forEach(log => {
      if (!grouped[log.exerciseId]) {
        grouped[log.exerciseId] = [];
      }
      grouped[log.exerciseId].push(log);
    });
    return grouped;
  };

  const calculateExerciseVolume = (exerciseLogs: SessionExerciseLogResponse[]) => {
    return exerciseLogs.reduce((total, log) => {
      return total + (log.volume || 0);
    }, 0);
  };

  const calculateTotalVolume = () => {
    return logs.reduce((total, log) => {
      return total + (log.volume || 0);
    }, 0);
  };

  const handleDeleteLog = async (logId: string) => {
    setDeleteLogId(logId);
  };
  
  const confirmDeleteLog = async () => {
    if (!deleteLogId) return;
    try {
      await workoutApi.deleteLog(deleteLogId);
      toast.success('Xóa set thành công');
      setDeleteLogId(null);
      onRefresh();
    } catch (err) {
      console.error('Không thể xóa log:', err);
      toast.error('Không thể xóa set. Vui lòng thử lại.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exerciseGroups = groupLogsByExercise();
  const totalVolume = calculateTotalVolume();
  const totalSets = logs.length;

  // Show error if session is invalid
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={onBack}>Quay lại</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className={`${isActive ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'} text-white`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">
                {isActive ? `🏋️ ${generateWorkoutName(session)}` : generateWorkoutName(session)}
              </h1>
              {isActive && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-4xl font-bold font-mono">
                      {formatElapsedTime(elapsedTime)}
                    </div>
                    <div className="text-sm text-white/70">
                      {isPaused ? 'Đã tạm dừng' : 'Đang chạy'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(session.sessionDate)}</span>
              </div>
              {!isActive && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{session.durationMinutes} phút</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/70 text-sm mb-1">Tổng Sets</p>
              <p className="text-3xl font-bold">{totalSets}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/70 text-sm mb-1">Bài Tập</p>
              <p className="text-3xl font-bold">{Object.keys(exerciseGroups).length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/70 text-sm mb-1">Tổng Volume</p>
              <p className="text-3xl font-bold">
                {totalVolume > 0 ? `${totalVolume.toFixed(0)}` : '0'}
                {totalVolume > 0 && <span className="text-lg ml-1">kg</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          {isActive ? (
            <>
              <Button
                onClick={() => setShowAddExercise(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Thêm Bài Tập
              </Button>
              <Button
                onClick={onPauseResume}
                variant="outline"
                className="border-2"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Tiếp Tục
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Tạm Dừng
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowFinishConfirm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Kết Thúc
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setShowAddExercise(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Thêm Bài Tập
              </Button>
              <Button
                onClick={() => onDelete(session.id)}
                variant="outline"
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>

        {/* Notes */}
        {session.notes && (
          <Card className="p-4 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Ghi chú:</strong> {session.notes}
            </p>
          </Card>
        )}

        {/* Exercise List */}
        {Object.keys(exerciseGroups).length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Chưa có bài tập nào trong buổi này
            </p>
            <Button onClick={() => setShowAddExercise(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" />
              Thêm Bài Tập Đầu Tiên
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(exerciseGroups).map(([exerciseId, exerciseLogs]) => {
              const volume = calculateExerciseVolume(exerciseLogs);
              const sortedLogs = [...exerciseLogs].sort((a, b) => a.setNumber - b.setNumber);

              return (
                <Card key={exerciseId} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {exerciseNames[exerciseId] || `Bài Tập #${exerciseId.slice(0, 8)}`}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{sortedLogs.length} sets</span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {volume > 0 ? `${volume.toFixed(0)} kg` : 'No volume'}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingLog(sortedLogs[0]);
                        setShowAddExercise(true);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Sets Table */}
                  <div className="space-y-2">
                    {(() => {
                      const exerciseType = exerciseTypes[exerciseId] || 'WEIGHT_AND_REPS';
                      
                      switch (exerciseType) {
                        case 'WEIGHT_AND_REPS':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-2">PREVIOUS</div>
                              <div className="col-span-3">KG</div>
                              <div className="col-span-3">REPS</div>
                              <div className="col-span-1">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        case 'BODYWEIGHT_REPS':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-2">PREVIOUS</div>
                              <div className="col-span-3">(+KG)</div>
                              <div className="col-span-3">REPS</div>
                              <div className="col-span-1">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        case 'REPS_ONLY':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-3">PREVIOUS</div>
                              <div className="col-span-5">REPS</div>
                              <div className="col-span-1">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        case 'TIME_BASED':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-3">PREVIOUS</div>
                              <div className="col-span-5">TIME</div>
                              <div className="col-span-1">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        case 'DISTANCE_BASED':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-3">PREVIOUS</div>
                              <div className="col-span-5">DISTANCE</div>
                              <div className="col-span-1">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        case 'WEIGHT_AND_TIME':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-2">PREVIOUS</div>
                              <div className="col-span-3">KG</div>
                              <div className="col-span-3">TIME</div>
                              <div className="col-span-1">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        case 'ASSISTED_BODYWEIGHT':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-2">PREVIOUS</div>
                              <div className="col-span-3">BODY WEIGHT</div>
                              <div className="col-span-3">REPS</div>
                              <div className="col-span-1">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        default:
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-2">PREVIOUS</div>
                              <div className="col-span-3">KG</div>
                              <div className="col-span-3">REPS</div>
                              <div className="col-span-1">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                      }
                    })()}

                    {sortedLogs.map((log, index) => {
                      const exerciseType = exerciseTypes[exerciseId] || 'WEIGHT_AND_REPS';
                      const previousLog = index > 0 ? sortedLogs[index - 1] : null;
                      
                      switch (exerciseType) {
                        case 'WEIGHT_AND_REPS':
                          return (
                            <div
                              key={log.id}
                              className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                                {previousLog ? `${previousLog.weightUsed || 0} × ${previousLog.repsDone || 0}` : '—'}
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="number" 
                                  step="0.5"
                                  value={log.weightUsed || 0}
                                  className="w-full p-1 bg-transparent border-none text-center text-sm"
                                  readOnly
                                />
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="number"
                                  value={log.repsDone || 0}
                                  className="w-full p-1 bg-transparent border-none text-center text-sm"
                                  readOnly
                                />
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                          
                        case 'BODYWEIGHT_REPS':
                          return (
                            <div
                              key={log.id}
                              className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                                {previousLog ? `+${previousLog.weightUsed || 0} × ${previousLog.repsDone || 0}` : '—'}
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="number" 
                                  step="0.5"
                                  value={log.weightUsed || 0}
                                  className="w-full p-1 bg-transparent border-none text-center text-sm"
                                  readOnly
                                />
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="number"
                                  value={log.repsDone || 0}
                                  className="w-full p-1 bg-transparent border-none text-center text-sm"
                                  readOnly
                                />
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                          
                        case 'REPS_ONLY':
                          return (
                            <div
                              key={log.id}
                              className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">
                                {previousLog ? `${previousLog.repsDone || 0}` : '—'}
                              </div>
                              <div className="col-span-5">
                                <input 
                                  type="number"
                                  value={log.repsDone || 0}
                                  className="w-full p-1 bg-transparent border-none text-center text-sm"
                                  readOnly
                                />
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                          
                        case 'TIME_BASED':
                          return (
                            <div
                              key={log.id}
                              className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">
                                {previousLog ? `${previousLog.durationSeconds || 0}s` : '—'}
                              </div>
                              <div className="col-span-5 flex items-center">
                                <input 
                                  type="number"
                                  value={log.durationSeconds || 0}
                                  className="w-full p-1 bg-transparent border-none text-center text-sm"
                                  readOnly
                                />
                                <span className="text-sm text-gray-500 ml-1">s</span>
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                          
                        default:
                          return (
                            <div
                              key={log.id}
                              className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-7 text-gray-700 dark:text-gray-300">
                                {log.displayValue || `${log.weightUsed || 0} kg × ${log.repsDone || 0}`}
                              </div>
                              <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400">
                                {log.volume && log.volume > 0 ? `${log.volume.toFixed(0)} kg` : '-'}
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                      }
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Exercise Modal */}
      {showAddExercise && (
        <AddExerciseModal
          sessionId={session.id}
          editingLog={editingLog}
          onClose={() => {
            setShowAddExercise(false);
            setEditingLog(null);
          }}
          onSuccess={() => {
            setShowAddExercise(false);
            setEditingLog(null);
            onRefresh();
          }}
        />
      )}

      {/* Delete Log Confirmation Dialog */}
      <Dialog open={deleteLogId !== null} onOpenChange={() => setDeleteLogId(null)}>
        <DialogContent className="bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Xác nhận xóa set
            </DialogTitle>
            <DialogDescription className="text-slate-700">
              Bạn có chắc chắn muốn xóa set này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteLogId(null)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              onClick={confirmDeleteLog}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
            >
              Xóa set
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finish Workout Confirmation Dialog */}
      <Dialog open={showFinishConfirm} onOpenChange={setShowFinishConfirm}>
        <DialogContent className="bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Kết thúc buổi tập
            </DialogTitle>
            <DialogDescription className="text-slate-700">
              Bạn có chắc chắn muốn kết thúc buổi tập này không? Thời gian tập luyện sẽ được lưu lại.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowFinishConfirm(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Tiếp tục tập
            </Button>
            <Button
              onClick={() => {
                setShowFinishConfirm(false);
                if (onFinishWorkout) onFinishWorkout();
              }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
            >
              Kết thúc
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
