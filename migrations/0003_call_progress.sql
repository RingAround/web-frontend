-- Additive: old agents may continue to report only status and detail.
ALTER TABLE provider_calls ADD COLUMN summary TEXT;
ALTER TABLE provider_calls ADD COLUMN transcript_excerpt TEXT;
