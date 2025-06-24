CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
ALTER DATABASE papergraph SET timezone = 'Asia/Shanghai';

CREATE TABLE "role"(
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL UNIQUE CHECK (LENGTH(name) > 0),
    "created_at" timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Shanghai'),
    PRIMARY KEY("id"),
    UNIQUE("name")
);

CREATE TABLE "user"(
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "hashed_password" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
    "last_login" timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Shanghai'),
    "password_changed_at" timestamptz NOT NULL DEFAULT('0001-01-01 00:00:00Z'),
    "role_name" VARCHAR(255) NOT NULL,
    "avatar" VARCHAR(100) NOT NULL DEFAULT 'default',
    "phone" VARCHAR(255) DEFAULT NULL,
    "created_at" timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Shanghai'),
    "deleted_at" timestamptz NOT NULL DEFAULT('0001-01-01 00:00:00Z'),
    PRIMARY KEY("id"),
    FOREIGN KEY ("role_name") REFERENCES "role" ("name") ON DELETE CASCADE
);


CREATE TABLE "project"(
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL CHECK (LENGTH(name) > 0),
    "owner_id" UUID NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Shanghai'),
    PRIMARY KEY("id"),
    FOREIGN KEY("owner_id") REFERENCES "user"("id") ON DELETE CASCADE,
    UNIQUE ("name", "owner_id")
);


CREATE TABLE "user_project_mapping"(
    "user_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    PRIMARY KEY("user_id", "project_id"),
    FOREIGN KEY("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
    FOREIGN KEY("project_id") REFERENCES "project"("id") ON DELETE CASCADE
);


CREATE TABLE "knowledge_base"(
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL CHECK (LENGTH(name) > 0),
    "owner_id" UUID NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Shanghai'),
    "updated_at" timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Shanghai'),
    PRIMARY KEY("id"),
    FOREIGN KEY("owner_id") REFERENCES "user"("id") ON DELETE CASCADE,
    UNIQUE("name", "owner_id")
);

CREATE TABLE "knowledge_base_project_mapping"(
    "knowledge_base_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    PRIMARY KEY("knowledge_base_id", "project_id"),
    FOREIGN KEY("knowledge_base_id") REFERENCES "knowledge_base"("id") ON DELETE CASCADE,
    FOREIGN KEY("project_id") REFERENCES "project"("id") ON DELETE CASCADE
);



CREATE INDEX "knowledge_base_owner_id_index" ON "knowledge_base"("owner_id");

CREATE TABLE "rag_config"(
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "owner_id" UUID NOT NULL,
    "kb_id" UUID NOT NULL,
    "embed_model" VARCHAR(255) NOT NULL DEFAULT 'text-embedding-3-small',
    "chunk_token_size" INT NOT NULL DEFAULT 1024,
    "chunk_overlap_token_size" INT NOT NULL DEFAULT 256,
    PRIMARY KEY("id"),
    FOREIGN KEY("owner_id") REFERENCES "user"("id") ON DELETE CASCADE,
    FOREIGN KEY("kb_id") REFERENCES "knowledge_base"("id") ON DELETE CASCADE,
    UNIQUE("owner_id", "kb_id")
);

CREATE INDEX "rag_config_owner_id_index" ON "rag_config"("owner_id");
CREATE INDEX "rag_config_kb_id_index" ON "rag_config"("kb_id");


CREATE TABLE "kb_file"(
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL CHECK (LENGTH(name) > 0),
    "owner_id" UUID NOT NULL,
    "path" VARCHAR(255) NOT NULL,
    "folder" VARCHAR(255) NOT NULL,
    "size" BIGINT NOT NULL DEFAULT 0,
    "parse_status" VARCHAR(255) NOT NULL DEFAULT 'pending',
    "is_parse_finished" BOOLEAN NOT NULL DEFAULT FALSE,
    "is_parse_failed" BOOLEAN NOT NULL DEFAULT FALSE,
    "is_assets_updated" BOOLEAN NOT NULL DEFAULT FALSE,
    "parse_percentage" FLOAT NOT NULL DEFAULT 0 CHECK (parse_percentage >= 0 AND parse_percentage <= 100),
    "created_at" timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Shanghai'),
    "updated_at" timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Shanghai'),
    PRIMARY KEY("id"),
    FOREIGN KEY("owner_id") REFERENCES "user"("id") ON DELETE CASCADE,
    UNIQUE("path", "owner_id")
);

CREATE INDEX "kb_file_owner_id_index" ON "kb_file"("owner_id");
CREATE INDEX "kb_file_folder_index" ON "kb_file"("folder");
CREATE INDEX "kb_file_path_owner_id_index" ON "kb_file"("path", "owner_id");

CREATE TABLE "file_figures" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "owner_id" UUID NOT NULL,
    "section" VARCHAR(255) NOT NULL,
    "kb_file_id" UUID NOT NULL,
    "img_path" VARCHAR(255) NOT NULL,
    "caption" TEXT NOT NULL,
    "page_number" INT NOT NULL DEFAULT 0,
    PRIMARY KEY("id"),
    FOREIGN KEY("owner_id") REFERENCES "user"("id") ON DELETE CASCADE,
    FOREIGN KEY("kb_file_id") REFERENCES "kb_file"("id") ON DELETE CASCADE
);
CREATE INDEX "file_figures_kb_file_id_index" ON "file_figures"("kb_file_id");
CREATE INDEX "file_figures_owner_index" ON "file_figures"("owner_id");



CREATE TABLE "file_tables" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "owner_id" UUID NOT NULL,
    "section" VARCHAR(255) NOT NULL,
    "kb_file_id" UUID NOT NULL,
    "table_html" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "page_number" INT NOT NULL DEFAULT 0,
    PRIMARY KEY("id"),
    FOREIGN KEY("owner_id") REFERENCES "user"("id") ON DELETE CASCADE,
    FOREIGN KEY("kb_file_id") REFERENCES "kb_file"("id") ON DELETE CASCADE
);
CREATE INDEX "file_table_kb_file_id_index" ON "file_tables"("kb_file_id");
CREATE INDEX "file_table_owner_index" ON "file_tables"("owner_id");




CREATE TABLE "file_texts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "owner_id" UUID NOT NULL,
    "kb_file_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "page_number" INT NOT NULL DEFAULT 0,
    PRIMARY KEY("id"),
    FOREIGN KEY("owner_id") REFERENCES "user"("id") ON DELETE CASCADE,
    FOREIGN KEY("kb_file_id") REFERENCES "kb_file"("id") ON DELETE CASCADE
);

CREATE INDEX "file_text_kb_file_id_index" ON "file_texts"("kb_file_id");
CREATE INDEX "file_text_owner_index" ON "file_texts"("owner_id");


CREATE TABLE "file_full_text" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "owner_id" UUID NOT NULL,
    "kb_file_id" UUID NOT NULL,
    "full_text" TEXT NOT NULL,
    PRIMARY KEY("id"),
    FOREIGN KEY("owner_id") REFERENCES "user"("id") ON DELETE CASCADE,
    FOREIGN KEY("kb_file_id") REFERENCES "kb_file"("id") ON DELETE CASCADE
);

CREATE INDEX "file_full_text_kb_file_id_index" ON "file_full_text"("kb_file_id");
CREATE INDEX "file_full_text_owner_index" ON "file_full_text"("owner_id");


CREATE TABLE "session" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "username" varchar NOT NULL,
    "refresh_token" varchar NOT NULL,
    "user_agent" varchar NOT NULL,
    "client_ip" varchar NOT NULL,
    "is_blocked" boolean NOT NULL DEFAULT false,
    "expires_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Shanghai'),
    PRIMARY KEY("id"),
    FOREIGN KEY ("username") REFERENCES "user" ("username") ON DELETE CASCADE
);

CREATE INDEX ON "session"("expires_at");

CREATE TABLE "user_activity"(
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "activity_type" VARCHAR(255) NOT NULL CHECK (activity_type IN ('login', 'logout', 'update_profile', 'password_reset', 'create_project', 'delete_project', 'train', 'optimization', 'infer', 'postprocess', 'design')),
    "details" TEXT DEFAULT NULL,
    "created_at" timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Shanghai'),
    PRIMARY KEY("id"),
    FOREIGN KEY("user_id") REFERENCES "user"("id") ON DELETE CASCADE
);

-- Indexes
CREATE INDEX "user_email_index" ON "user"("email");
CREATE INDEX "user_username_index" ON "user"("username");
CREATE INDEX "role_name_index" ON "role"("name");
CREATE INDEX "user_activity_user_id_index" ON "user_activity"("user_id");
CREATE INDEX "user_activity_created_at_index" ON "user_activity"("created_at");


CREATE TABLE "kb_file_mapping" (
    "kb_id" UUID NOT NULL,
    "kb_file_id" UUID NOT NULL,
    "build_status" VARCHAR(255) NOT NULL DEFAULT 'pending',
    "build_percentage" FLOAT NOT NULL DEFAULT 0 CHECK (build_percentage >= 0 AND build_percentage <= 100),
    "is_build_finished" BOOLEAN NOT NULL DEFAULT FALSE,
    "is_build_failed" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Shanghai'),
    PRIMARY KEY ("kb_id", "kb_file_id"),
    FOREIGN KEY ("kb_id") REFERENCES "knowledge_base" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("kb_file_id") REFERENCES "kb_file" ("id") ON DELETE CASCADE
);
    
CREATE INDEX ON "kb_file_mapping" ("kb_id");
CREATE INDEX ON "kb_file_mapping" ("kb_file_id");

