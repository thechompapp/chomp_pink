--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 16.8 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: naf
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO naf;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: trigger_set_timestamp(); Type: FUNCTION; Schema: public; Owner: doof_user
--

CREATE FUNCTION public.trigger_set_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_set_timestamp() OWNER TO doof_user;

--
-- Name: validate_listitem_item_id(); Type: FUNCTION; Schema: public; Owner: doof_user
--

CREATE FUNCTION public.validate_listitem_item_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.item_type = 'restaurant' THEN
    IF NOT EXISTS (SELECT 1 FROM restaurants WHERE id = NEW.item_id) THEN
      RAISE EXCEPTION 'Invalid restaurant ID % for item_type ''restaurant''.', NEW.item_id;
    END IF;
  ELSIF NEW.item_type = 'dish' THEN
    IF NOT EXISTS (SELECT 1 FROM dishes WHERE id = NEW.item_id) THEN
      RAISE EXCEPTION 'Invalid dish ID % for item_type ''dish''.', NEW.item_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid item_type %. Must be ''restaurant'' or ''dish''.', NEW.item_type;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_listitem_item_id() OWNER TO doof_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cities; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.cities (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    has_boroughs boolean DEFAULT false NOT NULL
);


ALTER TABLE public.cities OWNER TO doof_user;

--
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.cities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cities_id_seq OWNER TO doof_user;

--
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- Name: cuisines; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.cuisines (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.cuisines OWNER TO doof_user;

--
-- Name: cuisines_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.cuisines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cuisines_id_seq OWNER TO doof_user;

--
-- Name: cuisines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.cuisines_id_seq OWNED BY public.cuisines.id;


--
-- Name: dishes; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.dishes (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    restaurant_id integer NOT NULL,
    price character varying(50),
    adds integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_common boolean DEFAULT false
);


ALTER TABLE public.dishes OWNER TO doof_user;

--
-- Name: dishes_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.dishes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dishes_id_seq OWNER TO doof_user;

--
-- Name: dishes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.dishes_id_seq OWNED BY public.dishes.id;


--
-- Name: dishhashtags; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.dishhashtags (
    dish_id integer NOT NULL,
    hashtag_id integer NOT NULL
);


ALTER TABLE public.dishhashtags OWNER TO doof_user;

--
-- Name: dishvotes; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.dishvotes (
    id integer NOT NULL,
    dish_id integer NOT NULL,
    user_id integer NOT NULL,
    vote_type character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dishvotes_vote_type_check CHECK (((vote_type)::text = ANY ((ARRAY['up'::character varying, 'neutral'::character varying, 'down'::character varying])::text[])))
);


ALTER TABLE public.dishvotes OWNER TO doof_user;

--
-- Name: dishvotes_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.dishvotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dishvotes_id_seq OWNER TO doof_user;

--
-- Name: dishvotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.dishvotes_id_seq OWNED BY public.dishvotes.id;


--
-- Name: engagements; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.engagements (
    id integer NOT NULL,
    user_id integer,
    item_id integer NOT NULL,
    item_type character varying(50) NOT NULL,
    engagement_type character varying(20) NOT NULL,
    engagement_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT engagements_engagement_type_check CHECK (((engagement_type)::text = ANY (ARRAY[('view'::character varying)::text, ('click'::character varying)::text, ('add_to_list'::character varying)::text, ('share'::character varying)::text]))),
    CONSTRAINT engagements_item_type_check CHECK (((item_type)::text = ANY (ARRAY[('restaurant'::character varying)::text, ('dish'::character varying)::text, ('list'::character varying)::text])))
);


ALTER TABLE public.engagements OWNER TO doof_user;

--
-- Name: engagements_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.engagements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.engagements_id_seq OWNER TO doof_user;

--
-- Name: engagements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.engagements_id_seq OWNED BY public.engagements.id;


--
-- Name: hashtags; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.hashtags (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    category character varying(50)
);


ALTER TABLE public.hashtags OWNER TO doof_user;

--
-- Name: hashtags_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.hashtags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hashtags_id_seq OWNER TO doof_user;

--
-- Name: hashtags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.hashtags_id_seq OWNED BY public.hashtags.id;


--
-- Name: list_follows; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.list_follows (
    user_id integer NOT NULL,
    list_id integer NOT NULL
);


ALTER TABLE public.list_follows OWNER TO doof_user;

--
-- Name: listitems; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.listitems (
    id integer NOT NULL,
    list_id integer NOT NULL,
    item_type character varying(20) NOT NULL,
    item_id integer NOT NULL,
    added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    CONSTRAINT listitems_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['dish'::character varying, 'restaurant'::character varying])::text[])))
);


ALTER TABLE public.listitems OWNER TO doof_user;

--
-- Name: listitems_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.listitems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.listitems_id_seq OWNER TO doof_user;

--
-- Name: listitems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.listitems_id_seq OWNED BY public.listitems.id;


--
-- Name: lists; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.lists (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    saved_count integer DEFAULT 0 NOT NULL,
    city_name character varying(100),
    tags text[],
    is_public boolean DEFAULT true NOT NULL,
    created_by_user boolean DEFAULT false NOT NULL,
    creator_handle character varying(100),
    is_following boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer,
    list_type character varying(20) NOT NULL,
    CONSTRAINT lists_list_type_check CHECK (((list_type)::text = ANY ((ARRAY['restaurant'::character varying, 'dish'::character varying, 'mixed'::character varying])::text[])))
);


ALTER TABLE public.lists OWNER TO doof_user;

--
-- Name: lists_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.lists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lists_id_seq OWNER TO doof_user;

--
-- Name: lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.lists_id_seq OWNED BY public.lists.id;


--
-- Name: neighborhoods; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.neighborhoods (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    city_id integer NOT NULL,
    borough character varying(100),
    zipcode_ranges text[] DEFAULT '{}'::text[],
    geom public.geometry(MultiPolygon,4326),
    parent_id integer,
    location_level smallint
);


ALTER TABLE public.neighborhoods OWNER TO doof_user;

--
-- Name: neighborhoods_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.neighborhoods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.neighborhoods_id_seq OWNER TO doof_user;

--
-- Name: neighborhoods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.neighborhoods_id_seq OWNED BY public.neighborhoods.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO doof_user;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO doof_user;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: restaurant_chains; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.restaurant_chains (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    website character varying(2048),
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.restaurant_chains OWNER TO doof_user;

--
-- Name: restaurant_chains_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.restaurant_chains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.restaurant_chains_id_seq OWNER TO doof_user;

--
-- Name: restaurant_chains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.restaurant_chains_id_seq OWNED BY public.restaurant_chains.id;


--
-- Name: restauranthashtags; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.restauranthashtags (
    restaurant_id integer NOT NULL,
    hashtag_id integer NOT NULL
);


ALTER TABLE public.restauranthashtags OWNER TO doof_user;

--
-- Name: restaurants; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.restaurants (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    neighborhood_id integer,
    city_id integer NOT NULL,
    zip_code character varying(10),
    phone character varying(20),
    website character varying(255),
    google_place_id character varying(255),
    latitude numeric(9,6),
    longitude numeric(9,6),
    adds integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    chain_id integer
);


ALTER TABLE public.restaurants OWNER TO doof_user;

--
-- Name: restaurants_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.restaurants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.restaurants_id_seq OWNER TO doof_user;

--
-- Name: restaurants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.restaurants_id_seq OWNED BY public.restaurants.id;


--
-- Name: reviewvotes; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.reviewvotes (
    id integer NOT NULL,
    dish_id integer,
    vote_type text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviewvotes_vote_type_check CHECK ((vote_type = ANY (ARRAY['up'::text, 'neutral'::text, 'down'::text])))
);


ALTER TABLE public.reviewvotes OWNER TO doof_user;

--
-- Name: reviewvotes_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.reviewvotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviewvotes_id_seq OWNER TO doof_user;

--
-- Name: reviewvotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.reviewvotes_id_seq OWNED BY public.reviewvotes.id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.submissions (
    id integer NOT NULL,
    user_id integer,
    type character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    location text,
    tags text[],
    place_id character varying(255),
    city character varying(100),
    neighborhood character varying(100),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    reviewed_at timestamp with time zone,
    reviewed_by integer,
    restaurant_id integer,
    restaurant_name character varying(255),
    CONSTRAINT submissions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT submissions_type_check CHECK (((type)::text = ANY ((ARRAY['restaurant'::character varying, 'dish'::character varying])::text[])))
);


ALTER TABLE public.submissions OWNER TO doof_user;

--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.submissions_id_seq OWNER TO doof_user;

--
-- Name: submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.submissions_id_seq OWNED BY public.submissions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password_hash character varying(255),
    account_type character varying(20) DEFAULT 'user'::character varying NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying,
    CONSTRAINT users_account_type_check CHECK (((account_type)::text = ANY ((ARRAY['user'::character varying, 'contributor'::character varying, 'superuser'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO doof_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: doof_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO doof_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doof_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- Name: cuisines id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.cuisines ALTER COLUMN id SET DEFAULT nextval('public.cuisines_id_seq'::regclass);


--
-- Name: dishes id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishes ALTER COLUMN id SET DEFAULT nextval('public.dishes_id_seq'::regclass);


--
-- Name: dishvotes id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishvotes ALTER COLUMN id SET DEFAULT nextval('public.dishvotes_id_seq'::regclass);


--
-- Name: engagements id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.engagements ALTER COLUMN id SET DEFAULT nextval('public.engagements_id_seq'::regclass);


--
-- Name: hashtags id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.hashtags ALTER COLUMN id SET DEFAULT nextval('public.hashtags_id_seq'::regclass);


--
-- Name: listitems id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.listitems ALTER COLUMN id SET DEFAULT nextval('public.listitems_id_seq'::regclass);


--
-- Name: lists id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.lists ALTER COLUMN id SET DEFAULT nextval('public.lists_id_seq'::regclass);


--
-- Name: neighborhoods id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.neighborhoods ALTER COLUMN id SET DEFAULT nextval('public.neighborhoods_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: restaurant_chains id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restaurant_chains ALTER COLUMN id SET DEFAULT nextval('public.restaurant_chains_id_seq'::regclass);


--
-- Name: restaurants id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restaurants ALTER COLUMN id SET DEFAULT nextval('public.restaurants_id_seq'::regclass);


--
-- Name: reviewvotes id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.reviewvotes ALTER COLUMN id SET DEFAULT nextval('public.reviewvotes_id_seq'::regclass);


--
-- Name: submissions id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.submissions ALTER COLUMN id SET DEFAULT nextval('public.submissions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.cities (id, name, has_boroughs) FROM stdin;
1	New York	f
2	Los Angeles	f
3	Chicago	f
\.


--
-- Data for Name: cuisines; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.cuisines (id, name) FROM stdin;
1	Italian
2	Mexican
3	Chinese
4	Indian
5	Japanese
6	Thai
7	American
8	French
9	Mediterranean
10	Vietnamese
11	Korean
12	Spanish
13	Greek
14	Lebanese
15	Turkish
16	Brazilian
17	Caribbean
18	German
19	Moroccan
20	Peruvian
\.


--
-- Data for Name: dishes; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.dishes (id, name, description, restaurant_id, price, adds, created_at, updated_at, is_common) FROM stdin;
5	Spaghetti Carbonara	\N	23	\N	0	2025-04-25 11:45:56.29817-04	2025-04-25 11:45:56.29817-04	f
1	Margherita Pizza	\N	27	\N	0	2025-04-25 11:45:56.29817-04	2025-05-16 09:32:40.966743-04	f
2	Sushi Platter	\N	11	\N	0	2025-04-25 11:45:56.29817-04	2025-05-16 09:41:14.64371-04	f
3	Spicy Tacos	\N	12	\N	0	2025-04-25 11:45:56.29817-04	2025-05-16 10:22:47.011884-04	f
4	Bbq Ribs	\N	22	\N	0	2025-04-25 11:45:56.29817-04	2025-05-17 11:26:48.31059-04	f
\.


--
-- Data for Name: dishhashtags; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.dishhashtags (dish_id, hashtag_id) FROM stdin;
\.


--
-- Data for Name: dishvotes; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.dishvotes (id, dish_id, user_id, vote_type, created_at) FROM stdin;
\.


--
-- Data for Name: engagements; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.engagements (id, user_id, item_id, item_type, engagement_type, engagement_timestamp) FROM stdin;
1	2	6	restaurant	click	2025-04-13 17:02:19.849404-04
2	2	6	restaurant	view	2025-04-13 17:02:19.905384-04
3	2	4	list	click	2025-04-13 17:12:46.796601-04
4	2	6	restaurant	click	2025-04-13 17:17:10.45719-04
5	2	6	restaurant	view	2025-04-13 17:17:10.480178-04
6	2	2	list	click	2025-04-13 17:17:13.370235-04
7	2	5	restaurant	click	2025-04-14 12:45:29.06116-04
8	2	9	restaurant	click	2025-04-14 12:46:48.904004-04
9	\N	6	restaurant	click	2025-04-14 16:55:33.072146-04
10	2	9	dish	click	2025-04-14 17:29:09.217543-04
11	2	5	restaurant	click	2025-04-14 17:34:58.523467-04
12	2	5	restaurant	view	2025-04-14 17:38:59.235302-04
13	2	6	restaurant	click	2025-04-15 21:25:54.307538-04
14	2	6	restaurant	view	2025-04-15 21:25:54.391872-04
15	2	12	dish	click	2025-04-15 21:25:57.974116-04
16	2	9	dish	click	2025-04-15 21:46:24.076219-04
17	2	9	dish	view	2025-04-15 21:46:24.129951-04
18	2	1	restaurant	click	2025-04-15 22:23:54.263765-04
19	2	1	restaurant	view	2025-04-15 22:23:54.323904-04
20	2	21	list	click	2025-04-15 22:24:34.004267-04
21	2	4	dish	click	2025-04-15 22:25:24.777111-04
22	2	4	dish	view	2025-04-15 22:25:24.800705-04
23	2	11	restaurant	view	2025-04-16 08:45:49.747888-04
24	2	12	restaurant	view	2025-04-16 08:56:10.076752-04
25	2	13	restaurant	view	2025-04-17 08:17:07.047257-04
26	2	13	restaurant	view	2025-04-17 08:17:37.274905-04
27	2	13	restaurant	view	2025-04-17 08:17:37.277276-04
28	2	3	dish	click	2025-04-17 09:55:42.840691-04
29	2	3	dish	view	2025-04-17 09:55:42.88211-04
30	2	22	list	click	2025-04-17 09:58:08.479346-04
31	2	19	restaurant	view	2025-04-18 14:44:02.353367-04
32	2	6	restaurant	click	2025-04-18 15:31:02.105358-04
33	2	6	restaurant	view	2025-04-18 15:31:02.191447-04
34	2	28	restaurant	view	2025-04-18 15:58:25.69312-04
35	2	69	restaurant	view	2025-04-18 15:58:59.342934-04
36	2	70	restaurant	view	2025-04-18 16:01:00.728957-04
37	2	60	restaurant	view	2025-04-18 16:01:26.57947-04
38	2	70	restaurant	click	2025-04-19 10:06:23.108819-04
39	2	70	restaurant	view	2025-04-19 10:10:08.983937-04
40	2	70	restaurant	view	2025-04-19 10:10:10.584411-04
41	2	2	list	click	2025-04-19 10:10:14.928826-04
42	2	22	list	click	2025-04-19 12:45:20.649314-04
43	2	66	restaurant	view	2025-04-19 20:25:40.531262-04
44	2	49	restaurant	view	2025-04-19 20:26:27.990105-04
45	2	49	restaurant	view	2025-04-19 20:27:39.776508-04
46	2	12	restaurant	click	2025-04-20 08:01:16.599033-04
47	2	70	restaurant	click	2025-04-20 08:06:52.061631-04
48	2	11	restaurant	click	2025-04-20 10:22:07.999143-04
49	2	70	restaurant	click	2025-04-20 12:25:11.914235-04
50	2	11	restaurant	click	2025-04-20 12:31:39.265584-04
51	\N	19	list	click	2025-04-20 21:44:39.604395-04
52	\N	49	restaurant	click	2025-04-20 21:54:55.661909-04
53	2	70	restaurant	click	2025-04-20 22:07:57.774359-04
54	2	49	restaurant	click	2025-04-21 18:47:38.155473-04
55	2	11	restaurant	click	2025-04-21 19:35:51.41952-04
56	2	70	restaurant	click	2025-04-21 19:47:18.102757-04
57	2	2	list	click	2025-04-22 08:04:40.591642-04
58	2	19	list	click	2025-04-22 08:05:54.574198-04
59	2	21	list	click	2025-04-22 08:11:31.350909-04
60	2	11	restaurant	click	2025-04-23 08:07:38.274703-04
61	2	66	restaurant	click	2025-04-23 08:07:43.460228-04
62	2	49	restaurant	click	2025-04-23 08:07:49.487851-04
65	\N	1	list	view	2025-04-25 11:45:01.090113-04
66	\N	1	list	add_to_list	2025-04-25 11:45:01.090113-04
67	\N	3	list	view	2025-04-25 11:45:01.090113-04
68	\N	3	list	add_to_list	2025-04-25 11:45:01.090113-04
69	\N	5	list	view	2025-04-25 11:45:01.090113-04
70	\N	5	list	add_to_list	2025-04-25 11:45:01.090113-04
71	\N	6	list	view	2025-04-25 11:45:01.090113-04
72	\N	7	list	view	2025-04-25 11:45:01.090113-04
73	\N	1	dish	click	2025-04-25 11:46:16.100414-04
74	\N	1	dish	view	2025-04-25 11:46:16.100414-04
75	\N	2	dish	click	2025-04-25 11:46:16.100414-04
76	\N	2	dish	view	2025-04-25 11:46:16.100414-04
77	\N	3	dish	click	2025-04-25 11:46:16.100414-04
78	\N	3	dish	view	2025-04-25 11:46:16.100414-04
79	\N	4	dish	click	2025-04-25 11:46:16.100414-04
80	\N	4	dish	view	2025-04-25 11:46:16.100414-04
81	\N	5	dish	click	2025-04-25 11:46:16.100414-04
82	\N	5	dish	view	2025-04-25 11:46:16.100414-04
\.


--
-- Data for Name: hashtags; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.hashtags (id, name, category) FROM stdin;
1	pizza	Cuisines
2	italian	Cuisines
3	classic	Attributes
4	slice	Attributes
5	burger	Cuisines
6	american	Cuisines
7	fast-food	Attributes
8	fries	Specific Foods
9	shakes	Beverages
10	deli	Cuisines
11	sandwiches	Specific Foods
12	pastrami	Specific Foods
13	tacos	Cuisines
14	mexican	Cuisines
15	casual	Attributes
16	quick	Attributes
17	pasta	Cuisines
18	cozy	Attributes
19	romantic	Attributes
20	ramen	Cuisines
21	japanese	Cuisines
22	noodles	Specific Foods
23	pork buns	Specific Foods
24	falafel	Specific Foods
25	middle eastern	Cuisines
26	cheap eats	Attributes
27	vegetarian	Dietary
28	meat	Dietary
29	beef	Dietary
30	pork	Dietary
31	spicy	Attributes
32	cactus	Specific Foods
33	cheese	Ingredients
34	nyc	Location
35	must try	Attributes
36	california	Location
37	healthy	Dietary
38	sushi	Cuisines
39	vegan	Dietary
40	brunch	Meal
41	celebrity spot	Attributes
42	korean	Cuisines
43	bbq	Cuisines
44	fusion	Cuisines
45	deep dish	Specific Foods
46	hot dog	Specific Foods
47	midwest	Location
48	steakhouse	Cuisines
49	seafood	Cuisines
50	breakfast	Meal
51	thai	Cuisines
52	vietnamese	Cuisines
53	pho	Specific Foods
54	indian	Cuisines
55	curry	Specific Foods
56	mediterranean	Cuisines
57	greek	Cuisines
58	bakery	Attributes
59	pastries	Specific Foods
60	coffee	Beverages
61	cocktails	Beverages
62	wine bar	Attributes
63	brewery	Attributes
64	comfort food	Attributes
65	fine dining	Attributes
66	food truck	Attributes
67	late night	Attributes
68	organic	Attributes
69	outdoor seating	Attributes
70	small plates	Attributes
71	tomato	Ingredients
72	basil	Ingredients
73	onion	Ingredients
74	lettuce	Ingredients
75	corn	Ingredients
76	cilantro	Ingredients
77	street food	Attributes
78	fish	Ingredients
79	raw	Dietary
80	rice	Ingredients
81	wasabi	Ingredients
82	broth	Ingredients
83	egg	Ingredients
84	greens	Ingredients
85	lunch	Meal
86	light	Attributes
87	baked	Attributes
88	Italian	cuisine
89	Mexican	cuisine
90	American	cuisine
91	Fusion	cuisine
92	Fine Dining	cuisine
98	#american	tag
99	spanish	\N
100	south asian-american	\N
101	french	\N
102	modern	\N
103	asian	\N
104	eastern mediterranean	\N
105	ecuadorian	\N
106	latin american	\N
107	south american	\N
108	european	\N
109	natural wine	\N
\.


--
-- Data for Name: list_follows; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.list_follows (user_id, list_id) FROM stdin;
\.


--
-- Data for Name: listitems; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.listitems (id, list_id, item_type, item_id, added_at, notes) FROM stdin;
12	2	dish	1	2025-04-25 11:51:08.476493-04	\N
13	2	dish	4	2025-04-25 11:51:08.476493-04	\N
14	3	dish	2	2025-04-25 11:51:08.476493-04	\N
15	4	dish	5	2025-04-25 11:51:08.476493-04	\N
16	5	dish	3	2025-04-25 11:51:08.476493-04	\N
\.


--
-- Data for Name: lists; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.lists (id, name, description, saved_count, city_name, tags, is_public, created_by_user, creator_handle, is_following, created_at, updated_at, user_id, list_type) FROM stdin;
1	NYC Italian Gems	\N	0	New York	{italian,pizza}	t	f	@foodie	f	2025-04-02 11:31:21.233673-04	2025-04-13 17:10:47.41106-04	\N	restaurant
3	LA Fusion Favorites	\N	0	Los Angeles	{fusion,mexican}	t	f	@taster	f	2025-04-02 11:31:21.233673-04	2025-04-13 17:10:47.41106-04	\N	restaurant
5	Chicago BBQ Spots	\N	0	Chicago	{#american,bbq}	t	f	@bbqlover	f	2025-04-02 11:31:21.233673-04	2025-04-13 19:17:47.090691-04	\N	restaurant
6	Noah's List	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:03:16.96809-04	2025-04-14 19:03:16.96809-04	2	restaurant
7	Noah's List	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:03:16.994618-04	2025-04-14 19:03:16.994618-04	2	restaurant
8	Test List	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:03:32.29789-04	2025-04-14 19:03:32.29789-04	2	restaurant
9	Test List	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:03:32.315041-04	2025-04-14 19:03:32.315041-04	2	restaurant
10	Noah's 2 List	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:12:08.808888-04	2025-04-14 19:12:08.808888-04	2	dish
11	Noah's 2 List	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:12:08.821915-04	2025-04-14 19:12:08.821915-04	2	dish
12	jdsfkshfkds	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:15:29.195417-04	2025-04-14 19:15:29.195417-04	2	restaurant
13	jdsfkshfkds	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:15:29.206535-04	2025-04-14 19:15:29.206535-04	2	restaurant
14	dffsfsfdsfsf	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:23:14.402642-04	2025-04-14 19:23:14.402642-04	2	restaurant
15	dffsfsfdsfsf	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:23:14.414223-04	2025-04-14 19:23:14.414223-04	2	restaurant
16	zzzzzzzz	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:25:57.535787-04	2025-04-14 19:25:57.535787-04	2	restaurant
17	zzzzzzzz	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:25:59.552501-04	2025-04-14 19:25:59.552501-04	2	restaurant
18	gggggggg	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:26:11.041767-04	2025-04-14 19:26:11.041767-04	2	dish
19	gggggggg	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:26:13.0612-04	2025-04-14 19:26:13.0612-04	2	dish
20	lklklklklkl	\N	0	\N	{}	t	f	admin	f	2025-04-14 19:36:45.84422-04	2025-04-14 19:36:45.84422-04	2	restaurant
21	Noah's List ABC	\N	0	\N	{}	t	f	admin	f	2025-04-15 21:31:40.937392-04	2025-04-15 21:31:40.937392-04	2	dish
22	JWise Italian Food	\N	0	\N	{}	t	f	admin	f	2025-04-17 09:55:08.179364-04	2025-04-17 09:58:02.108027-04	2	restaurant
4	NYC Fine Dining	\N	0	New York	{"fine dining"}	t	f	@gourmet	f	2025-04-02 11:31:21.233673-04	2025-04-21 19:42:47.243367-04	\N	restaurant
23	ABC Listssssssss	\N	0	\N	{}	t	f	admin	f	2025-04-22 08:01:28.083178-04	2025-04-22 08:01:28.083178-04	2	restaurant
24	noah&#x27;s listssssfdsfddskljfasklf	\N	0	\N	{}	t	f	admin	f	2025-04-22 08:11:17.222404-04	2025-04-22 08:11:17.222404-04	2	restaurant
2	Chicago Comfort Foods	\N	1	Chicago	{#american,diner}	t	f	@eater	f	2025-04-02 11:31:21.233673-04	2025-04-23 14:33:45.37933-04	\N	restaurant
\.


--
-- Data for Name: neighborhoods; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.neighborhoods (id, name, city_id, borough, zipcode_ranges, geom, parent_id, location_level) FROM stdin;
126	Williamsburg	1	\N	{11249}	\N	\N	2
3	Lower East Side	1	\N	{10002,10009}	\N	\N	1
6	East Village	1	\N	{10009}	\N	\N	1
5	West Village	1	\N	{10014}	\N	\N	1
4	Chelsea	1	\N	{10001,10011}	\N	\N	1
1	Greenwich Village	1	\N	{10012,10014}	\N	\N	1
2	Midtown	1	\N	{10001,10016,10017,10018,10019,10022,10036}	\N	\N	1
22	Bedford-Stuyvesant	1	\N	{11205,11206,11216,11221,11233,11238}	\N	\N	1
23	Carroll Gardens	1	\N	{11231}	\N	\N	1
24	Cobble Hill	1	\N	{11201}	\N	\N	1
25	Brooklyn Heights	1	\N	{11201}	\N	\N	1
26	Fort Greene	1	\N	{11205,11217}	\N	\N	1
27	Red Hook	1	\N	{11231}	\N	\N	1
28	Prospect Heights	1	\N	{11238}	\N	\N	1
29	Gowanus	1	\N	{11215,11217}	\N	\N	1
30	Clinton Hill	1	\N	{11205,11238}	\N	\N	1
31	Sunset Park	1	\N	{11220,11232}	\N	\N	1
32	Boerum Hill	1	\N	{11201,11217}	\N	\N	1
33	Bay Ridge	1	\N	{11209}	\N	\N	1
34	Downtown Brooklyn	1	\N	{11201}	\N	\N	1
35	Flatbush	1	\N	{11210,11226}	\N	\N	1
36	Windsor Terrace	1	\N	{11215,11218}	\N	\N	1
37	East Williamsburg	1	\N	{11206,11211}	\N	\N	1
38	Marine Park	1	\N	{11234}	\N	\N	1
39	Sheepshead Bay	1	\N	{11229,11235}	\N	\N	1
40	Brighton Beach	1	\N	{11235}	\N	\N	1
41	Upper East Side	1	\N	{10021,10028,10044,10065,10075,10128}	\N	\N	1
42	Nolita	1	\N	{10012}	\N	\N	1
43	Gramercy	1	\N	{10010}	\N	\N	1
44	Hell’s Kitchen	1	\N	{10018,10019,10036}	\N	\N	1
45	Inwood	1	\N	{10034}	\N	\N	1
46	Washington Heights	1	\N	{10032,10033,10040}	\N	\N	1
47	Battery Park City	1	\N	{10280,10282}	\N	\N	1
48	Murray Hill	1	\N	{10016}	\N	\N	1
49	Kips Bay	1	\N	{10010,10016}	\N	\N	1
50	Stuyvesant Town	1	\N	{10009}	\N	\N	1
51	Hudson Yards	1	\N	{10001,10018}	\N	\N	1
52	Lincoln Square	1	\N	{10023}	\N	\N	1
53	Flushing	1	\N	{11354,11355,11358,11367}	\N	\N	1
54	Forest Hills	1	\N	{11375}	\N	\N	1
55	Sunnyside	1	\N	{11104}	\N	\N	1
56	Woodside	1	\N	{11377}	\N	\N	1
57	Rego Park	1	\N	{11374}	\N	\N	1
58	Jamaica	1	\N	{11432,11433,11434,11435,11436}	\N	\N	1
59	Ridgewood	1	\N	{11385}	\N	\N	1
15	Various	2	\N	{}	\N	\N	2
18	Manhattan	1	Manhattan	{}	\N	\N	2
19	Brooklyn	1	Brooklyn	{}	\N	\N	2
20	Downtown LA	2	\N	{}	\N	\N	2
21	Wicker Park	3	\N	{}	\N	\N	2
60	Union Square	1	Manhattan	{10003}	\N	\N	2
61	Astoria	1	Queens	{11102,11103,11105,11106}	\N	\N	2
62	Long Island City	1	Queens	{11101,11109}	\N	\N	2
63	Greenpoint	1	Brooklyn	{11222}	\N	\N	2
64	Bushwick	1	Brooklyn	{11207,11221,11237}	\N	\N	2
65	Park Slope	1	Brooklyn	{11215,11217}	\N	\N	2
66	Midwood	1	Brooklyn	{11230}	\N	\N	2
67	Gravesend	1	Brooklyn	{11223}	\N	\N	2
68	Bensonhurst	1	Brooklyn	{11214}	\N	\N	2
69	Dyker Heights	1	Brooklyn	{11228}	\N	\N	2
70	Crown Heights	1	Brooklyn	{11213,11216,11225,11233,11238}	\N	\N	2
71	Prospect Lefferts Gardens	1	Brooklyn	{11225}	\N	\N	2
72	South Slope	1	Brooklyn	{11215}	\N	\N	2
73	DUMBO	1	Brooklyn	{11201}	\N	\N	2
10	Gold Coast	3	\N	{60610,60611}	\N	\N	2
8	Lincoln Park	3	\N	{60610,60614}	\N	\N	2
7	River North	3	\N	{60654,60610,60611}	\N	\N	2
9	West Loop	3	\N	{60607,60661}	\N	\N	2
12	Arts District	2	\N	{90012,90014}	\N	\N	2
17	Chinatown	2	\N	{90012}	\N	\N	2
13	La Brea	2	\N	{90036}	\N	\N	2
16	Little Tokyo	2	\N	{90012}	\N	\N	2
11	Silver Lake	2	\N	{90026,90039,90029}	\N	\N	2
14	Venice	2	\N	{90291}	\N	\N	2
74	Greenwood Heights	1	Brooklyn	{11232}	\N	\N	2
75	Upper West Side	1	Manhattan	{10023,10024,10025}	\N	\N	2
76	Harlem	1	Manhattan	{10026,10027,10030,10037,10039}	\N	\N	2
77	Morningside Heights	1	Manhattan	{10027}	\N	\N	2
78	Roosevelt Island	1	Manhattan	{10044}	\N	\N	2
79	SoHo	1	Manhattan	{10012,10013}	\N	\N	2
80	Tribeca	1	Manhattan	{10007,10013}	\N	\N	2
81	Chinatown	1	Manhattan	{10013}	\N	\N	2
82	Financial District	1	Manhattan	{10004,10005,10006,10007,10038,10280}	\N	\N	2
83	Two Bridges	1	Manhattan	{10002}	\N	\N	2
84	Turtle Bay	1	Manhattan	{10017,10022}	\N	\N	2
85	Garment District	1	Manhattan	{10018}	\N	\N	2
86	NoMad	1	Manhattan	{10001,10016}	\N	\N	2
87	Flatiron District	1	Manhattan	{10010}	\N	\N	2
88	Bowery	1	Manhattan	{10002}	\N	\N	2
89	Alphabet City	1	Manhattan	{10009}	\N	\N	2
90	Bush Terminal	1	Brooklyn	{11232}	\N	\N	2
91	Bath Beach	1	Brooklyn	{11214}	\N	\N	2
92	Cypress Hills	1	Brooklyn	{11208}	\N	\N	2
93	Canarsie	1	Brooklyn	{11236}	\N	\N	2
94	Coney Island	1	Brooklyn	{11224}	\N	\N	2
95	Seagate	1	Brooklyn	{11224}	\N	\N	2
96	East Flatbush	1	Brooklyn	{11203,11212,11226}	\N	\N	2
97	Kensington	1	Brooklyn	{11218}	\N	\N	2
98	Manhattan Beach	1	Brooklyn	{11235}	\N	\N	2
99	Mill Basin	1	Brooklyn	{11234}	\N	\N	2
100	Springfield Gardens	1	Queens	{11413}	\N	\N	2
101	Cambria Heights	1	Queens	{11411}	\N	\N	2
102	Hollis	1	Queens	{11423}	\N	\N	2
103	Laurelton	1	Queens	{11413}	\N	\N	2
104	Briarwood	1	Queens	{11435}	\N	\N	2
105	Kew Gardens	1	Queens	{11415}	\N	\N	2
106	Jackson Heights	1	Queens	{11372,11370}	\N	\N	2
107	Elmhurst	1	Queens	{11373}	\N	\N	2
108	Corona	1	Queens	{11368}	\N	\N	2
109	Astoria Heights	1	Queens	{11370}	\N	\N	2
110	East Elmhurst	1	Queens	{11369,11370}	\N	\N	2
111	Maspeth	1	Queens	{11378}	\N	\N	2
112	Fresh Meadows	1	Queens	{11365,11366}	\N	\N	2
113	College Point	1	Queens	{11356}	\N	\N	2
114	Whitestone	1	Queens	{11357}	\N	\N	2
115	Bayside	1	Queens	{11360,11361,11364}	\N	\N	2
116	Douglaston	1	Queens	{11362,11363}	\N	\N	2
117	Little Neck	1	Queens	{11362}	\N	\N	2
118	Glen Oaks	1	Queens	{11004}	\N	\N	2
119	Bellerose	1	Queens	{11426}	\N	\N	2
120	Rosedale	1	Queens	{11422}	\N	\N	2
121	Far Rockaway	1	Queens	{11691}	\N	\N	2
122	Arverne	1	Queens	{11692}	\N	\N	2
123	Rockaway Beach	1	Queens	{11693}	\N	\N	2
124	Neponsit	1	Queens	{11694}	\N	\N	2
125	Belle Harbor	1	Queens	{11694}	\N	\N	2
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.refresh_tokens (id, user_id, token, created_at, expires_at) FROM stdin;
1	2	423b7cb1-dc1c-4d45-8077-bb196dfb2875	2025-05-10 10:30:15.101867-04	2025-05-24 18:55:23.062-04
\.


--
-- Data for Name: restaurant_chains; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.restaurant_chains (id, name, website, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: restauranthashtags; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.restauranthashtags (restaurant_id, hashtag_id) FROM stdin;
22	2
22	17
23	2
23	70
24	42
24	48
25	2
25	17
12	1
27	49
27	65
30	2
30	17
31	54
32	14
34	51
36	2
37	38
38	21
38	65
39	48
39	3
40	6
42	25
44	42
46	1
47	48
48	70
49	38
50	6
51	54
52	42
52	20
53	57
53	18
54	2
54	17
55	10
55	12
59	38
60	18
63	2
63	3
65	56
67	1
357	57
359	99
360	100
390	21
390	44
390	101
391	51
391	102
391	103
393	25
393	56
393	104
394	105
394	106
394	107
401	65
401	101
401	108
402	42
402	65
402	103
403	62
403	70
403	109
404	2
404	17
404	108
\.


--
-- Data for Name: restaurants; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.restaurants (id, name, address, neighborhood_id, city_id, zip_code, phone, website, google_place_id, latitude, longitude, adds, created_at, updated_at, chain_id) FROM stdin;
38	Masa	2770 Third Ave, Bronx, NY 10455, USA	1	1	\N	\N	\N	\N	40.814599	-73.919820	0	2025-04-18 15:54:44.357031-04	2025-05-17 11:25:27.181274-04	\N
54	Misi	329 Kent Ave, Brooklyn, NY 11249, USA	1	1	\N	\N	\N	\N	40.713401	-73.967187	0	2025-04-18 15:54:44.414173-04	2025-05-17 11:25:27.223504-04	\N
393	Zaytinya	\N	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 22:03:06.72-04	2025-05-14 22:03:06.72-04	\N
394	Cholita Cuencana	\N	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 22:03:06.722-04	2025-05-14 22:03:06.722-04	\N
401	Le Coucou	\N	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 22:05:33.196-04	2025-05-14 22:05:33.196-04	\N
402	Atomix	\N	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 22:05:33.208-04	2025-05-14 22:05:33.208-04	\N
403	Four Horsemen	\N	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 22:05:33.21-04	2025-05-14 22:05:33.21-04	\N
404	L'Artusi	\N	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 22:05:33.212-04	2025-05-14 22:05:33.212-04	\N
439	Test Restaurant 123456789	\N	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 22:08:38.304-04	2025-05-14 22:08:38.304-04	\N
24	Cote Korean Steakhouse	16 W 22nd St, New York, NY 10010, USA	43	1	\N	\N	\N	\N	40.741304	-73.991253	0	2025-04-18 15:54:44.288242-04	2025-05-17 10:08:34.039272-04	\N
166	Test Restaurant 1747266683	123 Test St	\N	1	\N	\N	\N	\N	40.712800	-74.006000	0	2025-05-14 19:51:23.058-04	2025-05-16 09:41:14.583476-04	\N
391	Kru	\N	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 22:03:06.716-04	2025-05-16 10:22:46.94223-04	\N
27	Le Bernardin	155 W 51st St, New York, NY 10019, USA	2	1	\N	\N	\N	\N	40.761422	-73.981756	0	2025-04-18 15:54:44.312282-04	2025-04-18 15:54:44.312282-04	\N
57	L’abeille	412 Greenwich St, New York, NY 10013, USA	18	1	\N	\N	\N	\N	40.722045	-74.009934	0	2025-04-18 15:54:44.426593-04	2025-05-17 10:08:34.06107-04	\N
11	Jean'S	415 Lafayette St, New York, NY 10003, USA	18	1	\N	\N	https://example.com	ChIJS9OS9sNZwokRx5r2iXYAk5E	\N	\N	0	2025-04-16 08:45:42.337541-04	2025-05-17 10:08:34.034702-04	\N
35	Tatiana By Kwame Onwuachi	10 Lincoln Center Plaza, New York, NY 10023, USA	52	1	\N	\N	\N	\N	40.772786	-73.983104	0	2025-04-18 15:54:44.34902-04	2025-05-17 10:08:34.045295-04	\N
12	Lucali	575 Henry St, Brooklyn, NY 11231, USA	19	1	\N	\N	https://example.com	ChIJ395CMVlawokRt2oLH_8zmvI	\N	\N	0	2025-04-16 08:56:05.002645-04	2025-05-17 10:08:34.036398-04	\N
46	L’industrie Pizzeria	254 S 2nd St, Brooklyn, NY 11211, USA	37	1	\N	\N	\N	\N	40.711605	-73.957869	0	2025-04-18 15:54:44.386724-04	2025-05-17 10:08:34.052643-04	\N
22	Carbone	181 Thompson St, New York, NY 10012, USA	1	1	\N	\N	\N	\N	40.727989	-74.000241	0	2025-04-18 15:54:44.266145-04	2025-04-18 15:54:44.266145-04	\N
23	Via Carota	51 Grove St, New York, NY 10014, USA	1	1	\N	\N	\N	\N	40.733144	-74.003667	0	2025-04-18 15:54:44.28441-04	2025-04-18 15:54:44.28441-04	\N
25	Lilia	567 Union Ave, Brooklyn, NY 11211, USA	37	1	\N	\N	\N	\N	40.717537	-73.952423	0	2025-04-18 15:54:44.295837-04	2025-04-18 15:54:44.295837-04	\N
29	Frenchette	241 W Broadway, New York, NY 10013, USA	18	1	\N	\N	\N	\N	40.719619	-74.005694	0	2025-04-18 15:54:44.321424-04	2025-04-18 15:54:44.321424-04	\N
30	Don Angie	103 Greenwich Ave, New York, NY 10014, USA	1	1	\N	\N	\N	\N	40.737804	-74.002094	0	2025-04-18 15:54:44.326221-04	2025-04-18 15:54:44.326221-04	\N
31	Dhamaka	119 Delancey St, New York, NY 10002, USA	3	1	\N	\N	\N	\N	40.718243	-73.987990	0	2025-04-18 15:54:44.331788-04	2025-04-18 15:54:44.331788-04	\N
32	Cosme	35 E 21st St, New York, NY 10010, USA	43	1	\N	\N	\N	\N	40.739595	-73.988356	0	2025-04-18 15:54:44.3349-04	2025-04-18 15:54:44.3349-04	\N
33	The Four Horsemen	295 Grand St, Brooklyn, NY 11211, USA	37	1	\N	\N	\N	\N	40.713058	-73.957322	0	2025-04-18 15:54:44.337752-04	2025-04-18 15:54:44.337752-04	\N
34	Thai Diner	186 Mott St, New York, NY 10012, USA	1	1	\N	\N	\N	\N	40.720714	-73.995650	0	2025-04-18 15:54:44.344146-04	2025-04-18 15:54:44.344146-04	\N
36	King	18 King St, New York, NY 10014, USA	1	1	\N	\N	\N	\N	40.727565	-74.003456	0	2025-04-18 15:54:44.351998-04	2025-04-18 15:54:44.351998-04	\N
37	Sushi Nakazawa	23 Commerce St, New York, NY 10014, USA	1	1	\N	\N	\N	\N	40.731805	-74.004549	0	2025-04-18 15:54:44.354875-04	2025-04-18 15:54:44.354875-04	\N
39	Keens Steakhouse	72 W 36th St., New York, NY 10018, USA	2	1	\N	\N	\N	\N	40.750786	-73.986461	0	2025-04-18 15:54:44.36149-04	2025-04-18 15:54:44.36149-04	\N
40	Crown Shy	70 Pine St Ground Floor, New York, NY 10005, USA	18	1	\N	\N	\N	\N	40.706196	-74.007523	0	2025-04-18 15:54:44.365304-04	2025-04-18 15:54:44.365304-04	\N
42	Shukette	230 9th Ave, New York, NY 10001, USA	2	1	\N	\N	\N	\N	40.747155	-74.000522	0	2025-04-18 15:54:44.371855-04	2025-04-18 15:54:44.371855-04	\N
43	Red Rooster Harlem	310 Lenox Ave, New York, NY 10027, USA	18	1	\N	\N	\N	\N	40.808144	-73.944882	0	2025-04-18 15:54:44.374426-04	2025-04-18 15:54:44.374426-04	\N
44	Kochi	652 10th Ave, New York, NY 10036, USA	2	1	\N	\N	\N	\N	40.761993	-73.993469	0	2025-04-18 15:54:44.377872-04	2025-04-18 15:54:44.377872-04	\N
45	Bonnie’s	398 Manhattan Ave, Brooklyn, NY 11211, USA	37	1	\N	\N	\N	\N	40.717806	-73.946437	0	2025-04-18 15:54:44.381701-04	2025-04-18 15:54:44.381701-04	\N
47	Peter Luger Steak House	178 Broadway, Brooklyn, NY 11211, USA	37	1	\N	\N	\N	\N	40.709877	-73.962505	0	2025-04-18 15:54:44.390324-04	2025-04-18 15:54:44.390324-04	\N
48	Estela	47 E Houston St 1st floor, New York, NY 10012, USA	1	1	\N	\N	\N	\N	40.724641	-73.994739	0	2025-04-18 15:54:44.393618-04	2025-04-18 15:54:44.393618-04	\N
49	Sushi Noz	181 E 78th St, New York, NY 10075, USA	41	1	\N	\N	\N	\N	40.773878	-73.958126	0	2025-04-18 15:54:44.396867-04	2025-04-18 15:54:44.396867-04	\N
50	Blue Hill	75 Washington Pl, New York, NY 10011, USA	4	1	\N	\N	\N	\N	40.732047	-73.999669	0	2025-04-18 15:54:44.401076-04	2025-04-18 15:54:44.401076-04	\N
51	Rowdy Rooster	149 First Ave, New York, NY 10003, USA	18	1	\N	\N	\N	\N	40.728455	-73.985007	0	2025-04-18 15:54:44.404082-04	2025-04-18 15:54:44.404082-04	\N
52	Jeju Noodle Bar	679 Greenwich St, New York, NY 10014, USA	1	1	\N	\N	\N	\N	40.732989	-74.007342	0	2025-04-18 15:54:44.406855-04	2025-04-18 15:54:44.406855-04	\N
53	Kiki’s	130 Division St, New York, NY 10002, USA	3	1	\N	\N	\N	\N	40.714550	-73.991859	0	2025-04-18 15:54:44.410394-04	2025-04-18 15:54:44.410394-04	\N
55	Katz’s Delicatessen	205 E Houston St, New York, NY 10002, USA	3	1	\N	\N	\N	\N	40.722233	-73.987429	0	2025-04-18 15:54:44.419854-04	2025-04-18 15:54:44.419854-04	\N
56	Olmsted	659 Vanderbilt Ave, Brooklyn, NY 11238, USA	22	1	\N	\N	\N	\N	40.677158	-73.968778	0	2025-04-18 15:54:44.423617-04	2025-04-18 15:54:44.423617-04	\N
58	Joomak Banjum	401 West St, New York, NY 10014, USA	1	1	\N	\N	\N	\N	40.733647	-74.009787	0	2025-04-18 15:54:44.429001-04	2025-04-18 15:54:44.429001-04	\N
28	Laser Wolf	97 Wythe Ave, Brooklyn, NY 11249, USA	37	1	\N	\N	\N	\N	40.720833	-73.958794	0	2025-04-18 15:54:44.317136-04	2025-04-18 15:57:46.322124-04	\N
59	Sushi Yasuda	204 E 43rd St, New York, NY 10017, USA	2	1	\N	\N	\N	\N	40.751114	-73.973508	0	2025-04-18 15:54:44.430809-04	2025-04-18 15:54:44.430809-04	\N
62	Melba’s	300 W 114th St, New York, NY 10026, USA	18	1	\N	\N	\N	\N	40.803110	-73.956629	0	2025-04-18 15:54:44.438505-04	2025-04-18 15:54:44.438505-04	\N
63	Emilio’s Ballato	55 E Houston St, New York, NY 10012, USA	1	1	\N	\N	\N	\N	40.724553	-73.994504	0	2025-04-18 15:54:44.440152-04	2025-04-18 15:54:44.440152-04	\N
164	Test Restaurant 1747265561	123 Test St	\N	1	\N	\N	\N	\N	40.712800	-74.006000	0	2025-05-14 19:32:41.284-04	2025-05-14 19:32:41.284-04	\N
65	Zou Zou’s	385 9th Ave Suite 85, New York, NY 10001, USA	2	1	\N	\N	\N	\N	40.752836	-73.998601	0	2025-04-18 15:54:44.445037-04	2025-04-18 15:54:44.445037-04	\N
66	Llama Inn	50 Withers St, Brooklyn, NY 11211, USA	37	1	\N	\N	\N	\N	40.716643	-73.950571	0	2025-04-18 15:54:44.447611-04	2025-04-18 15:54:44.447611-04	\N
67	Roberta’s	261 Moore St, Brooklyn, NY 11206, USA	22	1	\N	\N	\N	\N	40.705061	-73.933578	0	2025-04-18 15:54:44.449364-04	2025-04-18 15:54:44.449364-04	\N
64	Maison Premiere	298 Bedford Ave, Brooklyn, NY 11249, USA	37	1	\N	\N	\N	\N	40.714269	-73.961665	0	2025-04-18 15:54:44.442928-04	2025-04-18 15:57:58.530176-04	\N
74	Shake Shack	691 8th Ave, New York, NY 10036, USA	11	1	\N	\N	\N	\N	40.712800	-74.006000	0	2025-05-13 08:10:53.89-04	2025-05-13 08:10:53.89-04	\N
75	Russ & Daughters	179 E Houston St, New York, NY 10002, USA	2	1	\N	\N	\N	\N	40.722580	-73.988313	0	2025-05-13 08:15:14.009-04	2025-05-13 08:15:14.009-04	\N
81	Dirt Candy		1	1	\N	\N	\N	\N	40.717861	-73.990705	0	2025-05-13 08:54:14.626-04	2025-05-13 08:54:14.626-04	\N
83	Kokomo		1	1	\N	\N	\N	\N	40.721979	-73.959713	0	2025-05-13 08:54:15.626-04	2025-05-13 08:54:15.626-04	\N
84	Oiji Mi		1	1	\N	\N	\N	\N	40.739669	-73.992480	0	2025-05-13 08:54:15.929-04	2025-05-13 08:54:15.929-04	\N
85	Llama San		1	1	\N	\N	\N	\N	40.732274	-74.000828	0	2025-05-13 08:54:16.229-04	2025-05-13 08:54:16.229-04	\N
523	Maison Yaki Test	626 Vanderbilt Ave, Brooklyn, NY 11238	28	1	\N	\N	\N	\N	\N	\N	0	2025-05-15 08:11:11.377-04	2025-05-15 08:11:11.377-04	\N
524	Kru Test	190 N 14th St, Brooklyn, NY 11249	89	1	\N	\N	\N	\N	\N	\N	0	2025-05-15 08:11:11.39-04	2025-05-15 08:11:11.39-04	\N
525	King Test	18 King St, New York, NY 10014	6	1	\N	\N	\N	\N	\N	\N	0	2025-05-15 08:11:11.391-04	2025-05-15 08:11:11.391-04	\N
526	Zaytinya Test	1185 Broadway, New York, NY 10001	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-15 08:11:11.392-04	2025-05-15 08:11:11.392-04	\N
527	Cholita Cuencana Test	59-08 Roosevelt Ave, Woodside, NY 11377	56	1	\N	\N	\N	\N	\N	\N	0	2025-05-15 08:11:11.392-04	2025-05-15 08:11:11.392-04	\N
60	Elephant And Castle	68 Greenwich Ave, New York, NY 10011, USA	4	1	\N	\N	\N	\N	40.736209	-74.000727	0	2025-04-18 15:54:44.434144-04	2025-05-17 10:08:34.064667-04	\N
1	Comfort Food Haven	123 Main St	1	1	10001	(555) 123-4567	https://comfortfoodhaven.com	place_id_123	40.712800	-74.006000	0	2025-04-25 22:40:51.234466-04	2025-05-15 22:52:33.745254-04	\N
61	Dept Of Culture	327 Nostrand Ave, Brooklyn, NY 11216, USA	22	1	\N	\N	\N	\N	40.687192	-73.950783	0	2025-04-18 15:54:44.436743-04	2025-05-17 10:08:34.066499-04	\N
390	Maison Yaki	\N	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 22:03:06.705-04	2025-05-16 09:32:40.885027-04	\N
68	Scarr'S Pizza	35 Orchard St, New York, NY 10002, USA	3	1	\N	\N	https://example.com	ChIJOUqatilawokRguvFSj0wX7Y	\N	\N	0	2025-04-18 15:58:46.907278-04	2025-05-17 10:08:34.073396-04	\N
69	Veselka	144 2nd Ave, New York, NY 10003, USA	18	1	\N	\N	https://example.com	ChIJlxDiXJxZwokRp4HHbeYqXXU	\N	\N	0	2025-04-18 15:58:54.640402-04	2025-05-17 10:08:34.075149-04	\N
126	Claro	\N	24	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 19:05:58.187-04	2025-05-14 19:05:58.187-04	\N
127	Unique Restaurant 1	\N	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 19:05:58.188-04	2025-05-14 19:05:58.188-04	\N
128	Unique Restaurant 2	\N	2	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 19:05:58.188-04	2025-05-14 19:05:58.188-04	\N
129	Peaches	\N	89	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 19:05:58.189-04	2025-05-14 19:05:58.189-04	\N
70	Le Bar Penelope	14 E 60th St, New York, NY 10022, USA	2	1	\N	\N	https://example.com	ChIJy_70VwBZwokRnY0wAodHrjY	\N	\N	0	2025-04-18 16:00:43.299684-04	2025-05-17 10:08:34.076888-04	\N
136	Fandi Mata	74 Bayard St, Brooklyn, NY 11222, USA	26	1	\N	\N	\N	\N	40.718847	-73.949253	0	2025-05-14 19:15:13.874-04	2025-05-14 19:15:13.874-04	\N
72	Tomo21 Sushi	172 Thompson St, New York, NY 10012, USA	1	1	\N	\N	https://example.com	ChIJ4WXDA45ZwokRiYUKlIucxxU	\N	\N	0	2025-04-23 20:41:38.432366-04	2025-05-17 10:08:34.078653-04	\N
77	Katz'S Delicatessen	205 E Houston St, New York, NY 10002, USA	2	1	\N	\N	\N	\N	40.722233	-73.987429	0	2025-05-13 08:15:15.038-04	2025-05-17 10:08:34.081729-04	\N
82	Wu'S Wonton King		1	1	\N	\N	\N	\N	40.713832	-73.989964	0	2025-05-13 08:54:15.28-04	2025-05-17 10:08:34.083944-04	\N
71	Cote	16 W 22nd St, New York, NY 10010, USA	43	1	\N	\N	https://www.cotekoreansteakhouse.com	ChIJQ1R3hKNZwokRQM4wbIrc00o	40.741304	-73.991253	0	2025-04-20 09:35:37.450351-04	2025-05-17 10:08:34.089938-04	\N
138	Miss Lily'S	109 Avenue A, New York, NY 10009, USA	4	1	\N	\N	\N	\N	40.726053	-73.983852	0	2025-05-14 19:15:13.963-04	2025-05-17 10:08:34.094972-04	\N
165	Test Restaurant 1747266249	123 Test St	\N	1	\N	\N	\N	\N	40.712800	-74.006000	0	2025-05-14 19:44:09.743-04	2025-05-14 19:44:09.743-04	\N
140	Rezdôra	27 E 20th St, New York, NY 10003, USA	3	1	\N	\N	\N	\N	40.739083	-73.989044	0	2025-05-14 19:15:14.031-04	2025-05-14 19:15:14.031-04	\N
141	Tonchin	13 W 36th St., New York, NY 10018, USA	89	1	\N	\N	\N	\N	40.750271	-73.984523	0	2025-05-14 19:15:14.064-04	2025-05-14 19:15:14.064-04	\N
142	Han Dynasty	90 3rd Ave, New York, NY 10003, USA	3	1	\N	\N	\N	\N	40.732231	-73.988252	0	2025-05-14 19:15:14.097-04	2025-05-14 19:15:14.097-04	\N
143	The Tyger	1 Howard St, New York, NY 10013, USA	89	1	\N	\N	\N	\N	40.718902	-73.999442	0	2025-05-14 19:15:14.13-04	2025-05-14 19:15:14.13-04	\N
324	Ugly Baby	407 Smith St, Brooklyn, NY 11231, USA	27	1	\N	\N	\N		0.000000	0.000000	0	2025-05-14 21:44:56.028-04	2025-05-14 21:44:56.028-04	\N
224	Test Restaurant	\N	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-14 21:27:46.103-04	2025-05-14 21:27:46.103-04	\N
529	Kru Api Test	190 N 14th St, Brooklyn, NY 11249	89	1	\N	\N	\N	\N	\N	\N	0	2025-05-15 08:12:15.836-04	2025-05-17 10:08:34.123792-04	\N
530	King Api Test	18 King St, New York, NY 10014	6	1	\N	\N	\N	\N	\N	\N	0	2025-05-15 08:12:15.837-04	2025-05-17 10:08:34.125166-04	\N
531	Zaytinya Api Test	1185 Broadway, New York, NY 10001	1	1	\N	\N	\N	\N	\N	\N	0	2025-05-15 08:12:15.837-04	2025-05-17 10:08:34.126446-04	\N
532	Cholita Cuencana Api Test	59-08 Roosevelt Ave, Woodside, NY 11377	89	1	\N	\N	\N	\N	\N	\N	0	2025-05-15 08:12:15.838-04	2025-05-17 10:08:34.127617-04	\N
144	Rule Of Thirds	171 Banker St, Brooklyn, NY 11222, USA	26	1	\N	\N	\N	\N	40.724750	-73.955030	0	2025-05-14 19:15:14.164-04	2025-05-17 10:08:34.099079-04	\N
329	Test Restaurant 2	456 Test Ave, New York, NY 10001	1	1	\N	\N	https://example.com	test-place-id-123	0.000000	0.000000	0	2025-05-14 21:47:11.249-04	2025-05-17 10:08:34.102044-04	\N
331	Ugly Baby Thai	407 Smith St, Brooklyn, NY 11231	1	1	\N	\N	https://example.com	ugly-baby-nyc-2	0.000000	0.000000	0	2025-05-14 21:47:52.632-04	2025-05-17 10:08:34.103888-04	\N
332	Via Carota Italian	51 Grove St, New York, NY 10014	1	1	\N	\N	https://example.com	via-carota-nyc-2	0.000000	0.000000	0	2025-05-14 21:47:52.638-04	2025-05-17 10:08:34.105703-04	\N
333	Zabb Elee Thai	75-32 Broadway, Queens, NY 11373	1	1	\N	\N	https://example.com	zabb-elee-nyc-2	0.000000	0.000000	0	2025-05-14 21:47:52.639-04	2025-05-17 10:08:34.107564-04	\N
334	Oxomoco Mexican	128 Greenpoint Ave, Brooklyn, NY 11222	1	1	\N	\N	https://example.com	oxomoco-nyc-2	0.000000	0.000000	0	2025-05-14 21:47:52.639-04	2025-05-17 10:08:34.109642-04	\N
357	Kiki'S	130 Division St, New York, NY 10002	2	1	\N	\N	https://example.com	kikis-nyc-2	0.000000	0.000000	0	2025-05-14 21:55:06.201-04	2025-05-17 10:08:34.115962-04	\N
359	La Vara	268 Clinton St, Brooklyn, NY 11201	1	1	\N	\N	https://example.com	la-vara-nyc-2	0.000000	0.000000	0	2025-05-14 21:55:06.226-04	2025-05-17 10:08:34.118534-04	\N
360	Lore	190 Orchard St, New York, NY 10002	2	1	\N	\N	https://example.com	lore-nyc-2	0.000000	0.000000	0	2025-05-14 21:55:06.232-04	2025-05-17 10:08:34.120292-04	\N
528	Maison Yaki Api Test	626 Vanderbilt Ave, Brooklyn, NY 11238	28	1	\N	\N	\N	\N	\N	\N	0	2025-05-15 08:12:15.832-04	2025-05-17 10:08:34.122392-04	\N
\.


--
-- Data for Name: reviewvotes; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.reviewvotes (id, dish_id, vote_type, created_at) FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: naf
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.submissions (id, user_id, type, name, location, tags, place_id, city, neighborhood, status, created_at, reviewed_at, reviewed_by, restaurant_id, restaurant_name) FROM stdin;
7	2	restaurant	Roberta's	261 Moore St, Brooklyn, NY 11206, USA	\N	ChIJzSOyOg1dwokRfQ-5htUfsRY	Kings County	Brooklyn	approved	2025-04-14 21:30:22.569931-04	2025-04-16 08:19:20.483999-04	2	\N	\N
3	\N	dish	Adobada Taco	Mario's Classic Pizza	{tacos}	ChIJOWXT4mFXwokRFtTnWmOSkSs	Hoboken	\N	rejected	2025-04-01 21:41:59.587715-04	2025-04-16 08:22:33.432391-04	2	\N	\N
4	\N	dish	Peking Duck	TAO Downtown Restaurant	{Fusion}	ChIJKaKVI79ZwokRN8WicODOIAw	New York	Manhattan	rejected	2025-04-02 18:26:48.695864-04	2025-04-16 08:22:33.865131-04	2	\N	\N
5	\N	dish	Filet Mignon	Bobby Van's Grill	{American}	ChIJR33-vPhYwokRp6MzGzRnS0o	New York	Manhattan	rejected	2025-04-02 19:03:47.613209-04	2025-04-16 08:22:34.225701-04	2	\N	\N
6	\N	dish	Pulled Pork Sandwich	Blue Smoke Shop	{bbq}	ChIJ-x1KhRL_wokR2ImkaTZlKOE	Paterson	\N	rejected	2025-04-02 19:34:42.476918-04	2025-04-16 08:22:34.646096-04	2	\N	\N
15	2	restaurant	Jean's	415 Lafayette St, New York, NY 10003, USA	\N	ChIJS9OS9sNZwokRx5r2iXYAk5E	New York	Manhattan	approved	2025-04-16 08:45:23.872123-04	2025-04-16 08:45:42.337541-04	2	\N	\N
9	2	restaurant	Roberta's	261 Moore St, Brooklyn, NY 11206, USA	\N	ChIJzSOyOg1dwokRfQ-5htUfsRY	Kings County	Brooklyn	rejected	2025-04-16 08:29:48.226957-04	2025-04-16 08:49:41.189094-04	2	\N	\N
16	2	restaurant	Lucali	575 Henry St, Brooklyn, NY 11231, USA	\N	ChIJ395CMVlawokRt2oLH_8zmvI	Kings County	Brooklyn	rejected	2025-04-16 08:53:49.989916-04	2025-04-16 08:55:56.782695-04	2	\N	\N
17	2	restaurant	Lucali	575 Henry St, Brooklyn, NY 11231, USA	\N	ChIJ395CMVlawokRt2oLH_8zmvI	Kings County	Brooklyn	approved	2025-04-16 08:56:00.920206-04	2025-04-16 08:56:05.002645-04	2	\N	\N
14	2	restaurant	Yellow Rose	102 3rd Ave, New York, NY 10003, USA	\N	ChIJ86Q39ndZwokRJTOUVW7RD-I	New York	Manhattan	rejected	2025-04-16 08:43:41.138837-04	2025-04-16 08:57:21.021501-04	2	\N	\N
13	2	restaurant	Greenacre Park	217 E 51st St, New York, NY 10022, USA	\N	ChIJGaiaEONYwokR68EFhU8zSNc	New York	Manhattan	rejected	2025-04-16 08:42:00.209043-04	2025-04-16 08:57:21.567007-04	2	\N	\N
12	2	restaurant	Blue Note	131 W 3rd St, New York, NY 10012, USA	\N	ChIJbfTV15NZwokRSeNM676BEZI	New York	Manhattan	rejected	2025-04-16 08:35:56.36238-04	2025-04-16 08:57:22.136012-04	2	\N	\N
11	2	restaurant	Red Gate Bakery	68 E 1st St, New York, NY 10003, USA	\N	ChIJWUWUxuJZwokRFaRXghmm1A0	New York	Manhattan	rejected	2025-04-16 08:33:30.267758-04	2025-04-16 08:57:22.637612-04	2	\N	\N
10	2	restaurant	John's Pizzeria of Times Square	260 W 44th St, New York, NY 10036, USA	\N	ChIJBSESh1RYwokRyHcVnrG7JWo	New York	Manhattan	rejected	2025-04-16 08:31:34.405991-04	2025-04-16 08:57:23.093032-04	2	\N	\N
8	2	restaurant	Michaels	675 Avenue of the Americas NYC-Manhattan-Chelsea, New York, NY 10010, USA	\N	ChIJQ3PWpqRZwokRSdFi7_vvxTo	New York	Manhattan	rejected	2025-04-16 08:27:49.382492-04	2025-04-16 08:57:23.542103-04	2	\N	\N
18	2	restaurant	Katz's Delicatessen	205 E Houston St, New York, NY 10002, USA	\N	ChIJCar0f49ZwokR6ozLV-dHNTE	New York	Manhattan	approved	2025-04-17 08:16:47.012618-04	2025-04-17 08:16:58.533438-04	2	\N	\N
19	2	restaurant	Katz's Delicatessen	205 E Houston St, New York, NY 10002, USA	\N	ChIJCar0f49ZwokR6ozLV-dHNTE	New York	Manhattan	approved	2025-04-17 08:27:36.327299-04	2025-04-17 08:27:50.825429-04	2	\N	\N
20	2	restaurant	Katz's Delicatessen	205 E Houston St, New York, NY 10002, USA	\N	ChIJCar0f49ZwokR6ozLV-dHNTE	New York	Manhattan	approved	2025-04-17 08:30:32.949638-04	2025-04-17 08:30:37.956082-04	2	\N	\N
21	2	restaurant	Katz's Delicatessen	205 E Houston St, New York, NY 10002, USA	\N	ChIJCar0f49ZwokR6ozLV-dHNTE	New York	Manhattan	approved	2025-04-17 08:39:46.62226-04	2025-04-17 08:41:44.931865-04	2	\N	\N
22	2	restaurant	Katz's Delicatessen	205 E Houston St, New York, NY 10002, USA	\N	ChIJCar0f49ZwokR6ozLV-dHNTE	New York	Manhattan	approved	2025-04-17 08:45:11.373685-04	2025-04-17 08:45:17.636075-04	2	\N	\N
23	2	restaurant	Katz's Delicatessen	205 E Houston St, New York, NY 10002, USA	\N	ChIJCar0f49ZwokR6ozLV-dHNTE	New York	Manhattan	approved	2025-04-17 08:49:00.429906-04	2025-04-17 08:49:08.435533-04	2	\N	\N
24	2	restaurant	Scarr's Pizza	35 Orchard St, New York, NY 10002, USA	\N	ChIJOUqatilawokRguvFSj0wX7Y	New York	Lower East Side	approved	2025-04-17 08:52:55.88567-04	2025-04-18 15:58:46.907278-04	2	\N	\N
25	2	restaurant	Veselka	144 2nd Ave, New York, NY 10003, USA	\N	ChIJlxDiXJxZwokRp4HHbeYqXXU	New York	Manhattan	approved	2025-04-17 08:56:14.525513-04	2025-04-18 15:58:54.640402-04	2	\N	\N
26	2	restaurant	Le Bar Penelope	14 E 60th St, New York, NY 10022, USA	\N	ChIJy_70VwBZwokRnY0wAodHrjY	New York	Midtown	approved	2025-04-18 16:00:33.740221-04	2025-04-18 16:00:43.299684-04	2	\N	\N
27	2	dish	Pepperoni Pizza	\N	\N	\N	\N	\N	rejected	2025-04-19 19:30:26.52198-04	2025-04-20 12:32:57.486997-04	2	68	Scarr's Pizza
28	2	restaurant	Michael’s	2929 Avenue R, Brooklyn, NY 11229, USA	\N	ChIJ2cccPJlEwokRnkUFMJ3M_-k	New York	Sheepshead Bay	pending	2025-04-22 08:36:29.639876-04	\N	\N	\N	\N
29	2	restaurant	Tomo21 Sushi	172 Thompson St, New York, NY 10012, USA	\N	ChIJ4WXDA45ZwokRiYUKlIucxxU	New York	Greenwich Village	approved	2025-04-23 14:39:24.889508-04	2025-04-23 20:41:38.432366-04	2	\N	\N
1	\N	restaurant	Lucali	\N	{}	\N	\N	\N	rejected	2025-04-01 21:37:53.417254-04	2025-04-01 21:38:25.162583-04	\N	\N	\N
2	\N	restaurant	Lucali	\N	{pizza}	ChIJ395CMVlawokRt2oLH_8zmvI	Kings County	Brooklyn	rejected	2025-04-01 21:41:09.559713-04	2025-04-16 08:22:32.755119-04	2	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: doof_user
--

COPY public.users (id, username, email, created_at, password_hash, account_type, role) FROM stdin;
1	testuser	test@example.com	2025-03-30 19:22:26.473178	$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa	superuser	superuser
2	admin	admin@example.com	2025-04-13 16:08:17.42223	$2a$12$W68Loi7a5WTnsG2Ai1BLlOFRDyJZIkT.HQ0QGq2Vr1E5f3bv8QJpS	superuser	superuser
4	adminuser	admin@doof.com	2025-05-23 22:42:56.569866	$2b$10$3vdCA7T1pbW1CmNd2l4hDuRfIUDb0A6.BKLPVUsW.q3QVaRFry78m	user	admin
5	testuser1748054578126	test1748054578126@example.com	2025-05-23 22:42:58.338424	$2a$10$GBmfMYP9r0QjyP9fR0IA8.40CRf7Q3rlvI3tdgJ2Pnv5OM96ywtoe	user	user
\.


--
-- Name: cities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.cities_id_seq', 7, true);


--
-- Name: cuisines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.cuisines_id_seq', 20, true);


--
-- Name: dishes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.dishes_id_seq', 20, true);


--
-- Name: dishvotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.dishvotes_id_seq', 1, false);


--
-- Name: engagements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.engagements_id_seq', 82, true);


--
-- Name: hashtags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.hashtags_id_seq', 109, true);


--
-- Name: listitems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.listitems_id_seq', 22, true);


--
-- Name: lists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.lists_id_seq', 24, true);


--
-- Name: neighborhoods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.neighborhoods_id_seq', 126, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 330, true);


--
-- Name: restaurant_chains_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.restaurant_chains_id_seq', 1, false);


--
-- Name: restaurants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.restaurants_id_seq', 536, true);


--
-- Name: reviewvotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.reviewvotes_id_seq', 1, false);


--
-- Name: submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.submissions_id_seq', 29, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: doof_user
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: cities cities_name_key; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_name_key UNIQUE (name);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: cuisines cuisines_name_key; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.cuisines
    ADD CONSTRAINT cuisines_name_key UNIQUE (name);


--
-- Name: cuisines cuisines_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.cuisines
    ADD CONSTRAINT cuisines_pkey PRIMARY KEY (id);


--
-- Name: dishes dishes_name_restaurant_id_key; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_name_restaurant_id_key UNIQUE (name, restaurant_id);


--
-- Name: dishes dishes_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_pkey PRIMARY KEY (id);


--
-- Name: dishhashtags dishhashtags_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishhashtags
    ADD CONSTRAINT dishhashtags_pkey PRIMARY KEY (dish_id, hashtag_id);


--
-- Name: dishvotes dishvotes_dish_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishvotes
    ADD CONSTRAINT dishvotes_dish_id_user_id_key UNIQUE (dish_id, user_id);


--
-- Name: dishvotes dishvotes_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishvotes
    ADD CONSTRAINT dishvotes_pkey PRIMARY KEY (id);


--
-- Name: engagements engagements_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.engagements
    ADD CONSTRAINT engagements_pkey PRIMARY KEY (id);


--
-- Name: hashtags hashtags_name_key; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.hashtags
    ADD CONSTRAINT hashtags_name_key UNIQUE (name);


--
-- Name: hashtags hashtags_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.hashtags
    ADD CONSTRAINT hashtags_pkey PRIMARY KEY (id);


--
-- Name: list_follows list_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.list_follows
    ADD CONSTRAINT list_follows_pkey PRIMARY KEY (user_id, list_id);


--
-- Name: listitems listitems_list_id_item_type_item_id_key; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.listitems
    ADD CONSTRAINT listitems_list_id_item_type_item_id_key UNIQUE (list_id, item_type, item_id);


--
-- Name: listitems listitems_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.listitems
    ADD CONSTRAINT listitems_pkey PRIMARY KEY (id);


--
-- Name: lists lists_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_pkey PRIMARY KEY (id);


--
-- Name: neighborhoods neighborhoods_name_city_id_key; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.neighborhoods
    ADD CONSTRAINT neighborhoods_name_city_id_key UNIQUE (name, city_id);


--
-- Name: neighborhoods neighborhoods_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.neighborhoods
    ADD CONSTRAINT neighborhoods_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_user_id_key; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_key UNIQUE (user_id);


--
-- Name: refresh_tokens refresh_tokens_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_unique UNIQUE (user_id);


--
-- Name: restaurant_chains restaurant_chains_name_key; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restaurant_chains
    ADD CONSTRAINT restaurant_chains_name_key UNIQUE (name);


--
-- Name: restaurant_chains restaurant_chains_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restaurant_chains
    ADD CONSTRAINT restaurant_chains_pkey PRIMARY KEY (id);


--
-- Name: restauranthashtags restauranthashtags_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restauranthashtags
    ADD CONSTRAINT restauranthashtags_pkey PRIMARY KEY (restaurant_id, hashtag_id);


--
-- Name: restaurants restaurants_google_place_id_key; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_google_place_id_key UNIQUE (google_place_id);


--
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (id);


--
-- Name: reviewvotes reviewvotes_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.reviewvotes
    ADD CONSTRAINT reviewvotes_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: restaurants uq_restaurant_name_city; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT uq_restaurant_name_city UNIQUE (name, city_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_cities_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_cities_name ON public.cities USING btree (name);


--
-- Name: idx_cuisines_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_cuisines_name ON public.cuisines USING btree (name);


--
-- Name: idx_dishes_adds; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_dishes_adds ON public.dishes USING btree (adds DESC);


--
-- Name: idx_dishes_created_at; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_dishes_created_at ON public.dishes USING btree (created_at DESC);


--
-- Name: idx_dishes_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_dishes_id ON public.dishes USING btree (id);


--
-- Name: idx_dishes_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_dishes_name ON public.dishes USING btree (name);


--
-- Name: idx_dishes_name_trgm; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_dishes_name_trgm ON public.dishes USING gin (name public.gin_trgm_ops);


--
-- Name: idx_dishes_restaurant_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_dishes_restaurant_id ON public.dishes USING btree (restaurant_id);


--
-- Name: idx_dishhashtags_dish_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_dishhashtags_dish_id ON public.dishhashtags USING btree (dish_id);


--
-- Name: idx_dishhashtags_hashtag_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_dishhashtags_hashtag_id ON public.dishhashtags USING btree (hashtag_id);


--
-- Name: idx_dishvotes_dish_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_dishvotes_dish_id ON public.dishvotes USING btree (dish_id);


--
-- Name: idx_dishvotes_user_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_dishvotes_user_id ON public.dishvotes USING btree (user_id);


--
-- Name: idx_engagements_item; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_engagements_item ON public.engagements USING btree (item_type, item_id, engagement_timestamp DESC);


--
-- Name: idx_engagements_type_time; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_engagements_type_time ON public.engagements USING btree (engagement_type, engagement_timestamp DESC);


--
-- Name: idx_engagements_type_time_item; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_engagements_type_time_item ON public.engagements USING btree (item_type, engagement_timestamp DESC, item_id);


--
-- Name: idx_engagements_user; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_engagements_user ON public.engagements USING btree (user_id, engagement_timestamp DESC);


--
-- Name: idx_hashtags_category; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_hashtags_category ON public.hashtags USING btree (category);


--
-- Name: idx_hashtags_category_filter; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_hashtags_category_filter ON public.hashtags USING btree (category);


--
-- Name: idx_hashtags_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_hashtags_name ON public.hashtags USING btree (name);


--
-- Name: idx_listitems_item_type_item_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_listitems_item_type_item_id ON public.listitems USING btree (item_type, item_id);


--
-- Name: idx_listitems_list_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_listitems_list_id ON public.listitems USING btree (list_id);


--
-- Name: idx_lists_city_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_lists_city_name ON public.lists USING btree (city_name);


--
-- Name: idx_lists_created_at; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_lists_created_at ON public.lists USING btree (created_at DESC);


--
-- Name: idx_lists_is_public_saved; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_lists_is_public_saved ON public.lists USING btree (is_public, saved_count DESC);


--
-- Name: idx_lists_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_lists_name ON public.lists USING btree (name);


--
-- Name: idx_lists_public_saved_created; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_lists_public_saved_created ON public.lists USING btree (is_public, saved_count DESC NULLS LAST, created_at DESC);


--
-- Name: idx_lists_tags; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_lists_tags ON public.lists USING gin (tags);


--
-- Name: idx_neighborhoods_city_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_neighborhoods_city_id ON public.neighborhoods USING btree (city_id);


--
-- Name: idx_neighborhoods_level; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_neighborhoods_level ON public.neighborhoods USING btree (location_level);


--
-- Name: idx_neighborhoods_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_neighborhoods_name ON public.neighborhoods USING btree (name);


--
-- Name: idx_neighborhoods_parent_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_neighborhoods_parent_id ON public.neighborhoods USING btree (parent_id);


--
-- Name: idx_refresh_tokens_expires_at; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_refresh_tokens_expires_at ON public.refresh_tokens USING btree (expires_at);


--
-- Name: idx_refresh_tokens_token; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_restaurant_chains_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_restaurant_chains_name ON public.restaurant_chains USING btree (name);


--
-- Name: idx_restaurant_chains_name_trgm; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_restaurant_chains_name_trgm ON public.restaurant_chains USING gin (name public.gin_trgm_ops);


--
-- Name: idx_restauranthashtags_restaurant_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_restauranthashtags_restaurant_id ON public.restauranthashtags USING btree (restaurant_id);


--
-- Name: idx_restaurants_adds; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_restaurants_adds ON public.restaurants USING btree (adds DESC);


--
-- Name: idx_restaurants_chain_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_restaurants_chain_id ON public.restaurants USING btree (chain_id);


--
-- Name: idx_restaurants_city_id_neighborhood_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_restaurants_city_id_neighborhood_id ON public.restaurants USING btree (city_id, neighborhood_id);


--
-- Name: idx_restaurants_created_at; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_restaurants_created_at ON public.restaurants USING btree (created_at DESC);


--
-- Name: idx_restaurants_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_restaurants_id ON public.restaurants USING btree (id);


--
-- Name: idx_restaurants_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_restaurants_name ON public.restaurants USING btree (name);


--
-- Name: idx_restaurants_name_trgm; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_restaurants_name_trgm ON public.restaurants USING gin (name public.gin_trgm_ops);


--
-- Name: idx_resthashtags_hashtag_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_resthashtags_hashtag_id ON public.restauranthashtags USING btree (hashtag_id);


--
-- Name: idx_resthashtags_restaurant_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_resthashtags_restaurant_id ON public.restauranthashtags USING btree (restaurant_id);


--
-- Name: idx_submissions_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_submissions_name ON public.submissions USING btree (name);


--
-- Name: idx_submissions_place_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_submissions_place_id ON public.submissions USING btree (place_id);


--
-- Name: idx_submissions_status_created; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_submissions_status_created ON public.submissions USING btree (status, created_at);


--
-- Name: idx_submissions_type; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_submissions_type ON public.submissions USING btree (type);


--
-- Name: idx_submissions_user_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_submissions_user_id ON public.submissions USING btree (user_id);


--
-- Name: idx_users_account_type; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_users_account_type ON public.users USING btree (account_type);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: cities set_timestamp_cities; Type: TRIGGER; Schema: public; Owner: doof_user
--

CREATE TRIGGER set_timestamp_cities BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- Name: dishes set_timestamp_dishes; Type: TRIGGER; Schema: public; Owner: doof_user
--

CREATE TRIGGER set_timestamp_dishes BEFORE UPDATE ON public.dishes FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- Name: hashtags set_timestamp_hashtags; Type: TRIGGER; Schema: public; Owner: doof_user
--

CREATE TRIGGER set_timestamp_hashtags BEFORE UPDATE ON public.hashtags FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- Name: lists set_timestamp_lists; Type: TRIGGER; Schema: public; Owner: doof_user
--

CREATE TRIGGER set_timestamp_lists BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- Name: restaurant_chains set_timestamp_restaurant_chains; Type: TRIGGER; Schema: public; Owner: doof_user
--

CREATE TRIGGER set_timestamp_restaurant_chains BEFORE UPDATE ON public.restaurant_chains FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- Name: restaurants set_timestamp_restaurants; Type: TRIGGER; Schema: public; Owner: doof_user
--

CREATE TRIGGER set_timestamp_restaurants BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- Name: listitems trigger_validate_listitem_item_id; Type: TRIGGER; Schema: public; Owner: doof_user
--

CREATE TRIGGER trigger_validate_listitem_item_id BEFORE INSERT OR UPDATE ON public.listitems FOR EACH ROW EXECUTE FUNCTION public.validate_listitem_item_id();


--
-- Name: dishhashtags fk_dish; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishhashtags
    ADD CONSTRAINT fk_dish FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- Name: dishhashtags fk_dish_hashtag; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishhashtags
    ADD CONSTRAINT fk_dish_hashtag FOREIGN KEY (hashtag_id) REFERENCES public.hashtags(id) ON DELETE CASCADE;


--
-- Name: dishes fk_dish_restaurant; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT fk_dish_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: dishes fk_dishes_restaurant; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT fk_dishes_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: dishhashtags fk_dishhashtag_dish; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishhashtags
    ADD CONSTRAINT fk_dishhashtag_dish FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- Name: dishhashtags fk_dishhashtag_hashtag; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishhashtags
    ADD CONSTRAINT fk_dishhashtag_hashtag FOREIGN KEY (hashtag_id) REFERENCES public.hashtags(id) ON DELETE CASCADE;


--
-- Name: engagements fk_engagement_user; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.engagements
    ADD CONSTRAINT fk_engagement_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: restauranthashtags fk_hashtag; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restauranthashtags
    ADD CONSTRAINT fk_hashtag FOREIGN KEY (hashtag_id) REFERENCES public.hashtags(id) ON DELETE CASCADE;


--
-- Name: lists fk_list_creator; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT fk_list_creator FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: listitems fk_listitem_list; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.listitems
    ADD CONSTRAINT fk_listitem_list FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: listitems fk_listitems_list; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.listitems
    ADD CONSTRAINT fk_listitems_list FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: neighborhoods fk_neighborhood_city; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.neighborhoods
    ADD CONSTRAINT fk_neighborhood_city FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens fk_refresh_user; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: restauranthashtags fk_restaurant; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restauranthashtags
    ADD CONSTRAINT fk_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: restaurants fk_restaurant_chain; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT fk_restaurant_chain FOREIGN KEY (chain_id) REFERENCES public.restaurant_chains(id) ON DELETE SET NULL;


--
-- Name: restaurants fk_restaurant_city; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT fk_restaurant_city FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: restaurants fk_restaurant_neighborhood; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT fk_restaurant_neighborhood FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id) ON DELETE SET NULL;


--
-- Name: restauranthashtags fk_resthashtag_hashtag; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restauranthashtags
    ADD CONSTRAINT fk_resthashtag_hashtag FOREIGN KEY (hashtag_id) REFERENCES public.hashtags(id) ON DELETE CASCADE;


--
-- Name: restauranthashtags fk_resthashtag_restaurant; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.restauranthashtags
    ADD CONSTRAINT fk_resthashtag_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: submissions fk_submission_restaurant; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT fk_submission_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE SET NULL;


--
-- Name: submissions fk_submission_reviewer; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT fk_submission_reviewer FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: submissions fk_submission_user; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: dishvotes fk_vote_dish; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishvotes
    ADD CONSTRAINT fk_vote_dish FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- Name: dishvotes fk_vote_user; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.dishvotes
    ADD CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: list_follows list_follows_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.list_follows
    ADD CONSTRAINT list_follows_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id);


--
-- Name: list_follows list_follows_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.list_follows
    ADD CONSTRAINT list_follows_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: neighborhoods neighborhoods_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.neighborhoods
    ADD CONSTRAINT neighborhoods_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.neighborhoods(id) ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: naf
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

