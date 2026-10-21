// Mirrors supabase/migrations/20261021120000_sensemaking_stakeholder_profiles.sql.
// If the migration changes, change this file with it.

export type Status = "draft" | "submitted";
export type OrgType = "library" | "employer" | "workforce_agency" | "community_group" | "training_provider" | "other";
export type Ring = "inner_circle" | "wider_field";
export type Level = "low" | "medium" | "high";
export type CapitalKey = "natural" | "cultural" | "human" | "social" | "political" | "financial" | "built";

export interface ProfileRow {
  id: string;
  cycle: string;
  author_id: string;
  status: Status;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  /** Last change after submitting; null if never edited after submission. */
  edited_at: string | null;

  name: string | null;
  org_type: OrgType | null;
  org_type_other: string | null;
  description: string | null;
  ring: Ring | null;

  capital_natural_rating: Level | null;
  capital_natural_note: string | null;
  capital_cultural_rating: Level | null;
  capital_cultural_note: string | null;
  capital_human_rating: Level | null;
  capital_human_note: string | null;
  capital_social_rating: Level | null;
  capital_social_note: string | null;
  capital_political_rating: Level | null;
  capital_political_note: string | null;
  capital_financial_rating: Level | null;
  capital_financial_note: string | null;
  capital_built_rating: Level | null;
  capital_built_note: string | null;

  needs: string | null;
  values_held: string | null;
  fears: string | null;
  influence_level: Level | null;
  influence_note: string | null;
  stake: string | null;
  connection_to_labs: string | null;
}

/** The fields an author can write. Everything else is set by the database. */
export type EditableField = Exclude<keyof ProfileRow, "id" | "cycle" | "author_id" | "status" | "created_at" | "updated_at" | "submitted_at" | "edited_at">;
export type ProfileDraft = Pick<ProfileRow, EditableField>;

export const EDITABLE_FIELDS: EditableField[] = [
  "name", "org_type", "org_type_other", "description", "ring",
  "capital_natural_rating", "capital_natural_note",
  "capital_cultural_rating", "capital_cultural_note",
  "capital_human_rating", "capital_human_note",
  "capital_social_rating", "capital_social_note",
  "capital_political_rating", "capital_political_note",
  "capital_financial_rating", "capital_financial_note",
  "capital_built_rating", "capital_built_note",
  "needs", "values_held", "fears", "influence_level", "influence_note", "stake", "connection_to_labs",
];

export interface ConfigRow {
  cycle: string;
  required_profiles: number;
  submissions_open: boolean;
}

export interface AuthorName {
  author_id: string;
  display_name: string;
}
