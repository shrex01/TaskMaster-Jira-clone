import { DATABASE_ID, IMAGES_BUCKET_ID, PROJECTS_ID, TASKS_ID } from '@/config';
import { getMember } from '@/features/members/utils';
import { sessionMiddleware } from '@/lib/session-middleware';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { ID, Query } from 'node-appwrite';
import { z } from 'zod';
import { createProjectSchema, updateProjectSchema } from '../schema';
import { Project } from '../types';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { TaskStatus } from '@/features/tasks/types';

const app = new Hono()
  .post('/', sessionMiddleware, zValidator('form', createProjectSchema), async (c) => {
    const databases = c.get('databases');
    const user = c.get('user');
    const storage = c.get('storage');

    const { name, image, workspaceId } = c.req.valid('form');

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: 'Only members can create a new project' }, 401);
    }

    let uploadedImageUrl: string | undefined;
    let imageFileId: string | undefined; // New variable to store the file ID

    if (image instanceof File) {
      const file = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), image);
      imageFileId = file.$id; // Save the file ID for later use

      const arrayBuffer = await storage.getFilePreview(IMAGES_BUCKET_ID, file.$id);

      uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
    }

    const project = await databases.createDocument(DATABASE_ID, PROJECTS_ID, ID.unique(), {
      name,
      imageUrl: uploadedImageUrl,
      imageFileId,
      workspaceId,
    });

    return c.json({ data: project });
  })
  .get(
    '/',
    sessionMiddleware,
    zValidator('query', z.object({ workspaceId: z.string() })),
    async (c) => {
      const user = c.get('user');
      const databases = c.get('databases');

      const { workspaceId } = c.req.valid('query');

      if (!workspaceId) {
        return c.json({ error: 'Missing workspaceId' }, 400);
      }
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: 'Unauthorized access to projects' }, 400);
      }

      const projects = await databases.listDocuments<Project>(DATABASE_ID, PROJECTS_ID, [
        Query.equal('workspaceId', workspaceId),
        Query.orderDesc('$createdAt'),
      ]);

      return c.json({ data: projects });
    }
  )
  .get('/:projectId', sessionMiddleware, async (c) => {
    const user = c.get('user');
    const databases = c.get('databases');
    const { projectId } = c.req.param();

    const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);

    const member = await getMember({
      databases,
      workspaceId: project.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({ data: project });
  })
  .patch('/:projectId', sessionMiddleware, zValidator('form', updateProjectSchema), async (c) => {
    const databases = c.get('databases');
    const storage = c.get('storage');
    const user = c.get('user');

    const { projectId } = c.req.param();
    const { name, image } = c.req.valid('form');

    const existingProject = await databases.getDocument<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      projectId
    );

    const member = await getMember({
      databases,
      workspaceId: existingProject.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let uploadedImageUrl: string | undefined;
    let newFileId: string | undefined = existingProject.imageFileId;

    if (image instanceof File) {
      if (image instanceof File) {
        if (existingProject.imageFileId) {
          await storage.deleteFile(IMAGES_BUCKET_ID, existingProject.imageFileId);
        }
      }

      const file = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), image);

      newFileId = file.$id;

      const arrayBuffer = await storage.getFilePreview(IMAGES_BUCKET_ID, file.$id);

      uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
    } else if (image === undefined) {
      if (existingProject.imageFileId) {
        await storage.deleteFile(IMAGES_BUCKET_ID, existingProject.imageFileId);
      }
      newFileId = undefined;
      uploadedImageUrl = undefined;
    } else {
      uploadedImageUrl = image;
    }

    console.log('DEBUG: Updating project with:', {
      name,
      uploadedImageUrl,
      newFileId,
    });

    const project = await databases.updateDocument(DATABASE_ID, PROJECTS_ID, projectId, {
      name,
      imageUrl: uploadedImageUrl === undefined ? null : uploadedImageUrl,
      imageFileId: newFileId === undefined ? null : newFileId,
    });
    return c.json({ data: project });
  })
  .delete('/:projectId', sessionMiddleware, async (c) => {
    const databases = c.get('databases');
    const user = c.get('user');
    const { projectId } = c.req.param();

    try {
      // Fetch the existing project
      const existingProject = await databases.getDocument<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        projectId
      );

      if (!existingProject) {
        return c.json({ error: 'Project not found' }, 404);
      }

      // Check user permissions
      const member = await getMember({
        databases,
        workspaceId: existingProject.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Fetch tasks associated with the project
      const tasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
        Query.equal('projectId', projectId),
      ]);

      // Delete all tasks related to the project
      for (const task of tasks.documents) {
        await databases.deleteDocument(DATABASE_ID, TASKS_ID, task.$id);
      }

      // Delete the project itself
      await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId);

      return c.json({ data: { $id: projectId } });
    } catch (error) {
      return c.json({ error: 'Failed to delete project', details: JSON.stringify(error) }, 500);
    }
  })

  .get('/:projectId/analytics', sessionMiddleware, async (c) => {
    const databases = c.get('databases');
    const user = c.get('user');
    const { projectId } = c.req.param();

    const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);

    const member = await getMember({
      databases,
      workspaceId: project.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthTasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.greaterThan('$createdAt', thisMonthStart.toISOString()),
      Query.lessThan('$createdAt', thisMonthEnd.toISOString()),
    ]);

    const lastMonthTasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.greaterThan('$createdAt', lastMonthStart.toISOString()),
      Query.lessThan('$createdAt', lastMonthEnd.toISOString()),
    ]);

    const taskCount = thisMonthTasks.total;
    const taskDifference = taskCount - lastMonthTasks.total;

    const thisMonthAssignedTasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.equal('assigneeId', member.$id),
      Query.greaterThan('$createdAt', thisMonthStart.toISOString()),
      Query.lessThan('$createdAt', thisMonthEnd.toISOString()),
    ]);
    const lastMonthAssignedTasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.equal('assigneeId', member.$id),
      Query.greaterThan('$createdAt', lastMonthStart.toISOString()),
      Query.lessThan('$createdAt', lastMonthEnd.toISOString()),
    ]);

    const assignedTaskCount = thisMonthAssignedTasks.total;
    const assignedTaskDifferance = assignedTaskCount - lastMonthAssignedTasks.total;

    const thisMonthIncompleteTasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.notEqual('status', TaskStatus.DONE),
      Query.greaterThanEqual('$createdAt', thisMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', thisMonthEnd.toISOString()),
    ]);

    const lastMonthIncompleteTasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.notEqual('status', TaskStatus.DONE),
      Query.greaterThanEqual('$createdAt', lastMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', lastMonthEnd.toISOString()),
    ]);

    const incompleteTaskCount = thisMonthIncompleteTasks.total;
    const incompleteTaskDifferance = incompleteTaskCount - lastMonthIncompleteTasks.total;

    const thisMonthCompleteTasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.equal('status', TaskStatus.DONE),
      Query.greaterThanEqual('$createdAt', thisMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', thisMonthEnd.toISOString()),
    ]);
    const lastMonthCompleteTasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.equal('status', TaskStatus.DONE),
      Query.greaterThanEqual('$createdAt', lastMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', lastMonthEnd.toISOString()),
    ]);

    const completeTaskCount = thisMonthCompleteTasks.total;
    const completeTaskDifferance = completeTaskCount - lastMonthCompleteTasks.total;

    const thisMonthOverdueTasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.notEqual('status', TaskStatus.DONE),
      Query.lessThan('dueDate', now.toISOString()),
      Query.greaterThanEqual('$createdAt', thisMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', thisMonthEnd.toISOString()),
    ]);

    const lastMonthOverdueTasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.notEqual('status', TaskStatus.DONE),
      Query.lessThan('dueDate', now.toISOString()),
      Query.greaterThanEqual('$createdAt', lastMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', lastMonthEnd.toISOString()),
    ]);

    const OverdueTaskCount = thisMonthOverdueTasks.total;
    const OverdueTaskDifferance = OverdueTaskCount - lastMonthOverdueTasks.total;

    return c.json({
      data: {
        taskCount,
        taskDifference,
        assignedTaskCount,
        assignedTaskDifferance,
        completeTaskCount,
        completeTaskDifferance,
        incompleteTaskCount,
        incompleteTaskDifferance,
        OverdueTaskCount,
        OverdueTaskDifferance,
      },
    });
  });

export default app;
