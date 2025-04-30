import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { TaskStatus } from '@/features/tasks/types';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        [TaskStatus.TODO]: 'border-transparent bg-rose-500 text-white hover:bg-rose-500/80', // More vibrant red
        [TaskStatus.IN_PROGRESS]:
          'border-transparent bg-amber-500 text-white hover:bg-amber-500/80', // Bright orange for progress
        [TaskStatus.IN_REVIEW]: 'border-transparent bg-sky-500 text-white hover:bg-sky-500/80', // Softer blue for reviews
        [TaskStatus.BACKLOG]: 'border-transparent bg-gray-500 text-white hover:bg-gray-500/80', // Neutral but clear backlog
        [TaskStatus.DONE]: 'border-transparent bg-emerald-500 text-white hover:bg-emerald-500/80', // Fresh green for completion
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
