import { useState, useEffect } from 'react';
import { Bell, Check, X, Award, Settings } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/api/notificationApi';
import { useNavigate } from 'react-router-dom';
import LoadingState from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(false);
  
  // Use real notification store with WebSocket
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchNotifications();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // Only run once on mount

  // WebSocket handles real-time updates, no need for polling

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Hôm qua';
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    await markAllAsRead();
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDeleteNotification = async (id: string) => {
    await deleteNotification(id);
  };

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    // Only mark as read, don't navigate
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !n.isRead;
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ACHIEVEMENT: return '🏆';
      case NotificationType.WORKOUT: return '💪';
      case NotificationType.STREAK: return '🔥';
      case NotificationType.SYSTEM: return '⚙️';
      case NotificationType.REMINDER: return '⏰';
      case NotificationType.SOCIAL: return '👥';
      case NotificationType.COACH_MESSAGE: return '💬';
      case NotificationType.BOOKING_CONFIRMED: return '✅';
      case NotificationType.BOOKING_CANCELLED: return '❌';
      case NotificationType.PROGRAM_UPDATE: return '📋';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ACHIEVEMENT: 
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300';
      case NotificationType.WORKOUT: 
        return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
      case NotificationType.STREAK: 
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300';
      case NotificationType.BOOKING_CONFIRMED:
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
      case NotificationType.BOOKING_CANCELLED:
        return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300';
      default: 
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return <LoadingState message="Đang tải thông báo..." fullScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Thông Báo
            </h1>
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleMarkAllAsRead}
              variant="ghost"
              disabled={loading || unreadCount === 0}
              className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline transition"
            >
              Đánh dấu tất cả đã đọc
            </Button>
            <button 
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{notifications.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tổng thông báo</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{unreadCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chưa đọc</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.filter(n => n.type === NotificationType.ACHIEVEMENT).length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Thành tựu</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
          {["All", "Unread"].map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium cursor-pointer relative transition ${
                activeTab === tab
                  ? "text-indigo-600 dark:text-indigo-400 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[3px] after:bg-indigo-600 dark:after:bg-indigo-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              {tab === 'All' ? 'Tất cả' : 'Chưa đọc'}
              {tab === 'Unread' && unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {activeTab === 'Unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {activeTab === 'Unread' ? 'Bạn đã đọc hết tất cả thông báo' : 'Thông báo mới sẽ xuất hiện ở đây'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`group flex items-start gap-4 p-5 rounded-xl border transition-all hover:shadow-md cursor-pointer ${
                  n.isRead 
                    ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" 
                    : "bg-indigo-50 dark:bg-indigo-950 border-indigo-100 dark:border-indigo-900"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${getNotificationColor(n.type)}`}>
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.isRead ? "text-gray-700 dark:text-gray-300" : "font-semibold text-gray-900 dark:text-white"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getRelativeTime(n.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id);
                      }}
                      className="p-1 text-gray-400 hover:text-green-600 transition opacity-0 group-hover:opacity-100"
                      title="Đánh dấu đã đọc"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(n.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100"
                    title="Xóa thông báo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {!n.isRead && (
                    <span className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}