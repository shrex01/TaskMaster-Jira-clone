import { getCurrent } from '@/features/auth/queries';
import { redirect } from 'next/navigation';
import { TaskIdClient } from './client';

const TaskIdPage = async () => {
  const user = await getCurrent();
  if (!user) redirect('/sign-in');

  return (
    <>
      <head>
        <title>TaskMaster | Task Details</title>
      </head>
      <TaskIdClient />
    </>
  );
};

export default TaskIdPage;
