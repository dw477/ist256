create table users (
    user_id integer primary key autoincrement,
    name varchar(30) not null,
    username varchar(20) not null unique,
    email varchar(50) not null unique,
    age integer not null,
    address varchar(100) not null,
    phone varchar(15) unique,
    interests text
);

create table posts (
    post_id integer primary key autoincrement,
    title varchar(30) not null,
    category varchar(20) not null,
    type varchar(20) not null,
    content text not null
);

create table preferences (
    preference_id integer primary key autoincrement,
    user_id integer not null,
    category varchar(20) not null,
    type varchar(20) not null,

    foreign key (user_id) references users(user_id)
);