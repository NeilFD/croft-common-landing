import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const MAX = 250;

const CommonGoodMessage = () => {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') || '';
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Add Your Message | Common Good Fund';
  }, []);

  const remaining = useMemo(() => MAX - message.length, [message.length]);

  const handlePost = async () => {
    if (!sessionId) {
      toast({ title: 'Missing session', description: 'Payment session not found', duration: 2500 });
      return;
    }
    if (message.trim().length === 0) {
      toast({ title: 'Write a note', description: 'Tell us why you gave (max 250 characters)', duration: 2500 });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('post-common-good-message', {
        body: { session_id: sessionId, message },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Thanks', description: 'Your message has been posted', duration: 2000 });
      setTimeout(() => navigate('/community'), 1200);
    } catch (e: any) {
      toast({ title: 'Could not post', description: e.message || 'Please try again', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6 max-w-2xl">
            <h1 className="font-brutalist text-4xl md:text-5xl mb-6 text-foreground">Say a few words</h1>
            <p className="font-industrial text-foreground/70 mb-6">Why you added to the Common Good (optional). Keep it short.</p>
            <Textarea
              maxLength={MAX}
              rows={5}
              placeholder="250 characters max"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="font-industrial text-sm text-muted-foreground">{remaining} characters left</span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => navigate('/community')}>Cancel</Button>
                <Button onClick={handlePost} disabled={loading}>{loading ? 'Posting…' : 'Post message'}</Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CommonGoodMessage;
