package token

import (
	"time"
)

const (
	AuthorizationHeader = "authorization"
	AuthorizationBearer = "bearer"
)

// Maker is an interface for managing tokens
type Maker interface {
	// CreateToken creates a new token for a specific username and duration
	CreateToken(username string, role string, duration time.Duration) (string, *Payload, error)
	// VerifyToken checks if the token is valid or not
	VerifyToken(token string) (*Payload, error)
}
