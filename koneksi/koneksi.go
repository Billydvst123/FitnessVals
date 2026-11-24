package koneksi

import (
	"fmt"
	"os"

	"PPT/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func KoneksiDatabase() {
	dbHost := getEnv("DB_HOST", "127.0.0.1")
	dbPort := getEnv("DB_PORT", "3306")
	dbUser := getEnv("DB_USER", "root")
	dbPass := os.Getenv("DB_PASS")
	dbName := getEnv("DB_NAME", "cobappt")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", dbUser, dbPass, dbHost, dbPort, dbName)
	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to database: %v", err))
	}

	err = database.AutoMigrate(
		&models.User{},
		&models.MemberProfile{},
		&models.BMILog{},
		&models.NutritionLog{},
		&models.WorkoutLog{},
	)
	if err != nil {
		panic(fmt.Sprintf("Database Migration Failed: %v", err))
	}

	DB = database
	fmt.Println("Database connection & migration completed successfully.")


	seedDatabase()
}

func seedDatabase() {
	// Database seeding if necessary for base settings
}
