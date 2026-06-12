package repository

import (
	"time"

	"PPT/koneksi"
	"PPT/models"
)

type WorkoutRepository interface {
	Create(log *models.WorkoutLog) error
	GetByUserID(userID uint) ([]models.WorkoutLog, error)
	GetRecentByUserID(userID uint, hours int) ([]models.WorkoutLog, error)
}

type workoutRepository struct{}

func NewWorkoutRepository() WorkoutRepository {
	return &workoutRepository{}
}

func (r *workoutRepository) Create(log *models.WorkoutLog) error {
	return koneksi.DB.Create(log).Error
}

func (r *workoutRepository) GetByUserID(userID uint) ([]models.WorkoutLog, error) {
	var logs []models.WorkoutLog
	err := koneksi.DB.Where("user_id = ?", userID).Order("date desc").Find(&logs).Error
	return logs, err
}

func (r *workoutRepository) GetRecentByUserID(userID uint, hours int) ([]models.WorkoutLog, error) {
	var logs []models.WorkoutLog
	timeLimit := time.Now().Add(time.Duration(-hours) * time.Hour)
	err := koneksi.DB.Where("user_id = ? AND date >= ?", userID, timeLimit).Order("date desc").Find(&logs).Error
	return logs, err
}
