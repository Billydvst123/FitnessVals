package controllers

import (
	"net/http"

	"PPT/service"

	"github.com/gin-gonic/gin"
)

type AIController struct {
	aiService service.AIService
}

func NewAIController(aiService service.AIService) *AIController {
	return &AIController{aiService: aiService}
}

// GetMealRecommendations returns AI-curated nutrition advice for the authenticated user.
// GET /api/member/meals/recommendations
func (c *AIController) GetMealRecommendations(ctx *gin.Context) {
	userIDVal, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, ok := userIDVal.(uint)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve user ID"})
		return
	}

	recommendation, err := c.aiService.GetMealRecommendation(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"recommendation": recommendation,
	})
}

// AnalyzeFoodImage processes an uploaded base64 image and returns nutrition info.
// POST /api/member/meals/analyze
func (c *AIController) AnalyzeFoodImage(ctx *gin.Context) {
	_, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		ImageBase64 string `json:"image_base64" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	result, err := c.aiService.AnalyzeFoodImage(req.ImageBase64)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": result,
	})
}

// AnalyzeFoodText estimates nutrition based on a text query (food name).
// POST /api/member/meals/analyze-text
func (c *AIController) AnalyzeFoodText(ctx *gin.Context) {
	_, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		FoodName string `json:"food_name" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	result, err := c.aiService.AnalyzeFoodText(req.FoodName)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to analyze food name"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": result,
	})
}
