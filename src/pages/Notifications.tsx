import { useMemo, useState } from 'react';
import { Badge, EmptyState, PageHeader, Segmented } from '../components/ui';
import { deleteNotification, markAllNotificationsRead, markNotificationRead, useAppState } from '../lib/store';
import type { NotificationType } from '../lib/types';
import { relativeTime } from '../lib/utils';
import { navigate } from '../lib/router';
import { successToast } from '../lib/toast';

const TYPE_META: Record<NotificationType, { icon: string; label: string }> = {
  'task-assigned': { icon: '✓', label: 'Task assigned' },
  'task-overdue': { icon: '⏰', label: 'Task overdue' },
  'deal-assigned': { icon: '⚑', label: 'Deal assigned' },
  'deal-stage': { icon: '⇉', label: 'Stage updated' },
  'deal-won': { icon: '🏆', label: 'Deal won' },
  'deal-lost': { icon: '✕', label: 'Deal lost' },
};

export function NotificationsPage() {
  const s = useAppState();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const items = useMemo(
    () => s.notifications.filter((n) => (filter === 'unread' ? !n.read : true)),
    [s, filter],
  );
  const unread = s.notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Task assignments, overdue tasks and deal updates across the workspace."
        actions={
          <>
            <button
              className="btn btn-ghost"
              disabled={unread === 0}
              onClick={() => {
                markAllNotificationsRead();
                successToast('All notifications marked read');
              }}
            >
              Mark all read
            </button>
          </>
        }
      />

      <div className="toolbar">
        <Segmented
          ariaLabel="Notification filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `All (${s.notifications.length})` },
            { value: 'unread', label: `Unread (${unread})` },
          ]}
        />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {items.length === 0 ? (
          <EmptyState
            icon={filter === 'unread' ? '🎉' : '🔔'}
            title={filter === 'unread' ? 'All caught up' : 'No notifications yet'}
            hint={
              filter === 'unread'
                ? 'You have read every notification.'
                : 'Notifications appear when tasks are assigned, become overdue, or a deal changes stage or outcome.'
            }
          />
        ) : (
          <div>
            {items.map((n) => {
              const meta = TYPE_META[n.type];
              return (
                <div
                  key={n.id}
                  className={`notif-item ${n.read ? '' : 'unread'}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!n.read) markNotificationRead(n.id);
                    navigate(n.link);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!n.read) markNotificationRead(n.id);
                      navigate(n.link);
                    }
                  }}
                  aria-label={`${n.title}: ${n.message}. Open related page.`}
                >
                  <span className="notif-icon" aria-hidden="true">
                    {meta.icon}
                  </span>
                  <div className="notif-body">
                    <div className="notif-title-line">
                      {!n.read && <span className="unread-dot" aria-hidden="true" />}
                      <span className="notif-title">{n.title}</span>
                      <Badge tone={n.type === 'deal-won' ? 'success' : n.type === 'deal-lost' || n.type === 'task-overdue' ? 'danger' : 'neutral'}>
                        {meta.label}
                      </Badge>
                    </div>
                    <div className="notif-msg">{n.message}</div>
                  </div>
                  <span className="notif-time">{relativeTime(n.createdAt)}</span>
                  <button
                    className="icon-btn danger"
                    title="Dismiss"
                    aria-label="Dismiss notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
