import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Historical games data to migrate
const gamesData = [
  { game: 1, result: 'Winner', player: 'Kyle', score: '', mmrBefore: 2000, teamMmr: 4000, teamMmrDiff: 0, mmrAfter: 2050, mmrChange: 50, date: '2025-07-28' },
  { game: 1, result: 'Winner', player: 'Josiah', score: '', mmrBefore: 2000, teamMmr: 4000, teamMmrDiff: 0, mmrAfter: 2050, mmrChange: 50, date: '2025-07-28' },
  { game: 1, result: 'Loser', player: 'Chris', score: '', mmrBefore: 2000, teamMmr: 4000, teamMmrDiff: 0, mmrAfter: 1950, mmrChange: -50, date: '2025-07-28' },
  { game: 1, result: 'Loser', player: 'Corbin', score: '', mmrBefore: 2000, teamMmr: 4000, teamMmrDiff: 0, mmrAfter: 1950, mmrChange: -50, date: '2025-07-28' },
  { game: 2, result: 'Winner', player: 'Chris', score: '', mmrBefore: 1950, teamMmr: 4000, teamMmrDiff: 50, mmrAfter: 1999, mmrChange: 49, date: '2025-07-28' },
  { game: 2, result: 'Winner', player: 'Josiah', score: '', mmrBefore: 2050, teamMmr: 4000, teamMmrDiff: 50, mmrAfter: 2099, mmrChange: 49, date: '2025-07-28' },
  { game: 2, result: 'Loser', player: 'Corbin', score: '', mmrBefore: 1950, teamMmr: 3950, teamMmrDiff: 50, mmrAfter: 1901, mmrChange: -49, date: '2025-07-28' },
  { game: 2, result: 'Loser', player: 'Brandon', score: '', mmrBefore: 2000, teamMmr: 3950, teamMmrDiff: 50, mmrAfter: 1951, mmrChange: -49, date: '2025-07-28' },
];

// Unique players from games
const uniquePlayers = [...new Set(gamesData.map(g => g.player))];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, insert unique players
    const playersToInsert = uniquePlayers.map(name => ({ name }));
    const { error: playersError } = await supabase
      .from('players')
      .upsert(playersToInsert, { onConflict: 'name', ignoreDuplicates: true });

    if (playersError) {
      console.error('Players insert error:', playersError);
    }

    // Convert games data to DB format
    const dbGames = gamesData.map(g => ({
      game_number: g.game,
      date: g.date,
      player: g.player,
      result: g.result,
      score: g.score || null,
      mmr_before: g.mmrBefore,
      team_mmr: g.teamMmr,
      team_mmr_diff: g.teamMmrDiff,
      mmr_after: g.mmrAfter,
      mmr_change: g.mmrChange,
    }));

    // Insert games
    const { error: gamesError, data } = await supabase
      .from('games')
      .insert(dbGames)
      .select();

    if (gamesError) {
      // If duplicate key error, data already migrated
      if (gamesError.code === '23505') {
        return new Response(
          JSON.stringify({ message: 'Data already migrated', count: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw gamesError;
    }

    return new Response(
      JSON.stringify({ 
        message: 'Migration successful', 
        playersCount: uniquePlayers.length,
        gamesCount: data?.length || 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
