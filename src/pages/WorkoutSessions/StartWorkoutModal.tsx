import { useState, useEffect } from 'react';
import { X, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import * as workoutApi from './api';
import { getProgramExercisesAPI } from '@/api/programAPI';
import type { WorkoutProgramResponse } from './type';

interface StartWorkoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const StartWorkoutModal = ({ onClose, onSuccess }: StartWorkoutModalProps) => {
  const [programs, setPrograms] = useState<WorkoutProgramResponse[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoadingPrograms(true);
    try {
      const data = await workoutApi.getAllPrograms();
      setPrograms(data);
    } catch (err) {
      console.error('Không thể tải chương trình:', err);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      // 1. Tạo session
      console.log('Creating session with program:', selectedProgram);
      const newSession = await workoutApi.createSession({
        programId: selectedProgram || undefined,
        sessionDate: new Date().toISOString(),
        durationMinutes: 0, // Will be updated when workout finishes
        notes: notes || undefined
      });
      console.log('Session created:', newSession);
      
      // 2. Nếu chọn chương trình, tự động thêm tất cả bài tập vào session
      if (selectedProgram) {
        try {
          console.log('Fetching exercises for program:', selectedProgram);
          const programExercises = await getProgramExercisesAPI(selectedProgram);
          console.log('Program exercises:', programExercises);
          
          if (programExercises && programExercises.length > 0) {
            let successCount = 0;
            let failCount = 0;
            
            // Thêm từng bài tập vào session
            for (const programExercise of programExercises) {
              console.log('Adding exercise:', programExercise);
              // Tạo log rỗng cho mỗi set
              for (let setNum = 1; setNum <= programExercise.sets; setNum++) {
                try {
                  const logData: any = {
                    exerciseId: programExercise.exercise.id,
                    setNumber: setNum,
                    repsDone: parseInt(programExercise.reps) || 0,
                    weightUsed: 0,
                  };
                  console.log(`Creating log for set ${setNum}:`, logData);
                  await workoutApi.createLog(newSession.id, logData);
                  successCount++;
                } catch (logErr: any) {
                  failCount++;
                  console.error(`Failed to create log for set ${setNum}:`, logErr);
                  if (logErr.response?.status === 401) {
                    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                  }
                }
              }
            }
            
            if (successCount > 0) {
              toast.success(`Đã thêm ${programExercises.length} bài tập (${successCount} sets) từ chương trình!`);
            }
            if (failCount > 0) {
              toast.warning(`Có ${failCount} sets không thể thêm được.`);
            }
          } else {
            toast.info('Chương trình không có bài tập nào.');
          }
        } catch (err: any) {
          console.error('Không thể thêm bài tập từ chương trình:', err);
          if (err.message?.includes('đăng nhập')) {
            toast.error(err.message);
            return; // Dừng luôn, không save localStorage
          } else {
            toast.error('Đã tạo buổi tập nhưng không thể thêm bài tập từ chương trình.');
          }
        }
      }
      
      // 3. Save to localStorage for persistence
      localStorage.setItem('activeWorkout', JSON.stringify(newSession));
      localStorage.setItem('workoutStartTime', Date.now().toString());
      
      onSuccess();
    } catch (err: any) {
      console.error('Không thể tạo buổi tập:', err);
      if (err.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        toast.error('Lỗi khi tạo buổi tập. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Bắt Đầu Tập
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tạo buổi tập mới
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Program Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chương trình (tùy chọn)
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={loadingPrograms}
              >
                <option value="">
                  {loadingPrograms ? 'Đang tải...' : 'Chọn chương trình hoặc bỏ qua'}
                </option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>
                    {program.title || program.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Leg day, Upper body..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            {/* Quick Start Templates */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">⚡ Bắt đầu nhanh:</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setNotes('Upper Body')}
                  className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                >
                   Upper Body
                </button>
                <button
                  onClick={() => setNotes('Lower Body')}
                  className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                >
                   Lower Body
                </button>
                <button
                  onClick={() => setNotes('Full Body')}
                  className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                >
                   Full Body
                </button>
                <button
                  onClick={() => setNotes('Cardio')}
                  className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                >
                   Cardio
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleStart}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {loading ? 'Đang tạo...' : 'Bắt Đầu Ngay'}
              </Button>
              <Button onClick={onClose} variant="outline" size="lg">
                Hủy
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
