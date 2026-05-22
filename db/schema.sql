-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  points integer default 0 not null,
  level integer default 1 not null,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Categories Table
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text unique not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Debates Table
create table if not exists public.debates (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  category_id text references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  status text default 'active' not null,
  is_live boolean default false not null,
  is_featured boolean default false not null,
  agree_count integer default 0 not null,
  disagree_count integer default 0 not null,
  comment_count integer default 0 not null,
  view_count integer default 0 not null,
  ai_summary text,
  ai_key_points text[] default '{}'::text[],
  ends_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Votes Table
create table if not exists public.votes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  debate_id uuid references public.debates(id) on delete cascade not null,
  vote_type text check (vote_type in ('agree', 'disagree')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, debate_id)
);

-- 5. Bookmarks Table
create table if not exists public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  debate_id uuid references public.debates(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, debate_id)
);

-- 6. Comments Table
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  debate_id uuid references public.debates(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null not null,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  stance text check (stance in ('agree', 'disagree', 'neutral')),
  upvotes integer default 0 not null,
  downvotes integer default 0 not null,
  is_ai_generated boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Comment Votes Table
create table if not exists public.comment_votes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  comment_id uuid references public.comments(id) on delete cascade not null,
  vote_type text check (vote_type in ('up', 'down')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, comment_id)
);

-- 8. Follows Table
create table if not exists public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id)
);

-- 9. Notifications Table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade,
  type text not null, -- 'comment', 'reply', 'follow', 'reputation'
  debate_id uuid references public.debates(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  content text not null,
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Trending Topics Table
create table if not exists public.trending_topics (
  id uuid default uuid_generate_v4() primary key,
  tag text unique not null,
  debate_count integer default 0 not null,
  is_hot boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRIGGERS & RLS PROCEDURES

-- Trigger: Automatically handle Profiles creation on Auth User signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url, points, level)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username', 'Debater'),
    new.raw_user_meta_data->>'avatar_url',
    100, -- initial welcome points
    1
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper function: RPC for updating debate counts
create or replace function public.update_debate_count(
  debate_id uuid,
  field text,
  increment integer
)
returns void as $$
begin
  if field = 'agree_count' then
    update public.debates
    set agree_count = greatest(0, agree_count + increment)
    where id = debate_id;
  elsif field = 'disagree_count' then
    update public.debates
    set disagree_count = greatest(0, disagree_count + increment)
    where id = debate_id;
  end if;
end;
$$ language plpgsql security definer;

-- Helper function: RPC to increment comment count
create or replace function public.increment_comment_count(
  debate_id uuid
)
returns void as $$
begin
  update public.debates
  set comment_count = comment_count + 1
  where id = debate_id;
end;
$$ language plpgsql security definer;

-- Trigger: Automatically create notifications on comment or reply
create or replace function public.handle_new_comment_notification()
returns trigger as $$
declare
  debate_author_id uuid;
  parent_author_id uuid;
  comment_author_name text;
begin
  -- Get sender username
  select display_name into comment_author_name from public.profiles where id = new.author_id;

  -- 1. Notification for Debate Author if it's a root comment
  if new.parent_id is null then
    select author_id into debate_author_id from public.debates where id = new.debate_id;
    if debate_author_id is not null and debate_author_id <> new.author_id then
      insert into public.notifications (user_id, sender_id, type, debate_id, comment_id, content)
      values (
        debate_author_id,
        new.author_id,
        'comment',
        new.debate_id,
        new.id,
        comment_author_name || ' argued on your debate.'
      );
    end if;
  else
    -- 2. Notification for Parent Comment Author if it's a reply
    select author_id into parent_author_id from public.comments where id = new.parent_id;
    if parent_author_id is not null and parent_author_id <> new.author_id then
      insert into public.notifications (user_id, sender_id, type, debate_id, comment_id, content)
      values (
        parent_author_id,
        new.author_id,
        'reply',
        new.debate_id,
        new.id,
        comment_author_name || ' replied to your argument.'
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_comment_created
  after insert on public.comments
  for each row execute procedure public.handle_new_comment_notification();

-- Trigger: Notify on Follows
create or replace function public.handle_new_follow_notification()
returns trigger as $$
declare
  follower_name text;
begin
  select display_name into follower_name from public.profiles where id = new.follower_id;
  insert into public.notifications (user_id, sender_id, type, content)
  values (
    new.following_id,
    new.follower_id,
    'follow',
    follower_name || ' started following you.'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_follow_created
  after insert on public.follows
  for each row execute procedure public.handle_new_follow_notification();

-- Trigger: Add points to profiles
create or replace function public.reward_points()
returns trigger as $$
declare
  target_user uuid;
  points_to_add integer;
begin
  if TG_OP = 'INSERT' then
    if TG_TABLE_NAME = 'debates' then
      target_user := new.author_id;
      points_to_add := 20; -- 20 points for new debate
    elsif TG_TABLE_NAME = 'comments' then
      target_user := new.author_id;
      points_to_add := 10; -- 10 points for new comment
    elsif TG_TABLE_NAME = 'votes' then
      target_user := new.user_id;
      points_to_add := 5;  -- 5 points for voting
    end if;

    if target_user is not null then
      update public.profiles
      set points = points + points_to_add,
          level = floor((points + points_to_add) / 100) + 1
      where id = target_user;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_debate_points
  after insert on public.debates
  for each row execute procedure public.reward_points();

create or replace trigger on_comment_points
  after insert on public.comments
  for each row execute procedure public.reward_points();

create or replace trigger on_vote_points
  after insert on public.votes
  for each row execute procedure public.reward_points();

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.debates enable row level security;
alter table public.votes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.comments enable row level security;
alter table public.comment_votes enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;
alter table public.trending_topics enable row level security;

-- Public Profiles: readable by all, writable by user owner
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Categories: readable by all, writeable only by admins (disabled for now)
create policy "Categories are viewable by everyone" on public.categories for select using (true);

-- Debates: readable by all, writeable by authenticated users
create policy "Debates are viewable by everyone" on public.debates for select using (true);
create policy "Authenticated users can insert debates" on public.debates for insert with check (auth.role() = 'authenticated');
create policy "Authors can update own debates" on public.debates for update using (auth.uid() = author_id);

-- Votes: user owner can select/insert/update/delete
create policy "Users can view own votes" on public.votes for select using (auth.uid() = user_id);
create policy "Users can vote" on public.votes for insert with check (auth.uid() = user_id);
create policy "Users can update own votes" on public.votes for update using (auth.uid() = user_id);
create policy "Users can delete own votes" on public.votes for delete using (auth.uid() = user_id);

-- Bookmarks: user owner can select/insert/delete
create policy "Users can view own bookmarks" on public.bookmarks for select using (auth.uid() = user_id);
create policy "Users can add bookmarks" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "Users can delete bookmarks" on public.bookmarks for delete using (auth.uid() = user_id);

-- Comments: readable by all, insertable by authenticated, updatable by author
create policy "Comments are viewable by everyone" on public.comments for select using (true);
create policy "Users can comment" on public.comments for insert with check (auth.role() = 'authenticated');
create policy "Authors can update own comments" on public.comments for update using (auth.uid() = author_id);

-- Comment Votes: user owner can select/insert/update/delete
create policy "Users can view own comment votes" on public.comment_votes for select using (auth.uid() = user_id);
create policy "Users can vote on comments" on public.comment_votes for insert with check (auth.uid() = user_id);
create policy "Users can update comment votes" on public.comment_votes for update using (auth.uid() = user_id);
create policy "Users can delete comment votes" on public.comment_votes for delete using (auth.uid() = user_id);

-- Follows: follower/following can select, follower can insert/delete
create policy "Follows are viewable by everyone" on public.follows for select using (true);
create policy "Users can follow others" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow others" on public.follows for delete using (auth.uid() = follower_id);

-- Notifications: user owner can select/update/delete
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- Trending Topics: readable by all
create policy "Trending topics are viewable by everyone" on public.trending_topics for select using (true);
