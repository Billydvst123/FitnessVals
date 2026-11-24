package utils

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestGenerateAndValidateToken_DefaultSecret(t *testing.T) {
	t.Setenv("JWT_SECRET", "")

	token, err := GenerateToken(42, "member")
	if err != nil {
		t.Fatalf("expected no error generating token, got: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("expected no error validating token, got: %v", err)
	}
	if claims.UserID != 42 {
		t.Errorf("expected UserID 42, got %d", claims.UserID)
	}
	if claims.Role != "member" {
		t.Errorf("expected Role 'member', got %q", claims.Role)
	}
	if claims.ExpiresAt == nil || claims.ExpiresAt.Time.Before(time.Now()) {
		t.Errorf("expected future expiration time, got %v", claims.ExpiresAt)
	}
}

func TestGenerateAndValidateToken_EnvSecret(t *testing.T) {
	t.Setenv("JWT_SECRET", "custom-test-secret-key")

	token, err := GenerateToken(7, "admin")
	if err != nil {
		t.Fatalf("expected no error generating token, got: %v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("expected token to validate with same env secret, got: %v", err)
	}
	if claims.UserID != 7 || claims.Role != "admin" {
		t.Errorf("unexpected claims: %+v", claims)
	}

	// Changing JWT_SECRET must invalidate tokens signed with the previous secret.
	t.Setenv("JWT_SECRET", "another-secret-key")
	if _, err := ValidateToken(token); err == nil {
		t.Fatal("expected error validating token after JWT_SECRET changed, got nil")
	}
}

func TestValidateToken_InvalidAndExpired(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")

	if _, err := ValidateToken("not-a-jwt-token"); err == nil {
		t.Error("expected error for malformed token, got nil")
	}
	if _, err := ValidateToken(""); err == nil {
		t.Error("expected error for empty token, got nil")
	}

	expiredClaims := &Claims{
		UserID: 99,
		Role:   "member",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
		},
	}
	expiredToken := jwt.NewWithClaims(jwt.SigningMethodHS256, expiredClaims)
	signed, err := expiredToken.SignedString(getJWTSecret())
	if err != nil {
		t.Fatalf("failed to sign expired test token: %v", err)
	}

	if _, err := ValidateToken(signed); err == nil {
		t.Error("expected error for expired token, got nil")
	}
}
