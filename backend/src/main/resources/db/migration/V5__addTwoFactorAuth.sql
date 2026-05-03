
Alter table Users ADD COLUMN totp_secret VARCHAR(255);

Alter table Users ADD COLUMN totp_enabled BOOLEAN NOT NULL DEFAULT FALSE;

Alter table Users ADD COLUMN totp_verified BOOLEAN NOT NULL DEFAULT FALSE;


CREATE TABLE RecoveryCodes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(255) NOT NULL UNIQUE,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
)