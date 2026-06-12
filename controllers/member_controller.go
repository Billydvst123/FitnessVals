package controllers

import (
	"net/http"
	"time"

	"PPT/koneksi"
	"PPT/models"

	"github.com/gin-gonic/gin"
)

type MemberController struct{}

func NewMemberController() *MemberController {
	return &MemberController{}
}

// GetDashboard returns summaries: calorie deficit targets, nearest classes, BMI progress.
// GET /api/member/dashboard
func (c *MemberController) GetDashboard(ctx *gin.Context) {
	userIDVal, _ := ctx.Get("user_id")
	userID := userIDVal.(uint)

	// 1. Fetch Profile for target calories
	var profile models.MemberProfile
	koneksi.DB.Where("user_id = ?", userID).First(&profile)

	// 2. Fetch today's logs & calculate calories
	today := time.Now().Format("2006-01-02")
	
	var todayNutrition []models.NutritionLog
	koneksi.DB.Where("member_id = ? AND log_date = ?", userID, today).Find(&todayNutrition)

	totalCalorieConsumed := 0
	for _, n := range todayNutrition {
		totalCalorieConsumed += n.Calories
	}

	target := profile.DailyCalorieTarget
	if target == 0 {
		target = 2000 // Fallback default
	}
	remainingCalorie := target - totalCalorieConsumed

	// 3. Fetch BMI logs (last 5 records)
	var bmiLogs []models.BMILog
	koneksi.DB.Where("user_id = ?", userID).Order("recorded_at desc").Limit(5).Find(&bmiLogs)

	ctx.JSON(http.StatusOK, gin.H{
		"calorie_summary": gin.H{
			"daily_target":      target,
			"calories_consumed": totalCalorieConsumed,
			"remaining_calorie": remainingCalorie,
		},
		"bmi_progress":     bmiLogs,
	})
}

// CreateNutritionLog records daily meals.
// POST /api/member/nutrition
func (c *MemberController) CreateNutritionLog(ctx *gin.Context) {
	userIDVal, _ := ctx.Get("user_id")
	userID := userIDVal.(uint)

	var req struct {
		FoodName string  `json:"food_name" binding:"required"`
		Calories int     `json:"calories" binding:"required"`
		Protein  float64 `json:"protein"`
		Carbs    float64 `json:"carbs"`
		Fat      float64 `json:"fat"`
		MealTime string  `json:"meal_time" binding:"required,oneof=breakfast lunch dinner snack"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log := models.NutritionLog{
		MemberID: userID,
		FoodName: req.FoodName,
		Calories: req.Calories,
		Protein:  req.Protein,
		Carbs:    req.Carbs,
		Fat:      req.Fat,
		MealTime: req.MealTime,
		LogDate:  time.Now(),
	}

	if err := koneksi.DB.Create(&log).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Nutrition log added successfully", "data": log})
}

// GetNutritionLogs fetches user nutrition history.
// GET /api/member/nutrition
func (c *MemberController) GetNutritionLogs(ctx *gin.Context) {
	userIDVal, _ := ctx.Get("user_id")
	userID := userIDVal.(uint)

	var logs []models.NutritionLog
	if err := koneksi.DB.Where("member_id = ?", userID).Order("created_at desc").Find(&logs).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": logs})
}
