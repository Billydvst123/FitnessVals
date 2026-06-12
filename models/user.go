package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents both Members and Admins depending on the Role field.
type User struct {
	gorm.Model
	Name               string         `json:"name" gorm:"type:varchar(100);not null"`
	Email              string         `json:"email" gorm:"type:varchar(100);uniqueIndex;not null"`
	Password           string         `json:"-" gorm:"type:varchar(255);not null"` // Hash password, ignored in JSON response
	Role               string         `json:"role" gorm:"type:enum('admin', 'member');default:'member';not null"`
	Status             string         `json:"status" gorm:"type:enum('active', 'inactive');default:'active';not null"`
	Profile            *MemberProfile `json:"profile,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;"`
	BMILogs            []BMILog       `json:"bmi_logs,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;"`
}

// MemberProfile stores physical measurements and targets for BMI and caloric intake.
type MemberProfile struct {
	ID                 uint      `json:"id" gorm:"primaryKey"`
	UserID             uint      `json:"user_id" gorm:"uniqueIndex;not null"`
	Height             float64   `json:"height" gorm:"type:decimal(5,2);default:0"` // in cm
	Weight             float64   `json:"weight" gorm:"type:decimal(5,2);default:0"` // in kg
	Age                int       `json:"age" gorm:"default:0"`
	Gender             string    `json:"gender" gorm:"type:enum('male', 'female');default:'male'"`
	DailyCalorieTarget int       `json:"daily_calorie_target" gorm:"default:2000"`
	DietaryPreferences string    `json:"dietary_preferences" gorm:"type:text"`
	MedicalHistory     string    `json:"medical_history" gorm:"type:text"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// BMILog records history of BMI measurements over time.
type BMILog struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	UserID     uint      `json:"user_id" gorm:"not null"`
	Weight     float64   `json:"weight" gorm:"type:decimal(5,2);not null"`
	Height     float64   `json:"height" gorm:"type:decimal(5,2);not null"`
	BMI        float64   `json:"bmi" gorm:"type:decimal(4,2);not null"`
	RecordedAt time.Time `json:"recorded_at" gorm:"default:CURRENT_TIMESTAMP"`
}
