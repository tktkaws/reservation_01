begin;

create extension if not exists pg_cron with schema pg_catalog;
create schema if not exists private;

-- A completed week stays complete even if someone later edits a booking.
create table if not exists private.reservation_weeks (
  monday date primary key
);
alter table private.reservation_weeks enable row level security;

create or replace function private.create_weekly_reservations(p_monday date)
returns void
language plpgsql
set search_path = pg_catalog
as $$
declare
  booking record;
  booking_id uuid;
  starts timestamptz;
  meeting_tag uuid;
  group_tag uuid;
  group_name text;
  booking_title text;
begin
  if p_monday < date '2026-11-30' then return; end if;
  if p_monday is null or extract(isodow from p_monday) <> 1 then
    raise exception 'Expected a Monday, got %', p_monday;
  end if;

  insert into private.reservation_weeks values (p_monday) on conflict do nothing;
  if not found then return; end if;

  -- Protect the short interval between choosing a vacant slot and inserting it.
  lock table public.reservations in share row exclusive mode;
  select id into strict meeting_tag from public.tags where name = '社内MTG';
  for booking in
    select person.*, round_no
    from (values
      (0, 'a0000001-0002-4000-8000-000000000002'::uuid, '営業部', '営業部'),
      (1, 'a0000001-0004-4000-8000-000000000004'::uuid, '総務', '総務'),
      (2, 'a0000001-0005-4000-8000-000000000005'::uuid, '制作部', '制作部'),
      (3, 'a0000001-0001-4000-8000-000000000001'::uuid, '制作部', '取締役会')
    ) as person(day_offset, user_id, department, fixed_tag)
    cross join generate_series(0, 2) as rounds(round_no)
    order by round_no, day_offset
  loop
    booking_id := md5('weekly-room/' || to_char(p_monday, 'YYYY-MM-DD') || '/'
                      || booking.user_id || '/' || booking.round_no)::uuid;
    group_name := case when booking.round_no = 0 then booking.fixed_tag else booking.department end;
    select id into strict group_tag from public.tags where name = group_name;

    if not exists (select from public.reservations where id = booking_id) then
      if booking.round_no = 0 then
        starts := (p_monday + booking.day_offset + time '14:00') at time zone 'Asia/Tokyo';
        booking_title := case when group_name = '取締役会' then group_name else group_name || ' 定例会' end;
      else
        select slot into starts
        from generate_series(0, 4) as days(d)
        cross join lateral generate_series(
          (p_monday + d + time '09:00') at time zone 'Asia/Tokyo',
          (p_monday + d + time '17:00') at time zone 'Asia/Tokyo',
          interval '15 minutes'
        ) as slots(slot)
        where not exists (
          select from public.reservations r
          where r.start_at < slot + interval '1 hour' and r.end_at > slot
        )
        order by random() limit 1;
        if starts is null then raise exception 'No free one-hour slot for week %', p_monday; end if;
        booking_title := group_name || case booking.round_no when 1 then ' 打ち合わせ' else ' 進捗確認' end;
      end if;

      insert into public.reservations (id, start_at, end_at, user_id, title)
      values (booking_id, starts, starts + interval '1 hour', booking.user_id, booking_title);
    end if;

    insert into public.reservation_tags (reservation_id, tag_id)
    values (booking_id, meeting_tag), (booking_id, group_tag)
    on conflict do nothing;
  end loop;
end;
$$;

revoke all on function private.create_weekly_reservations(date) from public;

-- Supabase Cron uses GMT. Sunday 15:17 GMT is Monday 00:17 in Japan.
select cron.schedule(
  'weekly-room-reservations',
  '17 15 * * 0',
  $$select private.create_weekly_reservations(date_trunc('week', now() at time zone 'Asia/Tokyo')::date)$$
);

commit;
