import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { utcToLocalDatetimeString, localDatetimeStringToUtc } from "@/lib/timezone-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSpaces } from "@/hooks/useSpaces";
import { useCreateBooking, useUpdateBooking, type Booking } from "@/hooks/useBookings";
import { Loader2 } from "lucide-react";

const bookingSchema = z.object({
  space_id: z.string().min(1, "Space is required"),
  title: z.string().min(1, "Title is required"),
  start_ts: z.string().min(1, "Start time is required"),
  end_ts: z.string().min(1, "End time is required"),
  setup_min: z.number().min(0, "Setup time must be positive").default(0),
  teardown_min: z.number().min(0, "Teardown time must be positive").default(0),
}).refine((data) => {
  return new Date(data.start_ts) < new Date(data.end_ts);
}, {
  message: "End time must be after start time",
  path: ["end_ts"],
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  booking?: Booking; // For editing existing bookings
  initialDate?: Date;
  initialHour?: number;
  selectedSpaceId?: string;
  leadId?: string; // For converting leads to bookings
}

export const BookingForm = ({
  isOpen,
  onClose,
  booking,
  initialDate,
  initialHour,
  selectedSpaceId,
  leadId,
}: BookingFormProps) => {
  const { data: spaces = [] } = useSpaces();
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking(booking?.id || "");

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      space_id: selectedSpaceId || booking?.space_id || "",
      title: booking?.title || "",
      start_ts: booking?.start_ts 
        ? utcToLocalDatetimeString(booking.start_ts)
        : (initialDate && initialHour !== undefined
          ? format(new Date(initialDate.setHours(initialHour, 0)), "yyyy-MM-dd'T'HH:mm")
          : ""),
      end_ts: booking?.end_ts
        ? utcToLocalDatetimeString(booking.end_ts)
        : (initialDate && initialHour !== undefined
          ? format(new Date(initialDate.setHours(initialHour + 1, 0)), "yyyy-MM-dd'T'HH:mm")
          : ""),
      setup_min: booking?.setup_min || 0,
      teardown_min: booking?.teardown_min || 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (booking) {
        // Reset form with existing booking data
        form.reset({
          space_id: booking.space_id,
          title: booking.title,
          start_ts: utcToLocalDatetimeString(booking.start_ts),
          end_ts: utcToLocalDatetimeString(booking.end_ts),
          setup_min: booking.setup_min || 0,
          teardown_min: booking.teardown_min || 0,
        });
      } else {
        // Reset form for new bookings
        form.reset({
          space_id: selectedSpaceId || "",
          title: "",
          start_ts: initialDate && initialHour !== undefined
            ? format(new Date(initialDate.setHours(initialHour, 0)), "yyyy-MM-dd'T'HH:mm")
            : "",
          end_ts: initialDate && initialHour !== undefined
            ? format(new Date(initialDate.setHours(initialHour + 1, 0)), "yyyy-MM-dd'T'HH:mm")
            : "",
          setup_min: 0,
          teardown_min: 0,
        });
      }
    }
  }, [isOpen, booking, initialDate, initialHour, selectedSpaceId, form]);

  const onSubmit = async (data: BookingFormData) => {
    try {
      if (booking) {
        // Update existing booking
        await updateBooking.mutateAsync({
          title: data.title,
          start_ts: localDatetimeStringToUtc(data.start_ts),
          end_ts: localDatetimeStringToUtc(data.end_ts),
          setup_min: data.setup_min,
          teardown_min: data.teardown_min,
        });
      } else {
        // Create new booking
        await createBooking.mutateAsync({
          space_id: data.space_id,
          lead_id: leadId || null,
          title: data.title,
          start_ts: localDatetimeStringToUtc(data.start_ts),
          end_ts: localDatetimeStringToUtc(data.end_ts),
          setup_min: data.setup_min,
          teardown_min: data.teardown_min,
        });
      }
      onClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error("Booking form error:", error);
    }
  };

  const isLoading = createBooking.isPending || updateBooking.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background border-2 border-foreground shadow-brutal">
        <DialogHeader>
          <DialogTitle className="font-brutalist text-xl font-bold uppercase">
            {booking ? "Edit Booking" : "Create New Booking"}
          </DialogTitle>
          <DialogDescription className="font-industrial">
            {booking 
              ? "Update the booking details below"
              : "Fill in the details to create a new booking"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Space Selection */}
            <FormField
              control={form.control}
              name="space_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-industrial font-bold text-foreground uppercase">Space</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!booking} // Can't change space for existing bookings
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background border-2 border-foreground font-industrial">
                        <SelectValue placeholder="Select a space" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background border-2 border-foreground shadow-brutal">
                      {spaces.map((space) => (
                        <SelectItem key={space.id} value={space.id} className="font-industrial">
                          {space.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-industrial font-bold text-foreground uppercase">Booking Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Corporate Event, Wedding Reception"
                      className="border-2 border-foreground font-industrial"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_ts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-industrial font-bold text-foreground uppercase">Start Date & Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="border-2 border-foreground font-industrial"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_ts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-industrial font-bold text-foreground uppercase">End Date & Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="border-2 border-foreground font-industrial"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Buffer Times */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="setup_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-industrial font-bold text-foreground uppercase">Setup Time (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        className="border-2 border-foreground font-industrial"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teardown_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-industrial font-bold text-foreground uppercase">Teardown Time (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        className="border-2 border-foreground font-industrial"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="border-2 border-foreground font-industrial font-bold"
              >
                CANCEL
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-accent text-accent-foreground hover:bg-accent/80 border-2 border-foreground font-industrial font-bold"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {booking ? "UPDATE BOOKING" : "CREATE BOOKING"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};