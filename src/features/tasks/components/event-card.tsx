import { Project } from '@/features/projects/types';
import { TaskStatus } from '../types';
import { cn } from '@/lib/utils';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useRouter } from 'next/navigation';
import { Member } from '@/features/members/types';

interface EventCardProps {
  id: string;
  title: string;
  assignee: Member;
  project: Project;
  status: TaskStatus;
}

const statuscolorMap: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: 'border-l-gray-500', // Neutral backlog tone
  [TaskStatus.TODO]: 'border-l-rose-500', // Vibrant red for urgency
  [TaskStatus.IN_PROGRESS]: 'border-l-amber-500', // Bright orange for active tasks
  [TaskStatus.IN_REVIEW]: 'border-l-sky-500', // Softer blue for reviewing
  [TaskStatus.DONE]: 'border-l-emerald-500', // Fresh green for completion
};

export const EventCard = ({ id, title, assignee, project, status }: EventCardProps) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    router.push(`/workspaces/${workspaceId}/tasks/${id}`);
  };

  return (
    <div className="px-2">
      <div
        onClick={onClick}
        className={cn(
          'p-1.5 text-sm bg-white text-primary border rounded-md border-l-4 flex flex-col gap-y-1.5 cursor-pointer hover:opacity-75 transition',
          statuscolorMap[status]
        )}
      >
        <p className="line-clamp-3">{title}</p>

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-x-1 gap-y-1">
          <div className="flex items-center gap-x-1">
            <MemberAvatar name={assignee?.name} />
            <div className="size-1 rounded-full bg-neutral-300" />
          </div>

          {/* Project Avatar below on small screens, inline on larger screens */}
          <div className="sm:ml-2">
            <ProjectAvatar name={project?.name} image={project?.imageUrl} />
          </div>
        </div>
      </div>
    </div>
  );
};
