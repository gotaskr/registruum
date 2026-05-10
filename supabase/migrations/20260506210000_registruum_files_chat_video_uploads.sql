-- Chat / work-order uploads include video; defaults were too small and some device
-- MIME types were missing. Empty browser-reported types are inferred at upload (app).
-- file_size_limit null = no per-bucket cap (Supabase project/plan limits still apply).

update storage.buckets
set
  file_size_limit = null,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/x-matroska',
    'video/mpeg',
    'video/3gpp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
where id = 'registruum-files';
