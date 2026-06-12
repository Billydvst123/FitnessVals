package middleware

import (
	"net/http"
	"strings"

	"PPT/utils"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates the JWT token and extracts claims.
func AuthMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token is required"})
			ctx.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			ctx.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			ctx.Abort()
			return
		}

		// Inject User ID and Role into the Gin context
		ctx.Set("user_id", claims.UserID)
		ctx.Set("role", claims.Role)
		ctx.Next()
	}
}

// RequireRole restricts route access to specific roles (e.g., "admin", "member").
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		roleVal, exists := ctx.Get("role")
		if !exists {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Role information not found"})
			ctx.Abort()
			return
		}

		role, ok := roleVal.(string)
		if !ok {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assert user role"})
			ctx.Abort()
			return
		}

		roleMatched := false
		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				roleMatched = true
				break
			}
		}

		if !roleMatched {
			ctx.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to access this resource"})
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}
