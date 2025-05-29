-- Define the Users table
CREATE TABLE Users (
    user_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token VARCHAR(100) NULL UNIQUE,
    email_verification_expires_at TIMESTAMPTZ NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending_verification', -- ('pending_verification', 'active', 'suspended', 'deactivated', 'banned')
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for username and email
CREATE INDEX idx_users_username ON Users (username);
CREATE INDEX idx_users_email ON Users (email);

-- It's good practice to have a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the Users table
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON Users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
