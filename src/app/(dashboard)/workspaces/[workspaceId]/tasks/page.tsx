import { getCurrent } from '@/features/auth/queries';
import { TaskViewSwitcher } from '@/features/tasks/components/task-view-switcher';
import { redirect } from 'next/navigation';

const TasksPage = async () => {
  const user = await getCurrent();
  if (!user) redirect('/sign-in');

  return (
    <>
      <head>
        <title>TaskMaster | My Task</title>
      </head>
      <div className="h-full flex flex-col">
        <TaskViewSwitcher />
      </div>
    </>
  );
};

export default TasksPage;
