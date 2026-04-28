-- Update player last names per user-provided list
UPDATE public.players SET last_name = 'Stange' WHERE name = 'Billy Stange';
UPDATE public.players SET last_name = 'Ukrazhenko' WHERE name = 'Billy Ukrazhenko';
UPDATE public.players SET last_name = 'Lee' WHERE name = 'Brandon Lee' OR name = 'Brandon';
UPDATE public.players SET last_name = 'Constant' WHERE name = 'Chris Constant' OR name = 'Chris';
UPDATE public.players SET last_name = 'Calvert' WHERE name = 'Corbin Calvert' OR name = 'Corbin';
UPDATE public.players SET last_name = 'Poindexter' WHERE name = 'David Poindexter' OR name = 'David';
UPDATE public.players SET last_name = 'Thiele' WHERE name = 'Josiah' OR name = 'Josiah Thiele';
UPDATE public.players SET last_name = 'McCracken' WHERE name = 'Kyle McCracken' OR name = 'Kyle';