
CREATE TABLE Users(

    id UUID PRIMARY KEY,

    first_name VARCHAR(255) NOT NULL,

    last_name VARCHAR(255) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    hashed_password VARCHAR(255) NOT NULL,

    role VARCHAR(255) NOT NULL,

    account_status VARCHAR(255) NOT NULL,

    created_at TIMESTAMP NOT NULL,

    updated_at TIMESTAMP NOT NULL

);


CREATE TABLE Wallet(

    id UUID PRIMARY Key,

    user_id UUID REFERENCES Users(id) NOT NULL,

    balance DECIMAL NOT NULL,

    version INTEGER NOT NULL,

    created_at TIMESTAMP NOT NULL,

    updated_at TIMESTAMP NOT NULL


);


CREATE TABLE Transactions (

    id UUID PRIMARY KEY,

    sender_id UUID REFERENCES Users(id) NOT NULL,

    receiver_id UUID REFERENCES Users(id) NOT NULL,

    wallet_id UUID REFERENCES Wallet(id) NOT NULL,

    amount DECIMAL NOT NULL,

    type VARCHAR(255) NOT NULL,

    status VARCHAR(255) NOT NULL,

    created_at TIMESTAMP NOT NULL,

    updated_at TIMESTAMP NOT NULL

);

CREATE Table PaymentStatusHistory(

    id UUID PRIMARY KEY,

    transaction_id UUID REFERENCES Transactions(id) NOT NULL,

    status VARCHAR(255) NOT NULL,

    created_at TIMESTAMP NOT NULL


);


CREATE Table AuditLog (

    id UUID PRIMARY KEY,

    user_id UUID REFERENCES Users(id) NOT NULL,

    event_type VARCHAR(255) NOT NULL,

    created_at TIMESTAMP NOT NULL,

    ip_address VARCHAR(255) NOT NULL

);