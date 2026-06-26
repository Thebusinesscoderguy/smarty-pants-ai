-- Feature 6 pivot: remove the parent-booking model entirely (verified empty).
drop table if exists public.conference_bookings;
drop table if exists public.conference_slots;
