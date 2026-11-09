import type { Activity, AppState } from '../lib/types';
import { navigate } from '../lib/router';
import { relativeTime } from '../lib/utils';

const ENTITY_HREF: Record<Activity['entityType'], (id: string) => string> = {
  customer: (id) => `/customers/${id}`,
  deal: (id) => `/deals/${id}`,
  task: () => '/tasks',
  rep: (id) => `/team/${id}`,
};

export function ActivityFeed({
  s,
  limit = 12,
  scope,
}: {
  s: AppState;
  limit?: number;
  scope?: { entityType: Activity['entityType']; entityId: string };
}) {
  const items = s.activities
    .filter((a) => (scope ? a.entityType === scope.entityType && a.entityId === scope.entityId : true))
    .slice(0, limit);
  if (items.length === 0) {
    return (
      <p className="muted-text small-text">
        {scope ? 'No activity recorded for this record yet. Edits and stage changes will appear here.' : 'No activity yet. Actions like deal moves and edits will show up here.'}
      </p>
    );
  }
  return (
    <div className="activity-list">
      {items.map((a) => (
        <div className="activity-item" key={a.id}>
          <span className="activity-dot" aria-hidden="true" />
          <button
            className="link-chip"
            style={{ color: 'var(--text-soft)', fontWeight: 550, flex: 1, textAlign: 'left', justifyContent: 'flex-start' }}
            onClick={() => navigate(ENTITY_HREF[a.entityType](a.entityId))}
          >
            {a.message}
          </button>
          <span className="activity-time">{relativeTime(a.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}
