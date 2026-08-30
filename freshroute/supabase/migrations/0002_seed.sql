-- FreshRoute — demo history seed (all rows source='seed', clearly labeled in the UI)
-- Run AFTER 0001_init.sql.

begin;

select setseed(0.42);

-- ─────────────────────────────── demo customers ───────────────────────────────

insert into public.profiles (full_name, email, phone, city, address, source, created_at) values
  ('Muhammad Ashraf',      'ashraf.demo@seed.freshroute.pk',    '+92 300 4412201', 'Multan',     'Bosan Road, near Chungi No. 6',        'seed', '2026-05-12'),
  ('Fatima Bibi',          'fatima.demo@seed.freshroute.pk',    '+92 301 5513302', 'Multan',     'Shah Rukn-e-Alam Colony',              'seed', '2026-05-18'),
  ('Ghulam Mustafa',       'mustafa.demo@seed.freshroute.pk',   '+92 302 6624403', 'Multan',     'Qasim Bela, Matti Tal road',           'seed', '2026-05-25'),
  ('Rana Tanveer',         'tanveer.demo@seed.freshroute.pk',   '+92 303 7735504', 'Lahore',     'Bedian Road, Haloki',                  'seed', '2026-05-28'),
  ('Mehmood Ahmed',        'mehmood.demo@seed.freshroute.pk',   '+92 304 8846605', 'Faisalabad', 'Jaranwala Road, Chak 216',             'seed', '2026-06-02'),
  ('Zahida Parveen',       'zahida.demo@seed.freshroute.pk',    '+92 305 9957706', 'Multan',     'Gulgasht Colony, Block B',             'seed', '2026-06-05'),
  ('Abdul Sattar',         'sattar.demo@seed.freshroute.pk',    '+92 306 1068807', 'Vehari',     'Burewala, Chak 145',                   'seed', '2026-06-09'),
  ('Nasir Abbas',          'nasir.demo@seed.freshroute.pk',     '+92 307 2179908', 'Khanewal',   'Kabirwala, Main Bazar road',           'seed', '2026-06-14'),
  ('Shahid Iqbal',         'shahid.demo@seed.freshroute.pk',    '+92 308 3281019', 'Lahore',     'Raiwind Road, Thatti Niaz Beg',        'seed', '2026-06-19'),
  ('Ruqayya Khatoon',      'ruqayya.demo@seed.freshroute.pk',   '+92 309 4392120', 'Multan',     'Daulat Gate, Mirza Mahal',             'seed', '2026-06-24'),
  ('Arif Malik',           'arif.demo@seed.freshroute.pk',      '+92 310 5403231', 'Sahiwal',    'Farid Town, Block C',                  'seed', '2026-06-29'),
  ('Jamshed Ali',          'jamshed.demo@seed.freshroute.pk',   '+92 311 6514342', 'Faisalabad', 'People''s Colony No. 1',               'seed', '2026-07-03'),
  ('Kausar Shahid',        'kausar.demo@seed.freshroute.pk',    '+92 312 7625453', 'Lodhran',    'Kehror Pacca road',                    'seed', '2026-07-08'),
  ('Iftikhar Hussain',     'iftikhar.demo@seed.freshroute.pk',  '+92 313 8736564', 'Multan',     'Shah Faisal Colony',                   'seed', '2026-07-13'),
  ('Bilal Ahmed',          'bilal.demo@seed.freshroute.pk',     '+92 314 9847675', 'Lahore',     'Township, Sector 2',                   'seed', '2026-07-18'),
  ('Sakina Bibi',          'sakina.demo@seed.freshroute.pk',    '+92 315 1958786', 'Muzaffargarh','Alipur road, Kot Addu',               'seed', '2026-07-22'),
  ('Rashid Mehmood',       'rashid.demo@seed.freshroute.pk',    '+92 316 2069897', 'Faisalabad', 'Ghulam Muhammad Abad',                 'seed', '2026-07-27'),
  ('Saima Akhtar',         'saima.demo@seed.freshroute.pk',     '+92 317 3170908', 'Multan',     'Buch Villas, Gulgasht',                'seed', '2026-08-02');

-- ─────────────────────────────── orders + reviews ───────────────────────────────

do $$
declare
  rec record;
  seq int := 0;
  n_orders int;
  created timestamptz;
  crop text;
  qty numeric;
  price numeric;
  buyer text;
  dest text;
  gross numeric;
  net numeric;
  final_net numeric;
  status text;
  terms text;
  rating int;
  feedback text;
begin
  for rec in select id, city from public.profiles where source = 'seed' order by created_at loop
    -- 1–3 orders per customer, skewed to 2–3
    n_orders := 1 + floor(random() * 3)::int;

    for i in 1..n_orders loop
      seq := seq + 1;
      created := timestamp '2026-06-01' + random() * interval '88 days';
      created := date_trunc('hour', created);

      case floor(random() * 9)::int
        when 0 then crop := 'Tomato';             price := 70 + round(random() * 35);
        when 1 then crop := 'Potato';             price := 55 + round(random() * 20);
        when 2 then crop := 'Onion';              price := 48 + round(random() * 20);
        when 3 then crop := 'Mango';              price := 120 + round(random() * 48);
        when 4 then crop := 'Kinnow';             price := 85 + round(random() * 35);
        when 5 then crop := 'Banana';             price := 110 + round(random() * 35);
        when 6 then crop := 'Green Chili';        price := 140 + round(random() * 70);
        when 7 then crop := 'Okra';               price := 95 + round(random() * 43);
        else crop := 'Leafy Vegetables';          price := 60 + round(random() * 32);
      end case;

      qty := (300 + floor(random() * 1700))::numeric / 5 * 5;

      case floor(random() * 5)::int
        when 0 then buyer := 'Al-Karam Wholesale Co.';  dest := 'Lahore';       terms := '2–3 days';
        when 1 then buyer := 'Metro Fresh Retail';      dest := 'Lahore';       terms := '7 days';
        when 2 then buyer := 'Chenab Traders';          dest := 'Faisalabad';   terms := '3–4 days';
        when 3 then buyer := 'Empress Market Dealer';   dest := 'Karachi';      terms := 'on delivery';
        else buyer := rec.city || ' Sabzi Mandi';       dest := rec.city;       terms := 'same day';
      end case;

      gross := round(qty * price);
      net := round(gross * (0.84 + random() * 0.06));

      -- status distribution: mostly completed, a few active/cancelled
      if seq in (7, 31) then
        status := 'active';
      elsif seq in (12, 24, 39) then
        status := 'cancelled';
      else
        status := 'completed';
      end if;

      insert into public.orders (
        id, user_id, crop, quantity_kg, packaging, grade, buyer_name, destination,
        price_per_kg, gross, net, final_net, status, payment_status, payment_terms,
        steps, source, created_at, completed_at
      ) values (
        'FR-S' || lpad(seq::text, 3, '0'),
        rec.id,
        crop,
        qty,
        (array['crates', 'sacks'])[1 + floor(random() * 2)::int],
        (array['A', 'B', 'B', 'B', 'C'])[1 + floor(random() * 5)::int],
        buyer,
        dest,
        price,
        gross,
        net,
        case when status = 'completed' then round(net * (0.95 + random() * 0.05)) end,
        status,
        case when status = 'completed' then 'paid' else 'pending' end,
        terms,
        case status
          when 'completed' then jsonb_build_array(
            jsonb_build_object('label', 'Order confirmed', 'time', 'now', 'state', 'done'),
            jsonb_build_object('label', 'Pickup from farm', 'time', '7:00 AM', 'state', 'done'),
            jsonb_build_object('label', 'In transit', 'time', '7:30 AM', 'state', 'done'),
            jsonb_build_object('label', 'Delivered · inspection', 'time', '2:30 PM', 'state', 'done'),
            jsonb_build_object('label', 'Payment recorded', 'time', '5:00 PM', 'state', 'done')
          )
          when 'active' then jsonb_build_array(
            jsonb_build_object('label', 'Order confirmed', 'time', 'now', 'state', 'done'),
            jsonb_build_object('label', 'Pickup from farm', 'time', '7:00 AM', 'state', 'done'),
            jsonb_build_object('label', 'In transit', 'time', '—', 'state', 'active')
          )
          else jsonb_build_array(
            jsonb_build_object('label', 'Order confirmed', 'time', 'now', 'state', 'done'),
            jsonb_build_object('label', 'Cancelled before pickup', 'time', '—', 'state', 'done')
          )
        end,
        'seed',
        created,
        case when status = 'completed' then created + interval '26 hours' end
      );

      -- reviews on ~70% of completed orders
      if status = 'completed' and random() < 0.7 then
        rating := (array[3, 4, 4, 5, 5, 5])[1 + floor(random() * 6)::int];
        feedback := (array[
          'Best price I have got for my crop. Agent handled everything.',
          'پیکیج بہت اچھی تھی، پھل تازہ پہنچے۔',
          'Transport arrived on time. Payment took two extra days.',
          'Very helpful for a first-time seller like me.',
          'لہور کے ریٹ نے میرا منافع دگنا کر دیا۔ شکریہ!',
          'Good buyer, fair grading at inspection.'
        ])[1 + floor(random() * 6)::int];

        insert into public.reviews (user_id, order_id, rating, feedback, created_at)
        values (rec.id, 'FR-S' || lpad(seq::text, 3, '0'), rating, feedback, created + interval '2 days');
      end if;
    end loop;
  end loop;
end $$;

commit;
