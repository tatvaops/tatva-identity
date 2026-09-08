-- Allow operators and members to store walkthrough videos next to photos.
update storage.buckets
set
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
where id = 'identity-public';
