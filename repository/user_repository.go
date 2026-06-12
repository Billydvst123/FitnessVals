package repository

import (
	"errors"

	"PPT/koneksi"
	"PPT/models"

	"gorm.io/gorm"
)

type UserRepository interface {
	CreateUser(user *models.User) error
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id uint) (*models.User, error)
	UpdateUser(user *models.User) error
	GetProfileByUserID(userID uint) (*models.MemberProfile, error)
	SaveProfile(profile *models.MemberProfile) error
	CreateBMILog(log *models.BMILog) error
	GetBMILogs(userID uint) ([]models.BMILog, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository() UserRepository {
	return &userRepository{db: koneksi.DB}
}

func (r *userRepository) CreateUser(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Profile").Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Profile").First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) UpdateUser(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) GetProfileByUserID(userID uint) (*models.MemberProfile, error) {
	var profile models.MemberProfile
	err := r.db.Where("user_id = ?", userID).First(&profile).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &profile, nil
}

func (r *userRepository) SaveProfile(profile *models.MemberProfile) error {
	return r.db.Save(profile).Error
}

func (r *userRepository) CreateBMILog(log *models.BMILog) error {
	return r.db.Create(log).Error
}

func (r *userRepository) GetBMILogs(userID uint) ([]models.BMILog, error) {
	var logs []models.BMILog
	err := r.db.Where("user_id = ?", userID).Order("recorded_at desc").Find(&logs).Error
	return logs, err
}
