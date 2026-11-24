package service

import (
	"math"
	"strings"
	"testing"

	"PPT/models"
)

func TestExtractJSON(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "pure json",
			input:    `{"is_food":true,"calories":250}`,
			expected: `{"is_food":true,"calories":250}`,
		},
		{
			name:     "markdown fenced json",
			input:    "```json\n{\"is_food\":true,\"food_name\":\"Nasi Goreng\"}\n```",
			expected: `{"is_food":true,"food_name":"Nasi Goreng"}`,
		},
		{
			name:     "json surrounded by prose",
			input:    "Berikut hasilnya: {\"calories_burned\": 320} semoga membantu.",
			expected: `{"calories_burned": 320}`,
		},
		{
			name:     "nested json",
			input:    "Output:\n{\"outer\":{\"inner\":1}}\nDone",
			expected: `{"outer":{"inner":1}}`,
		},
		{
			name:     "no json braces",
			input:    "plain text without json",
			expected: "plain text without json",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := extractJSON(tc.input)
			if got != tc.expected {
				t.Errorf("extractJSON(%q) = %q, want %q", tc.input, got, tc.expected)
			}
		})
	}
}

func TestGetBMICategory(t *testing.T) {
	tests := []struct {
		bmi      float64
		expected string
	}{
		{16.5, "Underweight (Kurus)"},
		{18.49, "Underweight (Kurus)"},
		{18.5, "Normal Weight (Ideal)"},
		{22.4, "Normal Weight (Ideal)"},
		{24.99, "Normal Weight (Ideal)"},
		{25.0, "Overweight (Gemuk)"},
		{29.9, "Overweight (Gemuk)"},
		{30.0, "Obese (Obesitas)"},
		{35.5, "Obese (Obesitas)"},
	}

	for _, tc := range tests {
		got := getBMICategory(tc.bmi)
		if got != tc.expected {
			t.Errorf("getBMICategory(%.2f) = %q, want %q", tc.bmi, got, tc.expected)
		}
	}
}

func TestGetMockTextNutrition(t *testing.T) {
	svc := &aiService{}

	t.Run("known food keywords accumulate nutrition", func(t *testing.T) {
		res := svc.getMockTextNutrition("Nasi Ayam Goreng")
		if !res.IsFood {
			t.Error("expected IsFood to be true")
		}
		if !strings.Contains(res.FoodName, "(Estimasi Offline)") {
			t.Errorf("expected offline label in FoodName, got %q", res.FoodName)
		}
		// nasi (204) + ayam (165) + goreng (120) = 489
		if res.Calories != 489 {
			t.Errorf("expected Calories 489, got %d", res.Calories)
		}
		if math.Abs(res.Protein-35.2) > 0.01 {
			t.Errorf("expected Protein 35.2, got %.2f", res.Protein)
		}
		if math.Abs(res.Carbs-49.0) > 0.01 {
			t.Errorf("expected Carbs 49.0, got %.2f", res.Carbs)
		}
		if math.Abs(res.Fat-14.0) > 0.01 {
			t.Errorf("expected Fat 14.0, got %.2f", res.Fat)
		}
	})

	t.Run("unknown food uses default fallback", func(t *testing.T) {
		res := svc.getMockTextNutrition("Smoothie Bowl")
		if !res.IsFood {
			t.Error("expected IsFood to be true")
		}
		if res.Calories != 300 || res.Protein != 15.0 || res.Carbs != 40.0 || res.Fat != 10.0 {
			t.Errorf("unexpected fallback values: %+v", res)
		}
	})
}

func TestGetMockWorkoutCalories(t *testing.T) {
	svc := &aiService{}
	dur45 := 45
	sets4 := 4
	reps12 := 12

	tests := []struct {
		name     string
		workout  *models.WorkoutLog
		expected int
	}{
		{
			name:     "cardio with duration",
			workout:  &models.WorkoutLog{WorkoutType: "cardio", DurationMinutes: &dur45},
			expected: 360,
		},
		{
			name:     "cardio default duration",
			workout:  &models.WorkoutLog{WorkoutType: "cardio"},
			expected: 240,
		},
		{
			name:     "weightlifting with sets and reps",
			workout:  &models.WorkoutLog{WorkoutType: "weightlifting", Sets: &sets4, Reps: &reps12},
			expected: 96,
		},
		{
			name:     "weightlifting default sets and reps",
			workout:  &models.WorkoutLog{WorkoutType: "weightlifting"},
			expected: 60,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := svc.getMockWorkoutCalories(tc.workout)
			if got != tc.expected {
				t.Errorf("getMockWorkoutCalories() = %d, want %d", got, tc.expected)
			}
		})
	}
}

func TestGetMockRecommendation(t *testing.T) {
	svc := &aiService{}

	tests := []struct {
		name            string
		bmi             float64
		category        string
		calorieTarget   int
		expectedSnippet string
	}{
		{
			name:            "underweight bulking",
			bmi:             17.2,
			category:        "Underweight (Kurus)",
			calorieTarget:   2600,
			expectedSnippet: "Bulking / Weight Gain",
		},
		{
			name:            "normal maintenance",
			bmi:             22.0,
			category:        "Normal Weight (Ideal)",
			calorieTarget:   2100,
			expectedSnippet: "Maintenance & Fit",
		},
		{
			name:            "overweight deficit",
			bmi:             28.5,
			category:        "Overweight (Gemuk)",
			calorieTarget:   1700,
			expectedSnippet: "Defisit Kalori / Weight Loss",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			profile := &models.MemberProfile{DailyCalorieTarget: tc.calorieTarget}
			got := svc.getMockRecommendation(profile, tc.bmi, tc.category)
			if !strings.Contains(got, tc.expectedSnippet) {
				t.Errorf("expected recommendation to contain %q, got:\n%s", tc.expectedSnippet, got)
			}
		})
	}
}

func TestOllamaEnvConfig(t *testing.T) {
	t.Setenv("OLLAMA_URL", "")
	t.Setenv("OLLAMA_MODEL", "")
	if got := getOllamaURL(); got != defaultOllamaURL {
		t.Errorf("default getOllamaURL() = %q, want %q", got, defaultOllamaURL)
	}
	if got := getOllamaModel(); got != defaultOllamaModel {
		t.Errorf("default getOllamaModel() = %q, want %q", got, defaultOllamaModel)
	}

	t.Setenv("OLLAMA_URL", "http://localhost:11435/")
	t.Setenv("OLLAMA_MODEL", "llama3.2-vision")
	if got := getOllamaURL(); got != "http://localhost:11435" {
		t.Errorf("override getOllamaURL() = %q, want %q", got, "http://localhost:11435")
	}
	if got := getOllamaModel(); got != "llama3.2-vision" {
		t.Errorf("override getOllamaModel() = %q, want %q", got, "llama3.2-vision")
	}
}
