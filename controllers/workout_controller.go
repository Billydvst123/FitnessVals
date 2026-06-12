package controllers

import (
	"net/http"

	"PPT/models"
	"PPT/repository"

	"PPT/service"

	"github.com/gin-gonic/gin"
)

type WorkoutController struct {
	workoutRepo repository.WorkoutRepository
	userRepo    repository.UserRepository
	aiService   service.AIService
}

func NewWorkoutController(workoutRepo repository.WorkoutRepository, userRepo repository.UserRepository, aiService service.AIService) *WorkoutController {
	return &WorkoutController{
		workoutRepo: workoutRepo,
		userRepo:    userRepo,
		aiService:   aiService,
	}
}

// CreateWorkoutLog handles POST /api/member/workout-logs
func (c *WorkoutController) CreateWorkoutLog(ctx *gin.Context) {
	userIDVal, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	var req models.WorkoutLog
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.UserID = userID

	if req.CaloriesBurned == nil || *req.CaloriesBurned == 0 {
		profile, err := c.userRepo.GetProfileByUserID(userID)
		if err == nil && profile != nil {
			cal, err := c.aiService.CalculateWorkoutCalories(&req, profile)
			if err == nil && cal > 0 {
				req.CaloriesBurned = &cal
			}
		}
	}

	if err := c.workoutRepo.Create(&req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create workout log"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": req, "message": "Workout logged successfully"})
}

// GetWorkoutLogs handles GET /api/member/workout-logs
func (c *WorkoutController) GetWorkoutLogs(ctx *gin.Context) {
	userIDVal, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	logs, err := c.workoutRepo.GetByUserID(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workout logs"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": logs})
}
