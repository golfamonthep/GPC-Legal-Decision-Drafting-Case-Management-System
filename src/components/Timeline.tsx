import { Activity } from "../types";
import { CheckCircle } from "lucide-react";

interface TimelineProps {
  activities: Activity[];
}

export function Timeline({ activities }: TimelineProps) {
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center ring-8 ring-white">
                    <CheckCircle className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-slate-500">
                      {activity.action} <span className="font-medium text-slate-900">โดย {activity.actor}</span>
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-slate-500">
                    <time dateTime={activity.timestamp}>{activity.timestamp}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
