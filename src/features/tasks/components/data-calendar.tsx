import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { enUS } from 'date-fns/locale';
import { addMonths, format, getDay, parse, startOfWeek, subMonths } from 'date-fns';
import { Task } from '../types';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './data-calendar.css';
import { EventCard } from './event-card';
import { CustomToolbar } from './custom-toolbar';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface DataCalendarProps {
  data: Task[];
}

export const DataCalendar = ({ data }: DataCalendarProps) => {
  const [value, setValue] = useState(data.length > 0 ? new Date(data[0].dueDate) : new Date());

  const events = data.map((task) => ({
    start: new Date(task.dueDate),
    end: new Date(task.dueDate),
    title: task.name,
    project: task.project,
    assignee: task.assignee,
    status: task.status,
    id: task.$id,
  }));

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    if (action === 'PREV') {
      setValue(subMonths(value, 1));
    } else if (action === 'NEXT') {
      setValue(addMonths(value, 1));
    } else if (action === 'TODAY') {
      setValue(new Date());
    }
  };

  // Function to highlight today's date
  const dayPropGetter = (date: Date) => {
    const today = new Date();

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return {
        className: 'rbc-today-cell',
      };
    }

    return {};
  };

  return (
    <div>
      <Calendar
        localizer={localizer}
        date={value}
        events={events}
        views={['month']}
        defaultView="month"
        toolbar={true}
        showAllEvents={true}
        className="h-full"
        max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
        formats={{
          weekdayFormat: (date, culture, localizer) =>
            localizer?.format(date, 'EEE', culture) ?? '',
        }}
        components={{
          eventWrapper: ({ event }) => (
            <EventCard
              id={event.id}
              title={event.title}
              assignee={event.assignee}
              project={event.project}
              status={event.status}
            />
          ),

          toolbar: () => <CustomToolbar date={value} onNavigate={handleNavigate} />,
        }}
        dayPropGetter={dayPropGetter}
      />
    </div>
  );
};
