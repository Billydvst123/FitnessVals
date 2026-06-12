package models

import (
	"time"
)

// NutritionLog records food and calorie intake for a member.
type NutritionLog struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	MemberID  uint      `json:"member_id" gorm:"not null"`
	FoodName  string    `json:"food_name" gorm:"type:varchar(100);not null"`
	Calories  int       `json:"calories" gorm:"not null"`
	Protein   float64   `json:"protein" gorm:"type:decimal(5,2);default:0"` // in grams
	Carbs     float64   `json:"carbs" gorm:"type:decimal(5,2);default:0"`   // in grams
	Fat       float64   `json:"fat" gorm:"type:decimal(5,2);default:0"`     // in grams
	MealTime  string    `json:"meal_time" gorm:"type:enum('breakfast', 'lunch', 'dinner', 'snack');default:'snack';not null"`
	LogDate   time.Time `json:"log_date" gorm:"type:date;not null"`
	CreatedAt time.Time `json:"created_at"`
}


