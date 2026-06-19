package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"PPT/models"
	"PPT/repository"
)

type FoodNutritionResult struct {
	IsFood   bool    `json:"is_food"`
	FoodName string  `json:"food_name"`
	Calories int     `json:"calories"`
	Protein  float64 `json:"protein"`
	Carbs    float64 `json:"carbs"`
	Fat      float64 `json:"fat"`
}

type AIService interface {
	GetMealRecommendation(userID uint) (string, error)
	AnalyzeFoodImage(imageBase64 string) (*FoodNutritionResult, error)
	AnalyzeFoodText(foodName string) (*FoodNutritionResult, error)
	CalculateWorkoutCalories(workout *models.WorkoutLog, profile *models.MemberProfile) (int, error)
}

type aiService struct {
	userRepo    repository.UserRepository
	workoutRepo repository.WorkoutRepository
}

func NewAIService(userRepo repository.UserRepository, workoutRepo repository.WorkoutRepository) AIService {
	return &aiService{userRepo: userRepo, workoutRepo: workoutRepo}
}

// GetMealRecommendation generates tailored healthy diet recommendations.
func (s *aiService) GetMealRecommendation(userID uint) (string, error) {
	profile, err := s.userRepo.GetProfileByUserID(userID)
	if err != nil {
		return "", err
	}

	if profile == nil || profile.Height == 0 {
		return "Silakan lengkapi profil fisik Anda terlebih dahulu (Tinggi, Berat Badan) agar AI dapat menghitung rekomendasi makanan yang sesuai.", nil
	}

	heightInMeters := profile.Height / 100.0
	bmi := profile.Weight / (heightInMeters * heightInMeters)
	bmiCategory := getBMICategory(bmi)

	// Fetch recent workouts (last 24 hours)
	workouts, _ := s.workoutRepo.GetRecentByUserID(userID, 24)
	workoutText := "Tidak ada latihan hari ini."
	if len(workouts) > 0 {
		var wList []string
		for _, w := range workouts {
			if w.WorkoutType == "cardio" && w.DurationMinutes != nil {
				wList = append(wList, fmt.Sprintf("%s (Cardio, %d menit)", w.WorkoutName, *w.DurationMinutes))
			} else if w.WorkoutType == "weightlifting" && w.Sets != nil && w.Reps != nil {
				wList = append(wList, fmt.Sprintf("%s (Angkat Beban, %d set x %d reps)", w.WorkoutName, *w.Sets, *w.Reps))
			}
		}
		if len(wList) > 0 {
			workoutText = "Latihan hari ini: " + strings.Join(wList, ", ") + "."
		}
	}

	prompt := fmt.Sprintf(
		"Sebagai pakar gizi AI (Nutritionist), berikan rekomendasi menu makanan sehat lengkap (Sarapan, Makan Siang, Makan Malam, Camilan) untuk seorang dengan profil: "+
			"Gender: %s, Umur: %d tahun, Tinggi: %.1f cm, Berat: %.1f kg, BMI: %.2f (%s), Target Kalori Dasar: %d kcal. "+
			"Preferensi Makanan (Wajib Diikuti): %s. "+
			"Riwayat Penyakit/Kondisi Medis (Sangat Penting): %s. "+
			"Aktivitas Latihan: %s "+
			"Penting 1: Sesuaikan rekomendasi secara KETAT dengan Preferensi Makanan dan Riwayat Penyakit. Pastikan makanan aman. "+
			"Penting 2: Jika ada aktivitas latihan hari ini, otomatis tambahkan target kalori (misal +300-500 kcal) dan perbanyak porsi protein/karbohidrat untuk mendukung pemulihan pasca-latihan! "+
			"Penting 3: Format output HARUS persis seperti ini:\n"+
			"* **Sarapan**: [Menu] (~[Calorie] kcal)\n"+
			"* **Camilan**: [Menu] (~[Calorie] kcal)\n"+
			"* **Siang**: [Menu] (~[Calorie] kcal)\n"+
			"* **Malam**: [Menu] (~[Calorie] kcal)\n"+
			"Penting 4: Berikan menu yang sangat BERAGAM dan UNIK hari ini! (Seed Keacakan: %d) "+
			"Sisanya, tulis pesan singkat dengan Markdown yang rapi dan memotivasi di bagian bawah. Jawab dalam bahasa Indonesia.",
		profile.Gender, profile.Age, profile.Height, profile.Weight, bmi, bmiCategory, profile.DailyCalorieTarget,
		profile.DietaryPreferences, profile.MedicalHistory, workoutText,
		time.Now().UnixNano(),
	)

	// Call local Ollama
	res, err := askOllama(prompt, "", false)
	if err == nil && res != "" {
		return res, nil
	}

	fmt.Println("Ollama API Error (Recommendation):", err)

	// Fallback Engine if Ollama is off or not installed
	return "⚠️ Gagal terhubung ke Ollama lokal. Pastikan aplikasi Ollama berjalan dan model 'minicpm-v' sudah terunduh.\n\n" + s.getMockRecommendation(profile, bmi, bmiCategory), nil
}

// AnalyzeFoodImage processes a food image using local Ollama Vision (minicpm-v).
func (s *aiService) AnalyzeFoodImage(imageBase64 string) (*FoodNutritionResult, error) {
	prompt := `Analisis gambar ini. Pertama, pastikan apakah gambar ini adalah makanan atau minuman. Jika BUKAN makanan/minuman (misalnya wajah orang, hewan, benda mati, pemandangan, dll), kembalikan JSON dengan key "is_food": false, dan tuliskan "food_name" sebagai alasan penolakan (misal: "Ini adalah gambar sepatu"). Jika INI ADALAH makanan/minuman, kembalikan JSON dengan keys: "is_food": true, "food_name" (string nama makanan utamanya), "calories" (int estimasi total), "protein" (float), "carbs" (float), "fat" (float). Jangan berikan teks lain selain JSON.`
	
	resText, err := askOllama(prompt, imageBase64, true)
	if err != nil {
		fmt.Println("Ollama API Error (Image):", err)
		return nil, fmt.Errorf("AI Error: Gagal terhubung ke Ollama lokal. Pastikan aplikasi Ollama sedang berjalan (127.0.0.1:11434).")
	}

	var result FoodNutritionResult
	if err := json.Unmarshal([]byte(extractJSON(resText)), &result); err != nil {
		fmt.Println("Ollama JSON Parse Error:", err, "Response was:", resText)
		return nil, fmt.Errorf("AI Error: Respon dari Ollama tidak dapat dibaca.")
	}

	if !result.IsFood {
		return nil, fmt.Errorf("GAMBAR_BUKAN_MAKANAN:%s", result.FoodName)
	}

	result.FoodName = result.FoodName + " ✨(Ollama)"
	return &result, nil
}

// AnalyzeFoodText estimates nutrition based on food name using local Ollama.
func (s *aiService) AnalyzeFoodText(foodName string) (*FoodNutritionResult, error) {
	prompt := fmt.Sprintf(`Berikan estimasi kalori, protein (g), karbohidrat (g), dan lemak (g) untuk takaran/porsi dari makanan ini: "%s". Berikan respons HANYA dalam format JSON dengan keys: "is_food": true, "food_name" (string nama makanan diperbaiki), "calories" (int), "protein" (float), "carbs" (float), "fat" (float). Jangan berikan teks lain selain JSON.`, foodName)
	
	resText, err := askOllama(prompt, "", true)
	if err != nil {
		fmt.Println("Ollama API Error (Text):", err)
		return s.getMockTextNutrition(foodName), nil // Fallback gently for text
	}

	var result FoodNutritionResult
	if err := json.Unmarshal([]byte(extractJSON(resText)), &result); err != nil {
		fmt.Println("Ollama JSON Parse Error:", err, "Response was:", resText)
		return s.getMockTextNutrition(foodName), nil
	}

	result.FoodName = result.FoodName + " ✨(Ollama)"
	return &result, nil
}

// CalculateWorkoutCalories estimates calories burned based on workout and user profile.
func (s *aiService) CalculateWorkoutCalories(workout *models.WorkoutLog, profile *models.MemberProfile) (int, error) {
	var workoutDetails string

	if workout.WorkoutType == "cardio" {
		dur := 0
		if workout.DurationMinutes != nil {
			dur = *workout.DurationMinutes
		}
		workoutDetails = fmt.Sprintf("Cardio: %s, Durasi: %d menit", workout.WorkoutName, dur)
	} else {
		sets, reps, weight := 0, 0, 0.0
		if workout.Sets != nil {
			sets = *workout.Sets
		}
		if workout.Reps != nil {
			reps = *workout.Reps
		}
		if workout.WeightKg != nil {
			weight = *workout.WeightKg
		}
		workoutDetails = fmt.Sprintf("Angkat Beban: %s, %d Set x %d Reps, Beban: %.2f kg", workout.WorkoutName, sets, reps, weight)
	}

	prompt := fmt.Sprintf(`Berikan estimasi kalori yang terbakar untuk sesi latihan berikut.
Profil Pengguna: Tinggi %v cm, Berat Badan %v kg, Umur %d tahun, Gender %s.
Detail Latihan: %s.
PENTING: Berikan respons HANYA dalam format JSON dengan key "calories_burned" (integer). Jangan berikan teks lain.`,
		profile.Height, profile.Weight, profile.Age, profile.Gender, workoutDetails)

	resText, err := askOllama(prompt, "", true)
	if err != nil {
		fmt.Println("Ollama API Error (WorkoutCalories):", err)
		// Fallback estimation
		return s.getMockWorkoutCalories(workout), nil
	}

	var result struct {
		CaloriesBurned int `json:"calories_burned"`
	}
	if err := json.Unmarshal([]byte(extractJSON(resText)), &result); err != nil {
		fmt.Println("Ollama JSON Parse Error (WorkoutCalories):", err, "Response was:", resText)
		return s.getMockWorkoutCalories(workout), nil
	}

	return result.CaloriesBurned, nil
}

// askOllama is a helper to call local Ollama REST API.
func askOllama(prompt, imageBase64 string, requireJSON bool) (string, error) {
	url := "http://127.0.0.1:11434/api/generate"

	reqBody := map[string]interface{}{
		"model":  "minicpm-v",
		"prompt": prompt,
		"stream": false,
	}

	if requireJSON {
		reqBody["format"] = "json"
	}

	if imageBase64 != "" {
		// Strip the "data:image/jpeg;base64," prefix if it exists
		b64Data := imageBase64
		if idx := strings.Index(b64Data, ","); idx >= 0 {
			b64Data = b64Data[idx+1:]
		}
		reqBody["images"] = []string{b64Data}
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	client := &http.Client{
		Timeout: 60 * time.Second, // Local LLM can take time to answer
	}

	resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Ollama returned status code %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var ollamaResp struct {
		Response string `json:"response"`
	}

	if err := json.Unmarshal(bodyBytes, &ollamaResp); err != nil {
		return "", err
	}

	return ollamaResp.Response, nil
}


// --- FALLBACK METHODS ---

func (s *aiService) getMockRecommendation(profile *models.MemberProfile, bmi float64, bmiCategory string) string {
	switch bmiCategory {
	case "Underweight (Kurus)":
		return fmt.Sprintf(`### 🥗 Recommendation (Bulking / Weight Gain)
Berdasarkan profil Anda (BMI: %.2f - %s), target kalori harian Anda adalah **%d kcal**.
Berikut adalah rekomendasi menu diet tinggi protein dan surplus kalori seimbang:

* **Sarapan (07:00)**: 3 Telur rebus/orak-arik, 2 lembar roti gandum panggang dengan selai kacang (~550 kcal).
* **Camilan Pagi (10:00)**: Greek yogurt dengan kacang almond dan madu (~250 kcal).
* **Makan Siang (13:00)**: 200g Dada ayam panggang/nasi merah (1.5 cup), tumis brokoli (~700 kcal).
* **Camilan Sore (16:00)**: Susu protein shake / Whey Protein dengan oatmeal (~300 kcal).
* **Makan Malam (19:00)**: 150g Ikan Salmon panggang atau Daging Sapi sirloin, kentang tumbuk (~600 kcal).`, bmi, bmiCategory, profile.DailyCalorieTarget)

	case "Normal Weight (Ideal)":
		return fmt.Sprintf(`### 🥗 Recommendation (Maintenance & Fit)
Berdasarkan profil Anda (BMI: %.2f - %s), target kalori harian Anda adalah **%d kcal**.
Berikut adalah rekomendasi menu diet seimbang untuk menjaga performa dan kebugaran:

* **Sarapan (07:00)**: Oatmeal dengan potongan buah stroberi/pisang, ditambah 2 putih telur (~400 kcal).
* **Camilan Pagi (10:00)**: 1 buah apel merah atau segenggam buah berry (~100 kcal).
* **Makan Siang (13:00)**: 150g Dada ayam bakar, nasi cokelat/merah (1 cup), dan tumis buncis (~550 kcal).
* **Camilan Sore (16:00)**: Segenggam kacang almond atau edamame rebus (~150 kcal).
* **Makan Malam (19:00)**: 150g Ikan tuna panggang, tahu tempe bakar, dan sayur sop bayam (~450 kcal).`, bmi, bmiCategory, profile.DailyCalorieTarget)

	default: // Overweight or Obese
		return fmt.Sprintf(`### 🥗 Recommendation (Defisit Kalori / Weight Loss)
Berdasarkan profil Anda (BMI: %.2f - %s), target kalori harian Anda adalah **%d kcal** (Disarankan melakukan defisit kalori sehat).
Berikut adalah rekomendasi menu diet rendah kalori, tinggi serat, dan kaya protein:

* **Sarapan (07:00)**: 2 putih telur rebus, salad sayur hijau dengan perasan lemon (~250 kcal).
* **Camilan Pagi (10:00)**: 1 buah pir atau apel hijau (~80 kcal).
* **Makan Siang (13:00)**: 150g Dada ayam rebus/kukus (tanpa kulit), nasi merah setengah cup (~400 kcal).
* **Camilan Sore (16:00)**: 1 gelas susu kedelai low-fat tanpa pemanis (~100 kcal).
* **Makan Malam (19:00)**: Pepes ikan kembung/tuna kukus, tahu bakar, dan sup brokoli bening (~350 kcal).`, bmi, bmiCategory, profile.DailyCalorieTarget)
	}
}

func (s *aiService) getMockTextNutrition(foodName string) *FoodNutritionResult {
	nameLower := strings.ToLower(foodName)
	result := &FoodNutritionResult{
		IsFood:   true,
		FoodName: foodName + " (Estimasi Offline)",
		Calories: 0,
		Protein:  0.0,
		Carbs:    0.0,
		Fat:      0.0,
	}

	keywords := map[string]struct {
		cal int; p float64; c float64; f float64
	}{
		"nasi": {204, 4.2, 44.0, 0.4}, "ayam": {165, 31.0, 0.0, 3.6}, "goreng": {120, 0.0, 5.0, 10.0},
		"telur": {74, 6.3, 0.4, 5.0}, "sapi": {250, 26.0, 0.0, 15.0}, "mie": {220, 4.0, 43.0, 3.0},
		"sayur": {50, 2.0, 10.0, 0.5}, "ikan": {105, 22.0, 0.0, 2.0}, "roti": {150, 5.0, 28.0, 2.0},
	}

	found := false
	for key, val := range keywords {
		if strings.Contains(nameLower, key) {
			found = true
			result.Calories += val.cal
			result.Protein += val.p
			result.Carbs += val.c
			result.Fat += val.f
		}
	}

	if !found {
		result.Calories, result.Protein, result.Carbs, result.Fat = 300, 15.0, 40.0, 10.0
	}
	return result
}

func (s *aiService) getMockWorkoutCalories(workout *models.WorkoutLog) int {
	if workout.WorkoutType == "cardio" {
		dur := 30
		if workout.DurationMinutes != nil {
			dur = *workout.DurationMinutes
		}
		// Rough estimate: 8 calories per minute for cardio
		return dur * 8
	} else {
		sets, reps := 3, 10
		if workout.Sets != nil {
			sets = *workout.Sets
		}
		if workout.Reps != nil {
			reps = *workout.Reps
		}
		// Rough estimate: 2 calories per rep
		return sets * reps * 2
	}
}

// extractJSON attempts to find and return only the JSON portion from a string containing mixed text
func extractJSON(input string) string {
	start := strings.Index(input, "{")
	end := strings.LastIndex(input, "}")
	if start >= 0 && end >= 0 && end > start {
		return input[start : end+1]
	}
	return input
}
