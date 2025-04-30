'use client';

import { EditWorkspaceForm } from '@/features/workspaces/components/edit-workspace-form';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetWorkspace } from '@/features/workspaces/api/use-get-workspace';

import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';

export const WorkspaceIdSettingsClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: initialValues, isLoading } = useGetWorkspace({ workspaceId });

  if (isLoading) {
    return <PageLoader />;
  }

  if (!initialValues) {
    return <PageError message="Project not found" />;
  }

  return (
    <>
      <head>
        <title>Workspace Settings</title>
      </head>
      <div className="w-full lg:max-w-xl">
        <EditWorkspaceForm initialValues={initialValues} />
      </div>
    </>
  );
};
