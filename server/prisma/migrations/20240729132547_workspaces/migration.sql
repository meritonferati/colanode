-- CreateTable
CREATE TABLE "accounts" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "email" VARCHAR(256) NOT NULL,
    "avatar" VARCHAR(256),
    "password" VARCHAR(256),
    "attrs" JSONB DEFAULT 'null',
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "status" INTEGER NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "attrs" JSONB DEFAULT 'null',
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" VARCHAR(30) NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(30),
    "status" INTEGER NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_accounts" (
    "workspace_id" VARCHAR(30) NOT NULL,
    "account_id" VARCHAR(30) NOT NULL,
    "role" INTEGER NOT NULL,
    "attrs" JSONB DEFAULT 'null',
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" VARCHAR(30) NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(30),
    "status" INTEGER NOT NULL,

    CONSTRAINT "workspace_accounts_pkey" PRIMARY KEY ("workspace_id","account_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IX_accounts_email" ON "accounts"("email");
