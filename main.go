package main

import (
	"fmt"
	"log"

	"PPT/koneksi"
	"PPT/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// CORSMiddleware enables Cross-Origin Resource Sharing for the React frontend.
func CORSMiddleware() gin.HandlerFunc {
	allowedOrigins := map[string]bool{
		"http://localhost:5173":  true,
		"http://localhost:8081":  true,
		"http://localhost:8082":  true,
		"http://localhost:19006": true,
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if allowedOrigins[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func main() {
	// Load environment variables from .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or error loading it, using system environment variables")
	}

	// Initialize database connection
	koneksi.KoneksiDatabase()

	// Initialize Gin router
	r := gin.Default()

	// Enable CORS
	r.Use(CORSMiddleware())

	// Configure routing groups
	routes.SetupRouter(r)

	fmt.Println("Server is running on http://localhost:3000")
	if err := r.Run(":3000"); err != nil {
		panic(fmt.Sprintf("Failed to start server: %v", err))
	}
}
