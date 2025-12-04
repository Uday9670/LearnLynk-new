alter table leads enable row level security;

create policy select_leads_for_tenant_and_role on leads
  for select using (
    tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid
    and (
      (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
      or
      (
        (current_setting('request.jwt.claims', true)::json ->> 'role') = 'counselor'
        and (
          owner_id = auth.uid()
          or team_id in (
  select ut.team_id from user_teams ut where ut.user_id = auth.uid()
          )
        )
      )
    )
  );
create policy insert_leads_for_tenant_role on leads
  for insert with check (
    tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid
    and (
      (current_setting('request.jwt.claims', true)::json ->> 'role') in ('admin','counselor')
    )
  );
