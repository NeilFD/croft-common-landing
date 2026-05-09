import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import cbBgImage from '@/assets/den-bg-neon.jpg';

type Category = 'general' | 'rooms' | 'dining' | 'membership';

interface CategoryDef {
  key: Category | 'events';
  title: string;
  blurb: string;
  external?: string;
}

const CATEGORIES: CategoryDef[] = [
  { key: 'general', title: 'General', blurb: 'A question, a thought, a hello.' },
  { key: 'rooms', title: 'Rooms', blurb: 'Stay the night. Stay longer.' },
  { key: 'dining', title: 'Dining', blurb: 'Tables, tasting menus, the lot.' },
  { key: 'membership', title: 'Membership', blurb: 'Bears Den. The inside line.' },
  { key: 'events', title: 'Events', blurb: 'Weddings, parties, takeovers.', external: '/event-enquiry' },
];

const PROPERTIES = [
  { value: 'town', label: 'Beaconsfield (Town)' },
  { value: 'country', label: 'Stadhampton (Country)' },
  { value: 'either', label: 'Either / not sure' },
];

const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Surprise me'];
const DINING_VENUES = ['English Restaurant', 'Thai Restaurant', 'Bar & Lounge', 'Garden & Terrace', 'Private Dining'];
const MEMBERSHIP_INTEREST = ['Joining the Den', 'Existing member query', 'Press / partnerships'];

const fieldClass =
  'w-full bg-white border-2 border-black px-4 py-3 font-sans text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-0 focus:border-black';
const selectClass =
  'w-full bg-white border-2 border-black pl-4 pr-10 py-3 font-mono text-[11px] tracking-[0.25em] uppercase text-black focus:outline-none focus:ring-0 focus:border-black appearance-none cursor-pointer bg-no-repeat bg-[right_1rem_center] bg-[length:14px] bg-[url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 20 20\' fill=\'black\'><path d=\'M5 7l5 6 5-6z\'/></svg>")]';
const labelClass = 'block font-mono text-[10px] tracking-[0.3em] uppercase text-black/70 mb-2';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-6">
    <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/50 mb-1">/ / /</p>
    <h2 className="font-display uppercase text-2xl tracking-tight">{children}</h2>
  </div>
);

const Curious: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();
  const initial = (params.get('c') as Category | null) || null;
  const [category, setCategory] = useState<Category | null>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState<Record<string, any>>({
    full_name: '',
    email: '',
    phone: '',
    property: '',
    message: '',
    arrival_date: '',
    nights: '',
    guests: '',
    room_type: '',
    dining_venue: '',
    party_size: '',
    preferred_date: '',
    membership_interest: '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const selectCategory = (c: CategoryDef) => {
    if (c.external) {
      navigate(c.external);
      return;
    }
    setCategory(c.key as Category);
    setParams({ c: c.key }, { replace: true });
    setDone(false);
  };

  const back = () => {
    setCategory(null);
    setParams({}, { replace: true });
    setDone(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    if (!form.full_name.trim() || !form.email.trim()) {
      toast({ title: 'Missing details', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const details: Record<string, any> = {};
      if (category === 'rooms') {
        details.arrival_date = form.arrival_date;
        details.nights = form.nights;
        details.guests = form.guests;
        details.room_type = form.room_type;
      } else if (category === 'dining') {
        details.dining_venue = form.dining_venue;
        details.preferred_date = form.preferred_date;
        details.party_size = form.party_size;
      } else if (category === 'membership') {
        details.membership_interest = form.membership_interest;
      }

      const { error } = await supabase.from('cb_enquiries').insert({
        category,
        property: form.property || null,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        message: form.message.trim() || null,
        details,
      });

      if (error) throw error;
      setDone(true);
      toast({ title: 'Enquiry sent', description: 'We\'ll be in touch shortly.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Could not send', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const def = CATEGORIES.find((c) => c.key === category);

  return (
    <>
      <Helmet>
        <title>Curious? | Crazy Bear</title>
        <meta name="description" content="Ask the Bear. Rooms, dining, membership, events, or just a hello." />
      </Helmet>

      <div className="relative min-h-screen text-black">
        {/* Opaque B&W background image */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10 bg-cover bg-center grayscale"
          style={{ backgroundImage: `url(${cbBgImage})` }}
        />
        <div aria-hidden className="fixed inset-0 -z-10 bg-black/40" />

        {/* Brand bar */}
        <header className="border-b-2 border-black/80 px-6 md:px-12 py-6 flex items-center gap-4 bg-white/90 backdrop-blur-sm">
          <Link to="/" className="flex items-center gap-3">
            <img src="/brand/crazy-bear-mark.png" alt="Crazy Bear" className="w-10 h-10" />
            <span className="font-display uppercase tracking-tight text-xl">Crazy Bear</span>
          </Link>
          <span className="ml-auto font-mono text-[10px] tracking-[0.4em] uppercase text-black/60">
            Curious?
          </span>
        </header>

        <main className="relative max-w-3xl mx-auto px-6 md:px-12 py-12 md:py-20">
          <div className="bg-white border-2 border-black p-6 md:p-10 shadow-[8px_8px_0_0_rgba(0,0,0,0.9)]">
          {!category && (
            <>
              <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/50 mb-3">/ / /</p>
              <h1 className="font-display uppercase text-5xl md:text-6xl tracking-tight leading-none mb-4">
                Ask the Bear
              </h1>
              <p className="font-sans text-base text-black/70 max-w-xl mb-12">
                Pick your line of enquiry. We answer in plain English, usually within a working day.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => selectCategory(c)}
                    className="group text-left border-2 border-black p-6 bg-white hover:bg-black hover:text-white transition-colors"
                  >
                    <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/50 group-hover:text-white/60 mb-2">
                      / {c.key}
                    </p>
                    <h3 className="font-display uppercase text-2xl tracking-tight mb-2">{c.title}</h3>
                    <p className="font-sans text-sm text-black/70 group-hover:text-white/80">{c.blurb}</p>
                    {c.external && (
                      <p className="font-mono text-[9px] tracking-[0.3em] uppercase mt-3 text-black/40 group-hover:text-white/60">
                        Opens events form
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {category && def && (
            <>
              <button
                onClick={back}
                className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/60 hover:text-black mb-8"
              >
                ← All enquiries
              </button>

              <SectionTitle>{def.title}</SectionTitle>
              <p className="font-sans text-base text-black/70 mb-10">{def.blurb}</p>

              {done ? (
                <div className="border-2 border-black p-8">
                  <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/60 mb-2">/ / /</p>
                  <h3 className="font-display uppercase text-3xl tracking-tight mb-3">Thank you</h3>
                  <p className="font-sans text-sm text-black/70 mb-6">
                    Your enquiry is in. The Bear will be in touch.
                  </p>
                  <button
                    onClick={back}
                    className="border-2 border-black px-5 py-3 font-mono text-[10px] tracking-[0.4em] uppercase hover:bg-black hover:text-white transition-colors"
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-6">
                  {/* Property selector for all forms */}
                  <div>
                    <label className={labelClass}>Property</label>
                    <select
                      className={selectClass}
                      value={form.property}
                      onChange={(e) => set('property', e.target.value)}
                    >
                      <option value="">Select a property</option>
                      {PROPERTIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category-specific fields */}
                  {category === 'rooms' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Arrival</label>
                        <input
                          type="date"
                          className={fieldClass}
                          value={form.arrival_date}
                          onChange={(e) => set('arrival_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Nights</label>
                        <input
                          type="number"
                          min={1}
                          className={fieldClass}
                          value={form.nights}
                          onChange={(e) => set('nights', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Guests</label>
                        <input
                          type="number"
                          min={1}
                          className={fieldClass}
                          value={form.guests}
                          onChange={(e) => set('guests', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Room type</label>
                        <select
                          className={selectClass}
                          value={form.room_type}
                          onChange={(e) => set('room_type', e.target.value)}
                        >
                          <option value="">Any</option>
                          {ROOM_TYPES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {category === 'dining' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={labelClass}>Where</label>
                        <select
                          className={selectClass}
                          value={form.dining_venue}
                          onChange={(e) => set('dining_venue', e.target.value)}
                        >
                          <option value="">Pick a venue</option>
                          {DINING_VENUES.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Preferred date</label>
                        <input
                          type="date"
                          className={fieldClass}
                          value={form.preferred_date}
                          onChange={(e) => set('preferred_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Party size</label>
                        <input
                          type="number"
                          min={1}
                          className={fieldClass}
                          value={form.party_size}
                          onChange={(e) => set('party_size', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {category === 'membership' && (
                    <div>
                      <label className={labelClass}>About your enquiry</label>
                      <select
                        className={selectClass}
                        value={form.membership_interest}
                        onChange={(e) => set('membership_interest', e.target.value)}
                      >
                        <option value="">Choose one</option>
                        {MEMBERSHIP_INTEREST.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-black/10">
                    <div>
                      <label className={labelClass}>Name *</label>
                      <input
                        className={fieldClass}
                        value={form.full_name}
                        onChange={(e) => set('full_name', e.target.value)}
                        placeholder="First and last"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email *</label>
                      <input
                        type="email"
                        className={fieldClass}
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Phone</label>
                      <input
                        className={fieldClass}
                        value={form.phone}
                        onChange={(e) => set('phone', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Anything else</label>
                    <textarea
                      className={`${fieldClass} min-h-[140px]`}
                      value={form.message}
                      onChange={(e) => set('message', e.target.value)}
                      placeholder="Tell the Bear what you need."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="border-2 border-black bg-black text-white px-6 py-4 font-mono text-[11px] tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Sending…' : 'Send to the Bear'}
                  </button>
                </form>
              )}
            </>
          )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Curious;
