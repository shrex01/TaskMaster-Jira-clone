import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { TaskStatus } from "../types";
interface useGetTasksProps {
  workspaceId: string;
  projectId?: string | null;
  status?: TaskStatus | null;
  asigneeId?: string | null;
  dueDate?: string | null;
  search?: string | null;
}
export const useGetTasks = ({
  workspaceId,
  projectId,
  status,
  asigneeId,
  dueDate,
  search,
}: useGetTasksProps) => {
  const query = useQuery({
    queryKey: [
      "tasks",
      workspaceId,
      projectId,
      status,
      asigneeId,
      dueDate,
      search,
    ],
    queryFn: async () => {
      const response = await client.api.tasks.$get({
        query: {
          workspaceId,
          projectId: projectId ?? undefined,
          status: status ?? undefined,
          asigneeId: asigneeId ?? undefined,
          dueDate: dueDate ?? undefined,
          search: search ?? undefined,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const { data } = await response.json();
      return data;
    },
  });
  return query;
};
