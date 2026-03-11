import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Glicko-2 constants
const TAU = 0.5; // System constant (volatility constraint)
const EPSILON = 0.000001; // Convergence tolerance
const DEFAULT_MMR = 2000;
const DEFAULT_RD = 350;
const DEFAULT_VOLATILITY = 0.06;
const GLICKO_SCALE = 173.7178; // Scaling factor for Glicko-2

// Victory type multipliers
const VICTORY_MULTIPLIERS: Record<string, { multiplier: number; bonus: number }> = {
  'golden_pickle': { multiplier: 2.0, bonus: 0 },      // 11-0, opponent never served
  'pickled': { multiplier: 1.5, bonus: 0 },             // 11-0 shutout
  'steamroller': { multiplier: 1.2, bonus: 0 },         // 11-1 to 11-4
  'standard': { multiplier: 1.0, bonus: 0 },            // 11-5 to 11-8
  'squeaker': { multiplier: 0.9, bonus: 0 },            // 11-9
  'clutch_god': { multiplier: 1.0, bonus: 2 },          // 12+ with margin of 2
};

interface GameInput {
  winningPlayers: string[];
  losingPlayers: string[];
  winningScore: number;
  losingScore: number;
  date: string;
  groupId?: string;
  eventId?: string;
  neverServed?: boolean;
}

interface PlayerRating {
  mmr: number;
  rd: number;
  volatility: number;
  gamesThisSeason: number;
}

function getVictoryType(winningScore: number, losingScore: number, neverServed?: boolean): string {
  if (winningScore === 11 && losingScore === 0) {
    return neverServed ? 'golden_pickle' : 'pickled';
  }
  if (winningScore === 11 && losingScore >= 1 && losingScore <= 4) {
    return 'steamroller';
  }
  if (winningScore === 11 && losingScore >= 5 && losingScore <= 8) {
    return 'standard';
  }
  if (winningScore === 11 && losingScore === 9) {
    return 'squeaker';
  }
  if (winningScore >= 12 && (winningScore - losingScore) === 2) {
    return 'clutch_god';
  }
  return 'standard';
}

function getCurrentSeason(): number {
  const year = new Date().getFullYear();
  return year >= 2026 ? 2 : 1;
}

function getSeasonFromDate(dateStr: string): number {
  const year = parseInt(dateStr.split('-')[0]);
  return year >= 2026 ? 2 : 1;
}

// Convert MMR to Glicko-2 rating scale
function toGlicko2(mmr: number, rd: number): { mu: number; phi: number } {
  return {
    mu: (mmr - 1500) / GLICKO_SCALE,
    phi: rd / GLICKO_SCALE,
  };
}

// Convert Glicko-2 back to MMR scale
function fromGlicko2(mu: number, phi: number): { mmr: number; rd: number } {
  return {
    mmr: Math.round(mu * GLICKO_SCALE + 1500),
    rd: Math.round(phi * GLICKO_SCALE * 100) / 100,
  };
}

// Expected score function (logistic function)
function g(phi: number): number {
  return 1 / Math.sqrt(1 + 3 * phi * phi / (Math.PI * Math.PI));
}

function E(mu: number, muOpponent: number, phiOpponent: number): number {
  return 1 / (1 + Math.exp(-g(phiOpponent) * (mu - muOpponent)));
}

// Calculate new volatility using iterative algorithm
function calculateNewVolatility(
  sigma: number,
  phi: number,
  delta: number,
  v: number
): number {
  const a = Math.log(sigma * sigma);
  const deltaSq = delta * delta;
  const phiSq = phi * phi;

  function f(x: number): number {
    const ex = Math.exp(x);
    const num = ex * (deltaSq - phiSq - v - ex);
    const denom = 2 * Math.pow(phiSq + v + ex, 2);
    return num / denom - (x - a) / (TAU * TAU);
  }

  // Set initial bounds for Illinois algorithm
  let A = a;
  let B: number;

  if (deltaSq > phiSq + v) {
    B = Math.log(deltaSq - phiSq - v);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0) {
      k++;
    }
    B = a - k * TAU;
  }

  // Iterative algorithm (Illinois)
  let fA = f(A);
  let fB = f(B);

  while (Math.abs(B - A) > EPSILON) {
    const C = A + (A - B) * fA / (fB - fA);
    const fC = f(C);

    if (fC * fB < 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }

    B = C;
    fB = fC;
  }

  return Math.exp(A / 2);
}

// Calculate Glicko-2 rating update
function calculateGlickoUpdate(
  playerRating: PlayerRating,
  opponentRatings: PlayerRating[],
  scores: number[], // 1 for win, 0 for loss
  victoryMultiplier: number,
  victoryBonus: number,
  isPlacement: boolean
): { newMmr: number; newRd: number; newVolatility: number; mmrChange: number } {
  const player = toGlicko2(playerRating.mmr, playerRating.rd);
  
  // Calculate v (estimated variance)
  let vInverse = 0;
  let delta = 0;

  for (let i = 0; i < opponentRatings.length; i++) {
    const opp = toGlicko2(opponentRatings[i].mmr, opponentRatings[i].rd);
    const gPhi = g(opp.phi);
    const e = E(player.mu, opp.mu, opp.phi);
    
    vInverse += gPhi * gPhi * e * (1 - e);
    delta += gPhi * (scores[i] - e);
  }

  const v = 1 / vInverse;
  delta = v * delta;

  // Calculate new volatility
  const newSigma = calculateNewVolatility(
    playerRating.volatility,
    player.phi,
    delta,
    v
  );

  // Pre-rating period RD update
  const phiStar = Math.sqrt(player.phi * player.phi + newSigma * newSigma);

  // Update rating and RD
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const newMu = player.mu + newPhi * newPhi * delta / v;

  const result = fromGlicko2(newMu, newPhi);
  
  // Calculate base MMR change
  let mmrChange = result.mmr - playerRating.mmr;
  
  // Apply victory multiplier
  mmrChange = Math.round(mmrChange * victoryMultiplier);
  
  // Apply victory bonus
  if (mmrChange > 0) {
    mmrChange += victoryBonus;
  }
  
  // Apply placement volatility (2x for first 10 games of season)
  if (isPlacement) {
    mmrChange = Math.round(mmrChange * 2);
  }

  return {
    newMmr: playerRating.mmr + mmrChange,
    newRd: result.rd,
    newVolatility: newSigma,
    mmrChange,
  };
}

// Get soft reset MMR for new season
function getSoftResetMmr(lastSeasonEndingMmr: number): number {
  return Math.round(2000 + ((lastSeasonEndingMmr - 2000) * 0.5));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', claimsData.user.id);
    
    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const gameInput: GameInput = await req.json();
    const { winningPlayers, losingPlayers, winningScore, losingScore, date, groupId, eventId } = gameInput;

    console.log('Processing game:', { winningPlayers, losingPlayers, score: `${winningScore}-${losingScore}`, date });

    const currentSeason = getSeasonFromDate(date);
    const victoryType = getVictoryType(winningScore, losingScore);
    const { multiplier, bonus } = VICTORY_MULTIPLIERS[victoryType];

    console.log('Victory type:', victoryType, 'Multiplier:', multiplier, 'Bonus:', bonus);

    // Get all players' current ratings
    const allPlayers = [...winningPlayers, ...losingPlayers];
    const playerRatings: Record<string, PlayerRating> = {};

    for (const player of allPlayers) {
      // Check if player has season stats
      const { data: seasonStats } = await supabase
        .from('player_season_stats')
        .select('*')
        .eq('player', player)
        .eq('season', currentSeason)
        .is('group_id', groupId || null)
        .maybeSingle();

      if (seasonStats) {
        // Get latest game for this season
        let query = supabase
          .from('games')
          .select('mmr_after, rd_after, volatility_after')
          .eq('player', player)
          .eq('season', currentSeason)
          .order('date', { ascending: false })
          .order('game_number', { ascending: false })
          .limit(1);

        if (groupId) {
          query = query.eq('group_id', groupId);
        } else {
          query = query.is('group_id', null);
        }

        const { data: latestGame } = await query.maybeSingle();

        if (latestGame) {
          playerRatings[player] = {
            mmr: latestGame.mmr_after,
            rd: latestGame.rd_after || DEFAULT_RD,
            volatility: latestGame.volatility_after || DEFAULT_VOLATILITY,
            gamesThisSeason: seasonStats.games_played,
          };
        } else {
          playerRatings[player] = {
            mmr: seasonStats.starting_mmr,
            rd: seasonStats.starting_rd,
            volatility: seasonStats.starting_volatility,
            gamesThisSeason: seasonStats.games_played,
          };
        }
      } else {
        // New player for this season - check for previous season
        if (currentSeason > 1) {
          let prevSeasonQuery = supabase
            .from('player_season_stats')
            .select('ending_mmr')
            .eq('player', player)
            .eq('season', currentSeason - 1);

          if (groupId) {
            prevSeasonQuery = prevSeasonQuery.eq('group_id', groupId);
          } else {
            prevSeasonQuery = prevSeasonQuery.is('group_id', null);
          }

          const { data: prevStats } = await prevSeasonQuery.maybeSingle();

          if (prevStats?.ending_mmr) {
            // Apply soft reset
            const softResetMmr = getSoftResetMmr(prevStats.ending_mmr);
            playerRatings[player] = {
              mmr: softResetMmr,
              rd: DEFAULT_RD, // Reset RD for new season
              volatility: DEFAULT_VOLATILITY,
              gamesThisSeason: 0,
            };
          } else {
            playerRatings[player] = {
              mmr: DEFAULT_MMR,
              rd: DEFAULT_RD,
              volatility: DEFAULT_VOLATILITY,
              gamesThisSeason: 0,
            };
          }
        } else {
          // Check if player has games from current import (Season 1)
          let latestQuery = supabase
            .from('games')
            .select('mmr_after, rd_after, volatility_after')
            .eq('player', player)
            .eq('season', currentSeason)
            .order('date', { ascending: false })
            .order('game_number', { ascending: false })
            .limit(1);

          if (groupId) {
            latestQuery = latestQuery.eq('group_id', groupId);
          } else {
            latestQuery = latestQuery.is('group_id', null);
          }

          const { data: latestGame } = await latestQuery.maybeSingle();

          if (latestGame) {
            // Count games for this season
            let countQuery = supabase
              .from('games')
              .select('id', { count: 'exact' })
              .eq('player', player)
              .eq('season', currentSeason);

            if (groupId) {
              countQuery = countQuery.eq('group_id', groupId);
            } else {
              countQuery = countQuery.is('group_id', null);
            }

            const { count } = await countQuery;

            playerRatings[player] = {
              mmr: latestGame.mmr_after,
              rd: latestGame.rd_after || DEFAULT_RD,
              volatility: latestGame.volatility_after || DEFAULT_VOLATILITY,
              gamesThisSeason: count || 0,
            };
          } else {
            playerRatings[player] = {
              mmr: DEFAULT_MMR,
              rd: DEFAULT_RD,
              volatility: DEFAULT_VOLATILITY,
              gamesThisSeason: 0,
            };
          }
        }

        // Create season stats entry for new player (upsert)
        await supabase
          .from('player_season_stats')
          .upsert({
            player,
            season: currentSeason,
            group_id: groupId || null,
            starting_mmr: playerRatings[player].mmr,
            starting_rd: playerRatings[player].rd,
            starting_volatility: playerRatings[player].volatility,
            games_played: playerRatings[player].gamesThisSeason,
          }, { onConflict: 'player,season,group_id' });
      }
    }

    console.log('Player ratings before:', playerRatings);

    // Calculate team MMRs for display
    const winningTeamMmr = winningPlayers.reduce((sum, p) => sum + playerRatings[p].mmr, 0);
    const losingTeamMmr = losingPlayers.reduce((sum, p) => sum + playerRatings[p].mmr, 0);
    const mmrDiff = winningTeamMmr - losingTeamMmr;

    // Get next game number for this date
    let gameNumQuery = supabase
      .from('games')
      .select('game_number')
      .eq('date', date)
      .order('game_number', { ascending: false })
      .limit(1);

    if (groupId) {
      gameNumQuery = gameNumQuery.eq('group_id', groupId);
    } else {
      gameNumQuery = gameNumQuery.is('group_id', null);
    }

    const { data: lastGame } = await gameNumQuery.maybeSingle();
    const gameNumber = (lastGame?.game_number || 0) + 1;

    // Calculate new ratings for each player
    const gameRecords: any[] = [];

    // Process winners
    for (const player of winningPlayers) {
      const opponentRatings = losingPlayers.map(p => playerRatings[p]);
      const isPlacement = playerRatings[player].gamesThisSeason < 10;

      const result = calculateGlickoUpdate(
        playerRatings[player],
        opponentRatings,
        [1, 1], // Win against both opponents
        multiplier,
        bonus,
        isPlacement
      );

      gameRecords.push({
        game_number: gameNumber,
        date,
        player,
        result: 'Winner',
        score: `${winningScore}-${losingScore}`,
        mmr_before: playerRatings[player].mmr,
        mmr_after: result.newMmr,
        mmr_change: result.mmrChange,
        team_mmr: winningTeamMmr,
        team_mmr_diff: mmrDiff,
        season: currentSeason,
        rd_after: result.newRd,
        volatility_after: result.newVolatility,
        victory_type: victoryType,
        group_id: groupId || null,
        event_id: eventId || null,
      });
    }

    // Process losers
    for (const player of losingPlayers) {
      const opponentRatings = winningPlayers.map(p => playerRatings[p]);
      const isPlacement = playerRatings[player].gamesThisSeason < 10;

      const result = calculateGlickoUpdate(
        playerRatings[player],
        opponentRatings,
        [0, 0], // Loss against both opponents
        multiplier,
        0, // No bonus for losers
        isPlacement
      );

      gameRecords.push({
        game_number: gameNumber,
        date,
        player,
        result: 'Loser',
        score: `${winningScore}-${losingScore}`,
        mmr_before: playerRatings[player].mmr,
        mmr_after: result.newMmr,
        mmr_change: result.mmrChange,
        team_mmr: losingTeamMmr,
        team_mmr_diff: -mmrDiff,
        season: currentSeason,
        rd_after: result.newRd,
        volatility_after: result.newVolatility,
        victory_type: victoryType,
        group_id: groupId || null,
        event_id: eventId || null,
      });
    }

    console.log('Inserting game records:', gameRecords);

    // Insert games
    const { error: insertError } = await supabase.from('games').insert(gameRecords);

    if (insertError) {
      console.error('Error inserting games:', insertError);
      throw insertError;
    }

    // Update season stats for all players
    for (const player of allPlayers) {
      const playerGame = gameRecords.find(g => g.player === player);
      const isWin = playerGame.result === 'Winner';

      await supabase.rpc('update_player_season_stats', {
        p_player: player,
        p_season: currentSeason,
        p_group_id: groupId || null,
        p_ending_mmr: playerGame.mmr_after,
        p_ending_rd: playerGame.rd_after,
        p_is_win: isWin,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        gameNumber,
        victoryType,
        games: gameRecords.map(g => ({
          player: g.player,
          result: g.result,
          mmrBefore: g.mmr_before,
          mmrAfter: g.mmr_after,
          mmrChange: g.mmr_change,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error calculating MMR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
