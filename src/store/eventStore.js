import { create } from 'zustand';
import { supabase, supabaseAdmin } from '../supabase';

export const useEventStore = create((set, get) => ({
  settings: null,
  loading:  false,

  // ── Fetch event settings ───────────────────────────────────
  fetchSettings: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('event_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) set({ settings: data });
    set({ loading: false });
  },

  // ── Finalize scoring (lock nilai) ─────────────────────────
  finalizeScoring: async () => {
    const { error } = await supabaseAdmin
      .from('event_settings')
      .update({
        scoring_finalized: true,
        finalized_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (!error) {
      set(s => ({
        settings: { ...s.settings, scoring_finalized: true, finalized_at: new Date().toISOString() },
      }));
    }
    return { success: !error, error: error?.message };
  },

  // ── Undo finalize ──────────────────────────────────────────
  undoFinalize: async () => {
    const { error } = await supabaseAdmin
      .from('event_settings')
      .update({ scoring_finalized: false, finalized_at: null, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (!error) {
      set(s => ({ settings: { ...s.settings, scoring_finalized: false, finalized_at: null } }));
    }
    return { success: !error, error: error?.message };
  },

  // ── Publish ranking ────────────────────────────────────────
  publishRanking: async () => {
    const { error } = await supabaseAdmin
      .from('event_settings')
      .update({
        ranking_published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (!error) {
      set(s => ({
        settings: { ...s.settings, ranking_published: true, published_at: new Date().toISOString() },
      }));
    }
    return { success: !error, error: error?.message };
  },

  // ── Unpublish ranking ──────────────────────────────────────
  unpublishRanking: async () => {
    const { error } = await supabaseAdmin
      .from('event_settings')
      .update({ ranking_published: false, published_at: null, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (!error) {
      set(s => ({ settings: { ...s.settings, ranking_published: false, published_at: null } }));
    }
    return { success: !error, error: error?.message };
  },

  // ── Update event name/date ─────────────────────────────────
  updateEventInfo: async ({ eventName, eventDate }) => {
    const { error } = await supabaseAdmin
      .from('event_settings')
      .update({ event_name: eventName, event_date: eventDate, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (!error) {
      set(s => ({ settings: { ...s.settings, event_name: eventName, event_date: eventDate } }));
    }
    return { success: !error, error: error?.message };
  },
}));
