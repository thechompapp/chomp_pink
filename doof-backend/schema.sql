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
    name character varying(100) NOT NULL
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
-- Name: listfollows; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.listfollows (
    list_id integer NOT NULL,
    user_id integer NOT NULL,
    followed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.listfollows OWNER TO doof_user;

--
-- Name: listitems; Type: TABLE; Schema: public; Owner: doof_user
--

CREATE TABLE public.listitems (
    id integer NOT NULL,
    list_id integer NOT NULL,
    item_type character varying(20) NOT NULL,
    item_id integer NOT NULL,
    added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
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
    CONSTRAINT lists_list_type_check CHECK (((list_type)::text = ANY (ARRAY[('restaurant'::character varying)::text, ('dish'::character varying)::text])))
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
    geom public.geometry(MultiPolygon,4326)
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
    neighborhood_name character varying(100),
    city_name character varying(100),
    zip_code character varying(10),
    borough character varying(100),
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
-- Name: listfollows listfollows_pkey; Type: CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.listfollows
    ADD CONSTRAINT listfollows_pkey PRIMARY KEY (list_id, user_id);


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
-- Name: idx_listfollows_list_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_listfollows_list_id ON public.listfollows USING btree (list_id);


--
-- Name: idx_listfollows_user_id; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_listfollows_user_id ON public.listfollows USING btree (user_id);


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
-- Name: idx_neighborhoods_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_neighborhoods_name ON public.neighborhoods USING btree (name);


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
-- Name: idx_restaurants_city_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_restaurants_city_name ON public.restaurants USING btree (city_name);


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
-- Name: idx_restaurants_neighborhood_name; Type: INDEX; Schema: public; Owner: doof_user
--

CREATE INDEX idx_restaurants_neighborhood_name ON public.restaurants USING btree (neighborhood_name);


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
-- Name: listfollows fk_follow_list; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.listfollows
    ADD CONSTRAINT fk_follow_list FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: listfollows fk_follow_user; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.listfollows
    ADD CONSTRAINT fk_follow_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: listfollows listfollows_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.listfollows
    ADD CONSTRAINT listfollows_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: listfollows listfollows_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: doof_user
--

ALTER TABLE ONLY public.listfollows
    ADD CONSTRAINT listfollows_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: naf
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

