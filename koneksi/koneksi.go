package koneksi

import (
	"fmt"

	"PPT/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func KoneksiDatabase() {
	
	dsn := "root:@tcp(127.0.0.1:3306)/cobappt?charset=utf8mb4&parseTime=True&loc=Local"
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
