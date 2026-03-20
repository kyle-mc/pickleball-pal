import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Glicko-2 constants (mirrored from calculate-mmr)
const TAU = 0.5;
const EPSILON = 0.000001;
const DEFAULT_MMR = 2000;
const DEFAULT_RD = 350;
const DEFAULT_VOLATILITY = 0.06;
const GLICKO_SCALE = 173.7178;

const VICTORY_MULTIPLIERS: Record<string, { multiplier: number; bonus: number }> = {
  'golden_pickle': { multiplier: 2.0, bonus: 0 },
  'pickled': { multiplier: 1.5, bonus: 0 },
  'steamroller': { multiplier: 1.2, bonus: 0 },
  'standard': { multiplier: 1.0, bonus: 0 },
  'squeaker': { multiplier: 0.9, bonus: 0 },
  'clutch_god': { multiplier: 1.0, bonus: 2 },
};

interface PlayerRating {
  mmr: number;
  rd: number;
  volatility: number;
  gamesThisSeason: number;
}

function toGlicko2(mmr: number, rd: number) {
  return { mu: (mmr - 1500) / GLICKO_SCALE, phi: rd / GLICKO_SCALE };
}

function fromGlicko2(mu: number, phi: number) {
  return { mmr: Math.round(mu * GLICKO_SCALE + 1500), rd: Math.round(phi * GLICKO_SCALE * 100) / 100 };
}

function g(phi: number): number {
  return 1 / Math.sqrt(1 + 3 * phi * phi / (Math.PI * Math.PI));
}

function E(mu: number, muOpp: number, phiOpp: number): number {
  return 1 / (1 + Math.exp(-g(phiOpp) * (mu - muOpp)));
}

function calculateNewVolatility(sigma: number, phi: number, delta: number, v: number): number {
  const a = Math.log(sigma * sigma);
  const deltaSq = delta * delta;
  const phiSq = phi * phi;
  function f(x: number): number {
    const ex = Math.exp(x);
    return (ex * (deltaSq - phiSq - v - ex)) / (2 * Math.pow(phiSq + v + ex, 2)) - (x - a) / (TAU * TAU);
  }
  let A = a;
  let B: number;
  if (deltaSq > phiSq + v) { B = Math.log(deltaSq - phiSq - v); }
  else { let k = 1; while (f(a - k * TAU) < 0) k++; B = a - k * TAU; }
  let fA = f(A), fB = f(B);
  while (Math.abs(B - A) > EPSILON) {
    const C = A + (A - B) * fA / (fB - fA);
    const fC = f(C);
    if (fC * fB < 0) { A = B; fA = fB; } else { fA = fA / 2; }
    B = C; fB = fC;
  }
  return Math.exp(A / 2);
}

function calculateGlickoUpdate(
  playerRating: PlayerRating, opponentRatings: PlayerRating[], scores: number[],
  victoryMultiplier: number, victoryBonus: number, isPlacement: boolean
) {
  const player = toGlicko2(playerRating.mmr, playerRating.rd);
  let vInverse = 0, delta = 0;
  for (let i = 0; i < opponentRatings.length; i++) {
    const opp = toGlicko2(opponentRatings[i].mmr, opponentRatings[i].rd);
    const gPhi = g(opp.phi); const e = E(player.mu, opp.mu, opp.phi);
    vInverse += gPhi * gPhi * e * (1 - e);
    delta += gPhi * (scores[i] - e);
  }
  const v = 1 / vInverse;
  delta = v * delta;
  const newSigma = calculateNewVolatility(playerRating.volatility, player.phi, delta, v);
  const phiStar = Math.sqrt(player.phi * player.phi + newSigma * newSigma);
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const newMu = player.mu + newPhi * newPhi * delta / v;
  const result = fromGlicko2(newMu, newPhi);
  let mmrChange = result.mmr - playerRating.mmr;
  mmrChange = Math.round(mmrChange * victoryMultiplier);
  if (mmrChange > 0) mmrChange += victoryBonus;
  if (isPlacement) mmrChange = Math.round(mmrChange * 2);
  return { newMmr: playerRating.mmr + mmrChange, newRd: result.rd, newVolatility: newSigma, mmrChange };
}

function getSoftResetMmr(lastMmr: number): number {
  return Math.round(2000 + ((lastMmr - 2000) * 0.5));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const authClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check admin role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: adminCheck } = await supabase.from('user_roles').select('role').eq('user_id', claimsData.user.id).eq('role', 'admin');
    if (!adminCheck || adminCheck.length === 0) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { groupId } = await req.json();
    console.log('Recalculating all MMR for group:', groupId);

    // Fetch ALL games ordered chronologically
    let query = supabase.from('games').select('*').order('date', { ascending: true }).order('game_number', { ascending: true });
    if (groupId) query = query.eq('group_id', groupId);
    else query = query.is('group_id', null);
    const { data: allGames, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!allGames || allGames.length === 0) {
      return new Response(JSON.stringify({ success: true, gamesProcessed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Group games by date+game_number (4 rows per game)
    const gameGroups: Record<string, any[]> = {};
    allGames.forEach(g => {
      const key = `${g.date}-${g.game_number}`;
      if (!gameGroups[key]) gameGroups[key] = [];
      gameGroups[key].push(g);
    });

    // Sort game keys chronologically
    const sortedKeys = Object.keys(gameGroups).sort((a, b) => {
      const [dateA, numA] = [a.substring(0, 10), parseInt(a.split('-').pop()!)];
      const [dateB, numB] = [b.substring(0, 10), parseInt(b.split('-').pop()!)];
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return numA - numB;
    });

    // Reset all player ratings and season stats
    const playerRatings: Record<string, Record<number, PlayerRating>> = {}; // player -> season -> rating
    const seasonGameCounts: Record<string, Record<number, number>> = {};

    function getSeasonFromDate(dateStr: string): number {
      return parseInt(dateStr.split('-')[0]) >= 2026 ? 2 : 1;
    }

    function getOrInitRating(player: string, season: number): PlayerRating {
      if (!playerRatings[player]) playerRatings[player] = {};
      if (!seasonGameCounts[player]) seasonGameCounts[player] = {};
      
      if (!playerRatings[player][season]) {
        // Check previous season
        if (season > 1 && playerRatings[player][season - 1]) {
          const prev = playerRatings[player][season - 1];
          playerRatings[player][season] = {
            mmr: getSoftResetMmr(prev.mmr),
            rd: DEFAULT_RD,
            volatility: DEFAULT_VOLATILITY,
            gamesThisSeason: 0,
          };
        } else {
          playerRatings[player][season] = {
            mmr: DEFAULT_MMR, rd: DEFAULT_RD, volatility: DEFAULT_VOLATILITY, gamesThisSeason: 0,
          };
        }
        seasonGameCounts[player][season] = 0;
      }
      return playerRatings[player][season];
    }

    // Process each game in order, recalculate MMR
    const updates: { id: string; mmr_before: number; mmr_after: number; mmr_change: number; rd_after: number; volatility_after: number; team_mmr: number; team_mmr_diff: number }[] = [];

    for (const key of sortedKeys) {
      const rows = gameGroups[key];
      const season = getSeasonFromDate(rows[0].date);
      const victoryType = rows[0].victory_type || 'standard';
      const { multiplier, bonus } = VICTORY_MULTIPLIERS[victoryType] || VICTORY_MULTIPLIERS['standard'];

      const winners = rows.filter((r: any) => r.result === 'Winner');
      const losers = rows.filter((r: any) => r.result === 'Loser');
      
      if (winners.length === 0 || losers.length === 0) continue;

      const winnerNames = winners.map((w: any) => w.player);
      const loserNames = losers.map((l: any) => l.player);

      // Init ratings
      winnerNames.forEach((p: string) => getOrInitRating(p, season));
      loserNames.forEach((p: string) => getOrInitRating(p, season));

      const winTeamMmr = winnerNames.reduce((s: number, p: string) => s + playerRatings[p][season].mmr, 0);
      const loseTeamMmr = loserNames.reduce((s: number, p: string) => s + playerRatings[p][season].mmr, 0);
      const mmrDiff = winTeamMmr - loseTeamMmr;

      // Calculate for winners
      for (const w of winners) {
        const rating = playerRatings[w.player][season];
        const oppRatings = loserNames.map((p: string) => playerRatings[p][season]);
        const isPlacement = rating.gamesThisSeason < 10;
        const result = calculateGlickoUpdate(rating, oppRatings, [1, 1], multiplier, bonus, isPlacement);
        
        updates.push({
          id: w.id,
          mmr_before: rating.mmr,
          mmr_after: result.newMmr,
          mmr_change: result.mmrChange,
          rd_after: result.newRd,
          volatility_after: result.newVolatility,
          team_mmr: winTeamMmr,
          team_mmr_diff: mmrDiff,
        });

        playerRatings[w.player][season] = {
          mmr: result.newMmr, rd: result.newRd, volatility: result.newVolatility,
          gamesThisSeason: rating.gamesThisSeason + 1,
        };
        seasonGameCounts[w.player][season] = (seasonGameCounts[w.player][season] || 0) + 1;
      }

      // Calculate for losers
      for (const l of losers) {
        const rating = playerRatings[l.player][season];
        const oppRatings = winnerNames.map((p: string) => playerRatings[p][season]);
        const isPlacement = rating.gamesThisSeason < 10;
        const result = calculateGlickoUpdate(rating, oppRatings, [0, 0], multiplier, 0, isPlacement);

        updates.push({
          id: l.id,
          mmr_before: rating.mmr,
          mmr_after: result.newMmr,
          mmr_change: result.mmrChange,
          rd_after: result.newRd,
          volatility_after: result.newVolatility,
          team_mmr: loseTeamMmr,
          team_mmr_diff: -mmrDiff,
        });

        playerRatings[l.player][season] = {
          mmr: result.newMmr, rd: result.newRd, volatility: result.newVolatility,
          gamesThisSeason: rating.gamesThisSeason + 1,
        };
        seasonGameCounts[l.player][season] = (seasonGameCounts[l.player][season] || 0) + 1;
      }
    }

    // Batch update all games
    console.log(`Updating ${updates.length} game records...`);
    for (const u of updates) {
      const { error: updateError } = await supabase.from('games').update({
        mmr_before: u.mmr_before,
        mmr_after: u.mmr_after,
        mmr_change: u.mmr_change,
        rd_after: u.rd_after,
        volatility_after: u.volatility_after,
        team_mmr: u.team_mmr,
        team_mmr_diff: u.team_mmr_diff,
      }).eq('id', u.id);
      if (updateError) console.error('Update error for', u.id, updateError);
    }

    // Rebuild player_season_stats
    // Delete existing and recreate
    if (groupId) {
      await supabase.from('player_season_stats').delete().eq('group_id', groupId);
    } else {
      await supabase.from('player_season_stats').delete().is('group_id', null);
    }

    for (const [player, seasons] of Object.entries(playerRatings)) {
      for (const [seasonStr, rating] of Object.entries(seasons)) {
        const season = parseInt(seasonStr);
        // Find first game MMR for starting_mmr
        const firstGameKey = sortedKeys.find(k => {
          const rows = gameGroups[k];
          return getSeasonFromDate(rows[0].date) === season && rows.some((r: any) => r.player === player);
        });
        
        const startingMmr = firstGameKey 
          ? updates.find(u => u.id === gameGroups[firstGameKey].find((r: any) => r.player === player)?.id)?.mmr_before || DEFAULT_MMR
          : DEFAULT_MMR;

        const gamesPlayed = seasonGameCounts[player]?.[season] || 0;
        const wins = sortedKeys.reduce((count, k) => {
          const rows = gameGroups[k];
          if (getSeasonFromDate(rows[0].date) !== season) return count;
          return count + rows.filter((r: any) => r.player === player && r.result === 'Winner').length;
        }, 0);

        await supabase.from('player_season_stats').insert({
          player,
          season,
          group_id: groupId || null,
          starting_mmr: startingMmr,
          ending_mmr: rating.mmr,
          ending_rd: rating.rd,
          starting_rd: DEFAULT_RD,
          starting_volatility: DEFAULT_VOLATILITY,
          games_played: gamesPlayed,
          wins,
          losses: gamesPlayed - wins,
        });
      }
    }

    console.log('MMR recalculation complete');
    return new Response(
      JSON.stringify({ success: true, gamesProcessed: sortedKeys.length, recordsUpdated: updates.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Recalculation error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
