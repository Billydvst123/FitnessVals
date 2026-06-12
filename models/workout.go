package models

import (
	"time"

	"gorm.io/gorm"
)

// WorkoutLog records a user's workout session
type WorkoutLog struct {
	ID              uint           `json:"id" gorm:"primaryKey"`
	UserID          uint           `json:"user_id" gorm:"not null"`
	WorkoutType     string         `json:"workout_type" gorm:"type:enum('cardio', 'weightlifting');not null"`
	WorkoutName     string         `json:"workout_name" gorm:"type:varchar(150);not null"`
	DurationMinutes *int           `json:"duration_minutes" gorm:"type:int"` // Optional for weightlifting
	Sets            *int           `json:"sets" gorm:"type:int"`             // Optional for cardio
	Reps            *int           `json:"reps" gorm:"type:int"`             // Optional for cardio
	WeightKg        *float64       `json:"weight_kg" gorm:"type:decimal(5,2)"`// Optional for cardio
	CaloriesBurned  *int           `json:"calories_burned" gorm:"type:int"`
	Date            time.Time      `json:"date" gorm:"default:CURRENT_TIMESTAMP"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
}
