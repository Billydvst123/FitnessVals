package controllers

import (
	"PPT/koneksi"
	"PPT/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetBukuPertama(ctx *gin.Context) {
	var Buku []models.Buku
	result := koneksi.DB.First(&Buku)
	if result.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
	}
	ctx.JSON(http.StatusOK, gin.H{"data": Buku})
}

func GetBukuSemua(ctx *gin.Context) {
	var Buku []models.Buku
	result := koneksi.DB.Find(&Buku) //Select * from
	if result.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
	}
	ctx.JSON(http.StatusOK, gin.H{"data": Buku})
}
