package main

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	_ "github.com/lib/pq"
)

type Tag struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Item struct {
	ID          string  `json:"id"`
	URL         string  `json:"url"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	ImageURL    *string `json:"imageUrl,omitempty"`
	FaviconURL  *string `json:"faviconUrl,omitempty"`
	SiteName    *string `json:"siteName,omitempty"`
	Author      *string `json:"author,omitempty"`
	PublishedAt *string `json:"publishedAt,omitempty"`
	Type        string  `json:"type"`
	Status      string  `json:"status"`
	IsFavorite  bool    `json:"isFavorite"`
	Tags        []Tag   `json:"tags"`
	Notes       string  `json:"notes"`
	ReadAt      *string `json:"readAt,omitempty"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

type TagWithCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type StatusCounts struct {
	Inbox     int `json:"inbox"`
	Reading   int `json:"reading"`
	Completed int `json:"completed"`
	Favorites int `json:"favorites"`
	Archived  int `json:"archived"`
	All       int `json:"all"`
}

type CreateItemPayload struct {
	URL         string          `json:"url"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	ImageURL    *string         `json:"imageUrl"`
	FaviconURL  *string         `json:"faviconUrl"`
	SiteName    *string         `json:"siteName"`
	Author      *string         `json:"author"`
	PublishedAt *string         `json:"publishedAt"`
	Type        string          `json:"type"`
	Status      string          `json:"status"`
	IsFavorite  bool            `json:"isFavorite"`
	Tags        json.RawMessage `json:"tags"`
	Notes       string          `json:"notes"`
}

type UpdateItemPayload struct {
	Title       *string         `json:"title"`
	Description *string         `json:"description"`
	Status      *string         `json:"status"`
	IsFavorite  *bool           `json:"isFavorite"`
	Type        *string         `json:"type"`
	Notes       *string         `json:"notes"`
	ReadAt      *string         `json:"readAt"`
	Tags        json.RawMessage `json:"tags"`
}

var db *sql.DB

func generateID() string {
	bytes := make([]byte, 8)
	_, _ = rand.Read(bytes)
	return fmt.Sprintf("item-%d-%s", time.Now().UnixMilli(), hex.EncodeToString(bytes))
}

func initDB() error {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		user := os.Getenv("POSTGRES_USER")
		if user == "" {
			user = "readlater"
		}
		pass := os.Getenv("POSTGRES_PASSWORD")
		if pass == "" {
			pass = "readlater_secret"
		}
		host := os.Getenv("POSTGRES_HOST")
		if host == "" {
			host = "postgres"
		}
		port := os.Getenv("POSTGRES_PORT")
		if port == "" {
			port = "5432"
		}
		dbname := os.Getenv("POSTGRES_DB")
		if dbname == "" {
			dbname = "readlater"
		}
		connStr = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, pass, host, port, dbname)
	}

	pool, err := sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to open PostgreSQL connection: %w", err)
	}
	pool.SetMaxOpenConns(10)
	pool.SetMaxIdleConns(5)
	pool.SetConnMaxLifetime(30 * time.Minute)

	// Retry loop for Docker Compose cold start. The pool is opened once and
	// only pinged repeatedly, so we do not leak connections on every attempt.
	var pingErr error
	for attempts := 1; attempts <= 30; attempts++ {
		pingErr = pool.Ping()
		if pingErr == nil {
			log.Printf("Successfully connected to PostgreSQL after %d attempt(s)", attempts)
			break
		}
		log.Printf("Waiting for PostgreSQL connection (attempt %d/30): %v", attempts, pingErr)
		if attempts < 30 {
			time.Sleep(2 * time.Second)
		}
	}
	if pingErr != nil {
		_ = pool.Close()
		return fmt.Errorf("failed to connect to PostgreSQL: %w", pingErr)
	}
	db = pool

	schema := `
	CREATE TABLE IF NOT EXISTS items (
		id VARCHAR(64) PRIMARY KEY,
		url TEXT NOT NULL,
		title TEXT NOT NULL,
		description TEXT NOT NULL DEFAULT '',
		image_url TEXT,
		favicon_url TEXT,
		site_name TEXT,
		author TEXT,
		published_at TEXT,
		type VARCHAR(32) NOT NULL DEFAULT 'article',
		status VARCHAR(32) NOT NULL DEFAULT 'inbox',
		is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
		tags JSONB NOT NULL DEFAULT '[]'::jsonb,
		notes TEXT NOT NULL DEFAULT '',
		read_at TIMESTAMPTZ,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
	CREATE INDEX IF NOT EXISTS idx_items_url ON items(url);
	CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_items_favorite ON items(is_favorite);
	`

	_, err = db.Exec(schema)
	if err != nil {
		return fmt.Errorf("failed to apply migrations: %w", err)
	}

	return seedInitialItem()
}

// seedInitialItem inserts a welcome item when the library is empty.
func seedInitialItem() error {
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM items").Scan(&count); err != nil {
		return fmt.Errorf("failed to count items: %w", err)
	}
	if count > 0 {
		return nil
	}

	starterTags, err := json.Marshal([]Tag{
		{ID: "tag-go", Name: "go"},
		{ID: "tag-programming", Name: "programming"},
	})
	if err != nil {
		return fmt.Errorf("failed to encode seed tags: %w", err)
	}
	now := time.Now().UTC()
	if _, err := db.Exec(`
			INSERT INTO items (id, url, title, description, site_name, type, status, is_favorite, tags, notes, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`, "seed-effective-go", "https://go.dev/doc/effective_go", "Effective Go",
		"Советы по написанию чистого, идиоматичного кода на языке Go: форматирование, соглашения об именовании и параллелизм.",
		"Go.dev", "documentation", "inbox", false, starterTags, "Перечитать раздел про goroutines и каналы.", now, now); err != nil {
		return fmt.Errorf("failed to seed initial item: %w", err)
	}
	log.Println("Seeded initial welcome item")

	return nil
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func jsonResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(data)
}

func errorResponse(w http.ResponseWriter, statusCode int, message string) {
	jsonResponse(w, statusCode, map[string]string{"error": message})
}

// appPassword is the single shared password from APP_PASSWORD. Empty means the
// optional protection is disabled (default, fully backward compatible).
var appPassword = ""

// validAuthToken reports whether the request carries the correct password.
func validAuthToken(r *http.Request) bool {
	if appPassword == "" {
		return true
	}
	const prefix = "Bearer "
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, prefix) {
		return false
	}
	token := strings.TrimPrefix(header, prefix)
	return subtle.ConstantTimeCompare([]byte(token), []byte(appPassword)) == 1
}

// authMiddleware gates the API behind APP_PASSWORD when it is set. Health
// checks and the auth-status probe stay public.
func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/health", "/api/health", "/api/auth/status":
			next.ServeHTTP(w, r)
			return
		}
		if !validAuthToken(r) {
			errorResponse(w, http.StatusUnauthorized, "Unauthorized")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// handleAuthStatus tells the SPA whether a password is required and whether the
// supplied token is accepted.
func handleAuthStatus(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, http.StatusOK, map[string]bool{
		"required":      appPassword != "",
		"authenticated": validAuthToken(r),
	})
}

func parseTags(raw json.RawMessage) []Tag {
	if len(raw) == 0 {
		return []Tag{}
	}
	// Try parsing []Tag
	var tags []Tag
	if err := json.Unmarshal(raw, &tags); err == nil {
		result := make([]Tag, 0, len(tags))
		for _, t := range tags {
			name := strings.ToLower(strings.TrimPrefix(strings.TrimSpace(t.Name), "#"))
			if name == "" {
				continue
			}
			id := t.ID
			if id == "" {
				id = "tag-" + name
			}
			result = append(result, Tag{ID: id, Name: name})
		}
		return result
	}

	// Try parsing []string
	var strTags []string
	if err := json.Unmarshal(raw, &strTags); err == nil {
		result := make([]Tag, 0, len(strTags))
		for _, s := range strTags {
			clean := strings.ToLower(strings.TrimPrefix(strings.TrimSpace(s), "#"))
			if clean != "" {
				result = append(result, Tag{ID: "tag-" + clean, Name: clean})
			}
		}
		return result
	}

	return []Tag{}
}

func normalizeURL(rawURL string) string {
	parsed, err := url.Parse(strings.TrimSpace(rawURL))
	if err != nil {
		return strings.TrimSpace(rawURL)
	}

	// Remove tracking query params (mirrors the frontend list in src/lib/url.ts)
	tracking := map[string]bool{
		"utm_source": true, "utm_medium": true, "utm_campaign": true,
		"utm_term": true, "utm_content": true, "utm_id": true,
		"fbclid": true, "gclid": true, "yclid": true,
		"ref": true, "ref_src": true, "ref_url": true, "source": true,
		"mc_cid": true, "mc_eid": true, "_hsenc": true, "_hsmi": true, "si": true,
	}

	query := parsed.Query()
	for param := range tracking {
		query.Del(param)
	}
	parsed.RawQuery = query.Encode()
	parsed.Host = strings.ToLower(parsed.Host)
	parsed.Fragment = ""
	if len(parsed.Path) > 1 && strings.HasSuffix(parsed.Path, "/") {
		parsed.Path = strings.TrimSuffix(parsed.Path, "/")
	}

	return parsed.String()
}

// isValidWebURL reports whether rawURL uses a safe http(s) scheme.
func isValidWebURL(rawURL string) bool {
	parsed, err := url.Parse(strings.TrimSpace(rawURL))
	if err != nil {
		return false
	}
	return parsed.Scheme == "http" || parsed.Scheme == "https"
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	if db == nil {
		jsonResponse(w, http.StatusServiceUnavailable, map[string]string{
			"status": "error",
			"db":     "uninitialized",
		})
		return
	}
	if err := db.Ping(); err != nil {
		jsonResponse(w, http.StatusServiceUnavailable, map[string]string{
			"status": "error",
			"db":     err.Error(),
		})
		return
	}
	jsonResponse(w, http.StatusOK, map[string]string{
		"status": "ok",
		"db":     "connected",
	})
}

func handleGetItems(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	status := q.Get("status")
	isFavoriteStr := q.Get("isFavorite")
	itemType := q.Get("type")
	tag := q.Get("tag")
	search := strings.TrimSpace(q.Get("search"))
	sortOrder := q.Get("sort")

	query := `SELECT id, url, title, description, image_url, favicon_url, site_name, author,
	                 published_at, type, status, is_favorite, tags, notes, read_at, created_at, updated_at
	          FROM items WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	if isFavoriteStr != "" {
		isFav := isFavoriteStr == "true" || isFavoriteStr == "1"
		query += fmt.Sprintf(" AND is_favorite = $%d", argIdx)
		args = append(args, isFav)
		argIdx++
	}

	if itemType != "" && itemType != "all" {
		query += fmt.Sprintf(" AND type = $%d", argIdx)
		args = append(args, itemType)
		argIdx++
	}

	if tag != "" {
		cleanTag := strings.ToLower(strings.TrimPrefix(tag, "#"))
		query += fmt.Sprintf(" AND tags @> $%d::jsonb", argIdx)
		filterJSON, _ := json.Marshal([]map[string]string{{"name": cleanTag}})
		args = append(args, filterJSON)
		argIdx++
	}

	if search != "" {
		pattern := "%" + strings.ToLower(search) + "%"
		query += fmt.Sprintf(" AND (LOWER(title) LIKE $%d OR LOWER(description) LIKE $%d OR LOWER(url) LIKE $%d OR LOWER(site_name) LIKE $%d OR LOWER(notes) LIKE $%d)",
			argIdx, argIdx, argIdx, argIdx, argIdx)
		args = append(args, pattern)
		argIdx++
	}

	switch sortOrder {
	case "oldest":
		query += " ORDER BY created_at ASC"
	case "recently_updated":
		query += " ORDER BY updated_at DESC"
	case "recently_read":
		query += " ORDER BY read_at DESC NULLS LAST, created_at DESC"
	default: // "newest"
		query += " ORDER BY created_at DESC"
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		log.Printf("Query error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "Failed to query items")
		return
	}
	defer rows.Close()

	items := []Item{}
	for rows.Next() {
		var item Item
		var tagsJSON []byte
		var readAt sql.NullTime
		var createdAt, updatedAt time.Time

		err := rows.Scan(
			&item.ID, &item.URL, &item.Title, &item.Description, &item.ImageURL, &item.FaviconURL,
			&item.SiteName, &item.Author, &item.PublishedAt, &item.Type, &item.Status,
			&item.IsFavorite, &tagsJSON, &item.Notes, &readAt, &createdAt, &updatedAt,
		)
		if err != nil {
			log.Printf("Scan error: %v", err)
			continue
		}

		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		if readAt.Valid {
			rAt := readAt.Time.UTC().Format(time.RFC3339)
			item.ReadAt = &rAt
		}

		item.Tags = []Tag{}
		if len(tagsJSON) > 0 {
			_ = json.Unmarshal(tagsJSON, &item.Tags)
		}

		items = append(items, item)
	}

	jsonResponse(w, http.StatusOK, items)
}

func handleGetItem(w http.ResponseWriter, r *http.Request, id string) {
	query := `SELECT id, url, title, description, image_url, favicon_url, site_name, author,
	                 published_at, type, status, is_favorite, tags, notes, read_at, created_at, updated_at
	          FROM items WHERE id = $1`

	var item Item
	var tagsJSON []byte
	var readAt sql.NullTime
	var createdAt, updatedAt time.Time

	err := db.QueryRow(query, id).Scan(
		&item.ID, &item.URL, &item.Title, &item.Description, &item.ImageURL, &item.FaviconURL,
		&item.SiteName, &item.Author, &item.PublishedAt, &item.Type, &item.Status,
		&item.IsFavorite, &tagsJSON, &item.Notes, &readAt, &createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		errorResponse(w, http.StatusNotFound, "Item not found")
		return
	} else if err != nil {
		errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	if readAt.Valid {
		rAt := readAt.Time.UTC().Format(time.RFC3339)
		item.ReadAt = &rAt
	}
	item.Tags = []Tag{}
	if len(tagsJSON) > 0 {
		_ = json.Unmarshal(tagsJSON, &item.Tags)
	}

	jsonResponse(w, http.StatusOK, item)
}

func handleCreateItem(w http.ResponseWriter, r *http.Request) {
	var payload CreateItemPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		errorResponse(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if strings.TrimSpace(payload.URL) == "" {
		errorResponse(w, http.StatusBadRequest, "URL is required")
		return
	}
	if !isValidWebURL(payload.URL) {
		errorResponse(w, http.StatusBadRequest, "Only http:// and https:// URLs are allowed")
		return
	}

	normURL := normalizeURL(payload.URL)
	title := strings.TrimSpace(payload.Title)
	if title == "" {
		if payload.SiteName != nil && *payload.SiteName != "" {
			title = *payload.SiteName
		} else {
			title = "Без названия"
		}
	}

	itemType := payload.Type
	if itemType == "" {
		itemType = "article"
	}
	status := payload.Status
	if status == "" {
		status = "inbox"
	}

	tags := parseTags(payload.Tags)
	tagsJSON, _ := json.Marshal(tags)

	now := time.Now().UTC()
	newItem := Item{
		ID:          generateID(),
		URL:         normURL,
		Title:       title,
		Description: strings.TrimSpace(payload.Description),
		ImageURL:    payload.ImageURL,
		FaviconURL:  payload.FaviconURL,
		SiteName:    payload.SiteName,
		Author:      payload.Author,
		PublishedAt: payload.PublishedAt,
		Type:        itemType,
		Status:      status,
		IsFavorite:  payload.IsFavorite,
		Tags:        tags,
		Notes:       strings.TrimSpace(payload.Notes),
		CreatedAt:   now.Format(time.RFC3339),
		UpdatedAt:   now.Format(time.RFC3339),
	}

	insertSQL := `
		INSERT INTO items (id, url, title, description, image_url, favicon_url, site_name, author,
		                   published_at, type, status, is_favorite, tags, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	`
	_, err := db.Exec(insertSQL,
		newItem.ID, newItem.URL, newItem.Title, newItem.Description, newItem.ImageURL, newItem.FaviconURL,
		newItem.SiteName, newItem.Author, newItem.PublishedAt, newItem.Type, newItem.Status,
		newItem.IsFavorite, tagsJSON, newItem.Notes, now, now,
	)
	if err != nil {
		log.Printf("Insert error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "Failed to save item")
		return
	}

	jsonResponse(w, http.StatusCreated, newItem)
}

func handleUpdateItem(w http.ResponseWriter, r *http.Request, id string) {
	var payload UpdateItemPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		errorResponse(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Fetch existing
	var existing Item
	var tagsJSON []byte
	var readAt sql.NullTime
	var createdAt, updatedAt time.Time

	err := db.QueryRow(`SELECT id, url, title, description, image_url, favicon_url, site_name, author,
	                            published_at, type, status, is_favorite, tags, notes, read_at, created_at, updated_at
	                     FROM items WHERE id = $1`, id).Scan(
		&existing.ID, &existing.URL, &existing.Title, &existing.Description, &existing.ImageURL, &existing.FaviconURL,
		&existing.SiteName, &existing.Author, &existing.PublishedAt, &existing.Type, &existing.Status,
		&existing.IsFavorite, &tagsJSON, &existing.Notes, &readAt, &createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		errorResponse(w, http.StatusNotFound, "Item not found")
		return
	} else if err != nil {
		log.Printf("Fetch for update failed: %v", err)
		errorResponse(w, http.StatusInternalServerError, "Failed to load item")
		return
	}

	now := time.Now().UTC()
	if payload.Title != nil {
		existing.Title = strings.TrimSpace(*payload.Title)
	}
	if payload.Description != nil {
		existing.Description = strings.TrimSpace(*payload.Description)
	}
	if payload.Type != nil {
		existing.Type = *payload.Type
	}
	if payload.IsFavorite != nil {
		existing.IsFavorite = *payload.IsFavorite
	}
	if payload.Notes != nil {
		existing.Notes = strings.TrimSpace(*payload.Notes)
	}
	if payload.Status != nil {
		existing.Status = *payload.Status
		if *payload.Status == "completed" && !readAt.Valid {
			readAt.Valid = true
			readAt.Time = now
		} else if *payload.Status != "completed" {
			readAt.Valid = false
		}
	}
	if payload.ReadAt != nil {
		if *payload.ReadAt == "" {
			readAt.Valid = false
		} else if t, err := time.Parse(time.RFC3339, *payload.ReadAt); err == nil {
			readAt.Valid = true
			readAt.Time = t
		}
	}
	if len(payload.Tags) > 0 {
		existing.Tags = parseTags(payload.Tags)
		tagsJSON, _ = json.Marshal(existing.Tags)
	} else if len(tagsJSON) > 0 {
		_ = json.Unmarshal(tagsJSON, &existing.Tags)
	}

	updateSQL := `
		UPDATE items SET title = $1, description = $2, type = $3, status = $4, is_favorite = $5,
		                 tags = $6, notes = $7, read_at = $8, updated_at = $9
		WHERE id = $10
	`
	_, err = db.Exec(updateSQL,
		existing.Title, existing.Description, existing.Type, existing.Status, existing.IsFavorite,
		tagsJSON, existing.Notes, readAt, now, id,
	)
	if err != nil {
		log.Printf("Update error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "Failed to update item")
		return
	}

	existing.UpdatedAt = now.Format(time.RFC3339)
	existing.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	if readAt.Valid {
		rAt := readAt.Time.UTC().Format(time.RFC3339)
		existing.ReadAt = &rAt
	}

	jsonResponse(w, http.StatusOK, existing)
}

func handleDeleteItem(w http.ResponseWriter, r *http.Request, id string) {
	// First fetch item to return it for undo
	var item Item
	var tagsJSON []byte
	var readAt sql.NullTime
	var createdAt, updatedAt time.Time

	err := db.QueryRow(`SELECT id, url, title, description, image_url, favicon_url, site_name, author,
	                            published_at, type, status, is_favorite, tags, notes, read_at, created_at, updated_at
	                     FROM items WHERE id = $1`, id).Scan(
		&item.ID, &item.URL, &item.Title, &item.Description, &item.ImageURL, &item.FaviconURL,
		&item.SiteName, &item.Author, &item.PublishedAt, &item.Type, &item.Status,
		&item.IsFavorite, &tagsJSON, &item.Notes, &readAt, &createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		errorResponse(w, http.StatusNotFound, "Item not found")
		return
	} else if err != nil {
		log.Printf("Fetch for delete failed: %v", err)
		errorResponse(w, http.StatusInternalServerError, "Failed to load item")
		return
	}

	_, err = db.Exec("DELETE FROM items WHERE id = $1", id)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "Failed to delete item")
		return
	}

	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	if readAt.Valid {
		rAt := readAt.Time.UTC().Format(time.RFC3339)
		item.ReadAt = &rAt
	}
	item.Tags = []Tag{}
	if len(tagsJSON) > 0 {
		_ = json.Unmarshal(tagsJSON, &item.Tags)
	}

	jsonResponse(w, http.StatusOK, item)
}

func handleRestoreItem(w http.ResponseWriter, r *http.Request) {
	var item Item
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		errorResponse(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if item.Tags == nil {
		item.Tags = []Tag{}
	}
	tagsJSON, _ := json.Marshal(item.Tags)
	now := time.Now().UTC()

	var readAt sql.NullTime
	if item.ReadAt != nil && *item.ReadAt != "" {
		if t, err := time.Parse(time.RFC3339, *item.ReadAt); err == nil {
			readAt.Valid = true
			readAt.Time = t
		}
	}

	insertSQL := `
		INSERT INTO items (id, url, title, description, image_url, favicon_url, site_name, author,
		                   published_at, type, status, is_favorite, tags, notes, read_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		ON CONFLICT (id) DO NOTHING
	`
	_, err := db.Exec(insertSQL,
		item.ID, item.URL, item.Title, item.Description, item.ImageURL, item.FaviconURL,
		item.SiteName, item.Author, item.PublishedAt, item.Type, item.Status, item.IsFavorite,
		tagsJSON, item.Notes, readAt, now, now,
	)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "Failed to restore item")
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"status": "restored"})
}

func handleFindByURL(w http.ResponseWriter, r *http.Request) {
	rawURL := r.URL.Query().Get("url")
	if rawURL == "" {
		errorResponse(w, http.StatusBadRequest, "URL parameter required")
		return
	}

	norm := normalizeURL(rawURL)
	query := `SELECT id, url, title, description, image_url, favicon_url, site_name, author,
	                 published_at, type, status, is_favorite, tags, notes, read_at, created_at, updated_at
	          FROM items WHERE url = $1 OR url = $2 LIMIT 1`

	var item Item
	var tagsJSON []byte
	var readAt sql.NullTime
	var createdAt, updatedAt time.Time

	err := db.QueryRow(query, strings.TrimSpace(rawURL), norm).Scan(
		&item.ID, &item.URL, &item.Title, &item.Description, &item.ImageURL, &item.FaviconURL,
		&item.SiteName, &item.Author, &item.PublishedAt, &item.Type, &item.Status,
		&item.IsFavorite, &tagsJSON, &item.Notes, &readAt, &createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		jsonResponse(w, http.StatusOK, nil)
		return
	} else if err != nil {
		errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	if readAt.Valid {
		rAt := readAt.Time.UTC().Format(time.RFC3339)
		item.ReadAt = &rAt
	}
	item.Tags = []Tag{}
	if len(tagsJSON) > 0 {
		_ = json.Unmarshal(tagsJSON, &item.Tags)
	}

	jsonResponse(w, http.StatusOK, item)
}

func handleGetTags(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`
		SELECT jsonb_array_elements(tags)->>'name' as tag_name, COUNT(*) as tag_count
		FROM items
		WHERE status != 'archived'
		GROUP BY tag_name
		ORDER BY tag_count DESC, tag_name ASC
	`)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "Failed to get tags")
		return
	}
	defer rows.Close()

	tags := []TagWithCount{}
	for rows.Next() {
		var t TagWithCount
		if err := rows.Scan(&t.Name, &t.Count); err == nil && t.Name != "" {
			tags = append(tags, t)
		}
	}

	jsonResponse(w, http.StatusOK, tags)
}

func handleGetCounts(w http.ResponseWriter, r *http.Request) {
	counts := StatusCounts{}

	_ = db.QueryRow("SELECT COUNT(*) FROM items WHERE status = 'inbox'").Scan(&counts.Inbox)
	_ = db.QueryRow("SELECT COUNT(*) FROM items WHERE status = 'reading'").Scan(&counts.Reading)
	_ = db.QueryRow("SELECT COUNT(*) FROM items WHERE status = 'completed'").Scan(&counts.Completed)
	_ = db.QueryRow("SELECT COUNT(*) FROM items WHERE is_favorite = true").Scan(&counts.Favorites)
	_ = db.QueryRow("SELECT COUNT(*) FROM items WHERE status = 'archived'").Scan(&counts.Archived)
	_ = db.QueryRow("SELECT COUNT(*) FROM items").Scan(&counts.All)

	jsonResponse(w, http.StatusOK, counts)
}

// handleResetItems wipes the library and re-inserts the starter item.
func handleResetItems(w http.ResponseWriter, r *http.Request) {
	if _, err := db.Exec("DELETE FROM items"); err != nil {
		log.Printf("Reset error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "Failed to reset library")
		return
	}
	if err := seedInitialItem(); err != nil {
		log.Printf("Reset seed error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "Failed to reset library")
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"status": "reset"})
}

func main() {
	if err := initDB(); err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer db.Close()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	appPassword = os.Getenv("APP_PASSWORD")
	if appPassword != "" {
		log.Println("Password protection enabled (APP_PASSWORD is set)")
	} else {
		log.Println("Password protection disabled (APP_PASSWORD is empty)")
	}

	mux := http.NewServeMux()

	// Health check (top-level and /api prefix)
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/health", handleHealth)

	// Auth status probe (public, used by the login screen)
	mux.HandleFunc("/api/auth/status", handleAuthStatus)

	// API Routes
	mux.HandleFunc("/api/items/by-url", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handleFindByURL(w, r)
		} else {
			errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	})

	mux.HandleFunc("/api/items/restore", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handleRestoreItem(w, r)
		} else {
			errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	})

	mux.HandleFunc("/api/items/reset", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handleResetItems(w, r)
		} else {
			errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	})

	mux.HandleFunc("/api/items", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handleGetItems(w, r)
		case http.MethodPost:
			handleCreateItem(w, r)
		default:
			errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	})

	mux.HandleFunc("/api/items/", func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/api/items/")
		if id == "" || strings.Contains(id, "/") {
			errorResponse(w, http.StatusBadRequest, "Invalid item ID")
			return
		}

		switch r.Method {
		case http.MethodGet:
			handleGetItem(w, r, id)
		case http.MethodPut, http.MethodPatch:
			handleUpdateItem(w, r, id)
		case http.MethodDelete:
			handleDeleteItem(w, r, id)
		default:
			errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	})

	mux.HandleFunc("/api/tags", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handleGetTags(w, r)
		} else {
			errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	})

	mux.HandleFunc("/api/counts", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handleGetCounts(w, r)
		} else {
			errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	})

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      corsMiddleware(authMiddleware(mux)),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("ReadLater Go API server running on port %s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server ListenAndServe failed: %v", err)
		}
	}()

	<-stop
	log.Println("Shutting down API server gracefully...")
	shutdownCtx, cancel := contextWithTimeout(5 * time.Second)
	defer cancel()
	_ = server.Shutdown(shutdownCtx)
	log.Println("Server stopped")
}

func contextWithTimeout(d time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), d)
}
