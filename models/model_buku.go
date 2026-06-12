package models

import "gorm.io/gorm"

type Buku struct {
	gorm.Model
	ID    uint   `json:"buku_id" gorm:"primary key"`
	Nama  string `json:"buku_nama"`
	Harga uint   `json:"buku_harga"`
	// Pemebeli_ID uint
}

type Pemebeli struct {
	ID     uint   `json:"pembeli_id" gorm:"primary key"`
	Nama   string `json:"pembeli_nama"`
	Email  string `json:"pembeli_email"`
	BukuID uint
}
