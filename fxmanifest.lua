fx_version "cerulean"

lua54 "yes"

games {
	"gta5",
	"rdr3"
}

ui_page "web/dist/index.html"

loadscreen "web/dist/loadingscreen.html"
loadscreen_manual_shutdown "yes"

client_script "interface.lua"

files {
	"web/dist/index.html",
	"web/dist/**/*"
}