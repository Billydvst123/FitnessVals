package service

import (
	"errors"
	"time"

	"PPT/models"
	"PPT/repository"
	"PPT/utils"

	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type UpdateProfileRequest struct {
	Height             float64 `json:"height" binding:"required,gt=0"`
	Weight             float64 `json:"weight" binding:"required,gt=0"`
	Age                int     `json:"age" binding:"required,gt=0"`
	Gender             string  `json:"gender" binding:"required,oneof=male female"`
	DailyCalorieTarget int     `json:"daily_calorie_target" binding:"required,gt=0"`
	DietaryPreferences string  `json:"dietary_preferences"`
	MedicalHistory     string  `json:"medical_history"`
}

type ProfileResponse struct {
	UserID             uint      `json:"user_id"`
	Name               string    `json:"name"`
	Email              string    `json:"email"`
	Role               string    `json:"role"`
	Height             float64   `json:"height"`
	Weight             float64   `json:"weight"`
	Age                int       `json:"age"`
	Gender             string    `json:"gender"`
	DailyCalorieTarget int       `json:"daily_calorie_target"`
	DietaryPreferences string    `json:"dietary_preferences"`
	MedicalHistory     string    `json:"medical_history"`
	CurrentBMI         float64   `json:"current_bmi"`
	BMICategory        string    `json:"bmi_category"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type AuthService interface {
	RegisterMember(req RegisterRequest) error
	Login(req LoginRequest) (string, error)
	GetProfile(userID uint) (*ProfileResponse, error)
	UpdateProfile(userID uint, req UpdateProfileRequest) error
}

type authService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) RegisterMember(req RegisterRequest) error {
	// Check if email already registered
	existingUser, _ := s.userRepo.GetUserByEmail(req.Email)
	if existingUser != nil {
		return errors.New("email is already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := &models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     "member",
		Status:   "active",
	}

	err = s.userRepo.CreateUser(user)
	if err != nil {
		return err
	}

	// Create an empty default profile for the user
	profile := &models.MemberProfile{
		UserID:             user.ID,
		Height:             0,
		Weight:             0,
		Age:                0,
		Gender:             "male",
		DailyCalorieTarget: 2000,
		DietaryPreferences: "",
		MedicalHistory:     "",
	}
	_ = s.userRepo.SaveProfile(profile)

	return nil
}

func (s *authService) Login(req LoginRequest) (string, error) {
	user, err := s.userRepo.GetUserByEmail(req.Email)
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	if user.Status == "inactive" {
		return "", errors.New("your account is inactive. Please contact admin")
	}

	// Generate JWT
	token, err := utils.GenerateToken(user.ID, user.Role)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *authService) GetProfile(userID uint) (*ProfileResponse, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	profile, err := s.userRepo.GetProfileByUserID(userID)
	if err != nil {
		return nil, err
	}

	if profile == nil {
		profile = &models.MemberProfile{
			UserID:             userID,
			Height:             0,
			Weight:             0,
			Age:                0,
			Gender:             "male",
			DailyCalorieTarget: 2000,
			DietaryPreferences: "",
			MedicalHistory:     "",
		}
		_ = s.userRepo.SaveProfile(profile)
	}

	// Calculate BMI
	bmi := 0.0
	bmiCategory := "Not Set"
	if profile.Height > 0 {
		heightInMeters := profile.Height / 100.0
		bmi = profile.Weight / (heightInMeters * heightInMeters)
		bmiCategory = getBMICategory(bmi)
	}

	return &ProfileResponse{
		UserID:             user.ID,
		Name:               user.Name,
		Email:              user.Email,
		Role:               user.Role,
		Height:             profile.Height,
		Weight:             profile.Weight,
		Age:                profile.Age,
		Gender:             profile.Gender,
		DailyCalorieTarget: profile.DailyCalorieTarget,
		DietaryPreferences: profile.DietaryPreferences,
		MedicalHistory:     profile.MedicalHistory,
		CurrentBMI:         bmi,
		BMICategory:        bmiCategory,
		UpdatedAt:          profile.UpdatedAt,
	}, nil
}

func (s *authService) UpdateProfile(userID uint, req UpdateProfileRequest) error {
	profile, err := s.userRepo.GetProfileByUserID(userID)
	if err != nil {
		return err
	}

	if profile == nil {
		profile = &models.MemberProfile{UserID: userID}
	}

	profile.Height = req.Height
	profile.Weight = req.Weight
	profile.Age = req.Age
	profile.Gender = req.Gender
	profile.DailyCalorieTarget = req.DailyCalorieTarget
	profile.DietaryPreferences = req.DietaryPreferences
	profile.MedicalHistory = req.MedicalHistory
	profile.UpdatedAt = time.Now()

	err = s.userRepo.SaveProfile(profile)
	if err != nil {
		return err
	}

	// Log BMI history
	heightInMeters := req.Height / 100.0
	bmi := req.Weight / (heightInMeters * heightInMeters)

	bmiLog := &models.BMILog{
		UserID:     userID,
		Weight:     req.Weight,
		Height:     req.Height,
		BMI:        bmi,
		RecordedAt: time.Now(),
	}

	_ = s.userRepo.CreateBMILog(bmiLog)

	return nil
}

// Helper to determine BMI Category (Standard WHO)
func getBMICategory(bmi float64) string {
	if bmi < 18.5 {
		return "Underweight (Kurus)"
	} else if bmi >= 18.5 && bmi < 25.0 {
		return "Normal Weight (Ideal)"
	} else if bmi >= 25.0 && bmi < 30.0 {
		return "Overweight (Gemuk)"
	} else {
		return "Obese (Obesitas)"
	}
}
