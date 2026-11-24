package routes

import (
	"net/http"
	"time"

	"PPT/controllers"
	"PPT/koneksi"
	"PPT/middleware"
	"PPT/repository"
	"PPT/service"

	"github.com/gin-gonic/gin"
)

// SetupRouter registers all routing groups and configurations.
func SetupRouter(r *gin.Engine) {
	// Initialize Repository & Services
	userRepo := repository.NewUserRepository()
	workoutRepo := repository.NewWorkoutRepository()
	authService := service.NewAuthService(userRepo)
	aiService := service.NewAIService(userRepo, workoutRepo)

	// Initialize Controllers
	authController := controllers.NewAuthController(authService)
	aiController := controllers.NewAIController(aiService)
	memberController := controllers.NewMemberController()
	workoutController := controllers.NewWorkoutController(workoutRepo, userRepo, aiService)

	// 0. HEALTH CHECK
	r.GET("/api/health", func(ctx *gin.Context) {
		dbStatus := "not_initialized"
		statusCode := http.StatusOK
		overallStatus := "ok"

		if koneksi.DB != nil {
			sqlDB, err := koneksi.DB.DB()
			if err != nil {
				dbStatus = "error"
				overallStatus = "degraded"
				statusCode = http.StatusServiceUnavailable
			} else if err := sqlDB.PingContext(ctx.Request.Context()); err != nil {
				dbStatus = "disconnected"
				overallStatus = "degraded"
				statusCode = http.StatusServiceUnavailable
			} else {
				dbStatus = "connected"
			}
		}

		ctx.JSON(statusCode, gin.H{
			"status":    overallStatus,
			"database":  dbStatus,
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	// 1. AUTHENTICATION ROUTES (GUEST)
	authGroup := r.Group("/api/auth")
	{
		authGroup.POST("/register", authController.Register)
		authGroup.POST("/login", authController.Login)
	}



	// 3. USER PROFILE (PROTECTED - MEMBER & ADMIN)
	profileGroup := r.Group("/api/users")
	profileGroup.Use(middleware.AuthMiddleware())
	{
		profileGroup.GET("/profile", authController.GetProfile)
		profileGroup.PUT("/profile", authController.UpdateProfile)
	}

	// 4. MEMBER DASHBOARD (PROTECTED - MEMBER ONLY)
	memberGroup := r.Group("/api/member")
	memberGroup.Use(middleware.AuthMiddleware(), middleware.RequireRole("member"))
	{
		memberGroup.GET("/dashboard", memberController.GetDashboard)
		memberGroup.POST("/nutrition", memberController.CreateNutritionLog)
		memberGroup.GET("/nutrition", memberController.GetNutritionLogs)
		memberGroup.GET("/meals/recommendations", aiController.GetMealRecommendations)
		memberGroup.POST("/meals/analyze", aiController.AnalyzeFoodImage)
		memberGroup.POST("/meals/analyze-text", aiController.AnalyzeFoodText)

		memberGroup.GET("/workout-logs", workoutController.GetWorkoutLogs)
		memberGroup.POST("/workout-logs", workoutController.CreateWorkoutLog)
	}

}
