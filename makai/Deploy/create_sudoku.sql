create table if not exists users (
    uid int primary key,
    created text not null,
    username text not null unique,
    password text not null,
    admin int not null default 0
);

create index if not exists idx_users_username on users(username);

create table if not exists settings (
    sid int primary key,
    uid int not null,
    name text not null,
    value text default null
);

-- Don't need other fields, almost always going to be looking up by user anyway
-- and no user will have a million settings
create index if not exists idx_settings_uid on settings(uid);

create table if not exists puzzles (
    pid int primary key,
    uid int not null,
    solution text not null,
    puzzle text not null,
    puzzleset text not null,
    public int not null default 0
);

-- Generally only looking up by name anyway
create index if not exists idx_puzzles_puzzleset on puzzles(puzzleset);

create table if not exists inprogress (
    ipid int primary key,
    uid int not null,
    pid int not null,
    paused text not null,
    seconds int default null,
    puzzle text
);

-- Separate? Mmmm I'm not sure, the only time you look up progress is 
-- with both, and IDR if sqlite will optimize indexes if they're separate.
create index if not exists idx_inprogress_uid on inprogress(uid);
create index if not exists idx_inprogress_pid on inprogress(pid);

create table if not exists completions (
    cid int primary key,
    uid int not null,
    pid int not null,
    completed text not null,
    seconds int default null
);
