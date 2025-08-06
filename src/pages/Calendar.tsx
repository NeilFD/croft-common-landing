import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid3X3 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, isSameMonth, isSameDay, parseISO } from 'date-fns';

// Sample events data - in a real app this would come from a database
const sampleEvents = [
  {
    id: 1,
    title: "Wine Tasting: Natural Wines",
    date: "2025-01-15",
    time: "19:00",
    description: "Limited to 12 people",
    category: "tasting"
  },
  {
    id: 2,
    title: "Live Jazz: The Quartet",
    date: "2025-01-18",
    time: "20:30",
    description: "Intimate session",
    category: "gig"
  },
  {
    id: 3,
    title: "Chef's Table",
    date: "2025-01-22",
    time: "18:00",
    description: "Secret menu preview",
    category: "food"
  },
  {
    id: 4,
    title: "Coffee Cupping",
    date: "2025-01-25",
    time: "10:00",
    description: "Single origin exploration",
    category: "tasting"
  }
];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week'>('month');

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewType === 'month') {
      setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : addMonths(prev, -1));
    } else {
      setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : addWeeks(prev, -1));
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayEvents = sampleEvents.filter(event => 
          isSameDay(parseISO(event.date), cloneDay)
        );

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] border border-border p-2 ${
              !isSameMonth(day, monthStart) ? 'text-muted-foreground bg-muted/20' : 'bg-background'
            }`}
          >
            <span className={`text-sm font-medium ${
              isSameDay(day, new Date()) ? 'text-primary font-bold' : ''
            }`}>
              {format(cloneDay, dateFormat)}
            </span>
            <div className="mt-1 space-y-1">
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className="text-xs bg-primary/10 text-primary p-1 rounded border-l-2 border-primary"
                >
                  <div className="font-medium">{event.title}</div>
                  <div className="text-muted-foreground">{event.time}</div>
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {/* Days header */}
        <div className="grid grid-cols-7 bg-muted/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-medium text-muted-foreground border-r border-border last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div>
          {rows}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayEvents = sampleEvents.filter(event => 
        isSameDay(parseISO(event.date), day)
      );

      weekDays.push(
        <div key={day.toString()} className="flex-1 border-r border-border last:border-r-0">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">{format(day, 'EEE')}</div>
              <div className={`text-lg font-medium ${
                isSameDay(day, new Date()) ? 'text-primary font-bold' : ''
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          </div>
          <div className="min-h-[400px] p-2 space-y-2">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className="bg-primary/10 text-primary p-3 rounded border-l-4 border-primary"
              >
                <div className="font-medium text-sm">{event.time}</div>
                <div className="font-bold">{event.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{event.description}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="flex">
          {weekDays}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-brutalist text-4xl md:text-6xl mb-6 text-foreground">
            What's Next?
          </h1>
          <div className="max-w-3xl mx-auto space-y-4 text-foreground/70">
            <p className="font-industrial text-lg leading-relaxed">
              The good stuff lands here first.
            </p>
            <p className="font-industrial text-lg leading-relaxed">
              Gigs. Tastings. Talks. Takeovers. Secret menus.
            </p>
            <p className="font-industrial text-lg leading-relaxed">
              Some you'll see on the posters. Some you'll only find here.
            </p>
            <p className="font-industrial text-lg leading-relaxed">
              Quiet heads-up. Limited numbers. No fanfare. Just first access, if you're paying attention.
            </p>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="font-industrial text-xl font-medium min-w-[200px] text-center">
              {viewType === 'month' 
                ? format(currentDate, 'MMMM yyyy')
                : `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
              }
            </h2>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewType === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('month')}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Month
            </Button>
            <Button
              variant={viewType === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('week')}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Week
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <div className="mb-16">
          {viewType === 'month' ? renderMonthView() : renderWeekView()}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Calendar;