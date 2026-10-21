#!/usr/bin/env bash
# Runs the migration and RLS tests against a throwaway database on a local
# Postgres (16+). Usage: PGHOST=... PGPORT=... PGUSER=postgres supabase/tests/run-local.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
db=sensemaking_rls_test
psql -v ON_ERROR_STOP=1 -q -c "drop database if exists $db" -c "create database $db"
psql -v ON_ERROR_STOP=1 -q -d "$db" -f supabase/tests/olos-stub.sql
for m in supabase/migrations/*.sql; do psql -v ON_ERROR_STOP=1 -q -d "$db" -f "$m"; done
psql -v ON_ERROR_STOP=1 -q -tA -d "$db" -f supabase/tests/rls.sql | tail -1
psql -q -c "drop database $db"
