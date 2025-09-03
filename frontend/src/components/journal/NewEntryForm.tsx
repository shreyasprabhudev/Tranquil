'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldValues } from 'react-hook-form';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const moodOptions = [
  { value: '😊', label: 'Happy' },
  { value: '😌', label: 'Peaceful' },
  { value: '😐', label: 'Neutral' },
  { value: '😢', label: 'Sad' },
  { value: '😡', label: 'Angry' },
  { value: '😴', label: 'Tired' },
  { value: '😨', label: 'Anxious' },
  { value: '😔', label: 'Reflective' },
  { value: '😤', label: 'Frustrated' },
  { value: '🤗', label: 'Grateful' },
];

const entryTypes = [
  { value: 'text', label: 'Text Entry' },
  { value: 'voice', label: 'Voice Note' },
  { value: 'quick', label: 'Quick Note' },
];

const validMoods = ['😊', '😌', '😐', '😢', '😡', '😴', '😨', '😔', '😤', '🤗'];

// Define the schema with required fields
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  mood: z.string()
    .refine((val) => validMoods.includes(val), {
      message: 'Please select a valid mood',
    })
    .transform(val => val as string), // Ensure string type
  entry_type: z.string(),
  is_private: z.boolean(),
  tags: z.string().optional(),
});

// Create a type that makes all fields required except for tags
type FormValues = {
  title: string;
  content: string;
  mood: string;
  entry_type: string;
  is_private: boolean;
  tags?: string;
};

interface NewEntryFormProps {
  onClose: () => void;
  onNewEntry: (entry: Omit<FormValues, 'tags'> & { word_count: number }) => Promise<void>;
  open: boolean;
}

export function NewEntryForm({ onClose, onNewEntry, open }: NewEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      mood: '😐', // Default to neutral emoji
      entry_type: 'text',
      is_private: true,
      tags: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!isAuthenticated) {
      console.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    try {
      // Call the parent's onNewEntry handler with the new entry data
      await onNewEntry({
        title: data.title,
        content: data.content,
        mood: data.mood,
        entry_type: data.entry_type,
        is_private: data.is_private,
        word_count: data.content.split(/\s+/).length,
      });
      
      // Reset form and close dialog on success
      form.reset();
      onClose();
      
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save journal entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Journal Entry</DialogTitle>
          <DialogDescription>
            Write about your thoughts, feelings, or experiences.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Give your entry a title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mood</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="How are you feeling?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {moodOptions.map((mood) => (
                          <SelectItem key={mood.value} value={mood.value}>
                            {mood.value} {mood.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="entry_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {entryTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Thoughts</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your thoughts here..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., work, personal, goals" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Entry'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
