'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  mood: z.string()
    .refine((val) => validMoods.includes(val), {
      message: 'Please select a valid mood',
    })
    .default('😐'),
  entry_type: z.string().default('text'),
  is_private: z.boolean().default(true),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function NewEntryForm() {
  const [open, setOpen] = useState(false);
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

  const onSubmit = async (values: FormValues) => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a journal entry.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the auth token from localStorage
      const tokensStr = localStorage.getItem('authTokens');
      if (!tokensStr) {
        throw new Error('No authentication token found');
      }
      const tokens = JSON.parse(tokensStr);

      // Use the validated mood from form values
      const moodValue = values.mood;
      
      const requestBody = {
        title: values.title,
        content: values.content,
        mood: moodValue,
        entry_type: values.entry_type,
        is_private: values.is_private,
        tags: values.tags ? values.tags.split(',').filter(tag => tag.trim()).map(tag => tag.trim()) : [],
      };

      console.log('Sending request with body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('http://localhost:8000/api/entries/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => ({}));
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(`Failed to create journal entry: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
      }
      
      toast.success('Your journal entry has been saved.');
      
      // Close the dialog and reset the form
      setOpen(false);
      form.reset();
      
      // Refresh the page to show the new entry
      window.location.reload();
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast.error('Failed to save journal entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Journal Entry</DialogTitle>
          <DialogDescription>
            Take a moment to reflect on your day. What's on your mind?
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
                onClick={() => setOpen(false)}
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
