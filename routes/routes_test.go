package routes

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"PPT/koneksi"

	"github.com/gin-gonic/gin"
)

func TestHealthEndpoint_WithoutDB(t *testing.T) {
	gin.SetMode(gin.TestMode)

	origDB := koneksi.DB
	koneksi.DB = nil
	defer func() {
		koneksi.DB = origDB
	}()

	r := gin.New()
	SetupRouter(r)

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var body map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse health JSON: %v", err)
	}

	if body["status"] != "ok" {
		t.Errorf("expected status 'ok', got %q", body["status"])
	}
	if body["database"] != "not_initialized" {
		t.Errorf("expected database 'not_initialized', got %q", body["database"])
	}
	if body["timestamp"] == "" {
		t.Error("expected non-empty timestamp")
	}
}
