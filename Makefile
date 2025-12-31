SRC_DIR := ./src
PUBLIC_DIR := ./public
DIST_DIR := ./dist
FILES := $(wildcard $(SRC_DIR)/*.html)

all: build

build: $(DIST_DIR) $(FILES:$(SRC_DIR)/%.html=$(DIST_DIR)/%.html) copy-public

$(DIST_DIR):
	mkdir -p $(DIST_DIR)

$(DIST_DIR)/%.html: $(SRC_DIR)/%.html | $(DIST_DIR)
	cp $< $@
	sed -n 's/<!-- \([^>]*\.html\) -->/\1/p' "$@" | while read -r line; do \
		content=$$(<"${SRC_DIR}/$${line}" sed -e 's/&/\\&/g' -e 's/\//\\\//g' | tr -d '\n'); \
		sed -i "s|<!-- $${line} -->|$${content}|g" "$@"; \
	done
	@go run github.com/tdewolff/minify/v2/cmd/minify@latest -o /tmp/minified.css ./src/style.css; \
	perl -i -pe 'BEGIN{open F,"/tmp/minified.css";$$c=<F>;close F}s|<link rel="stylesheet" type="text/css" href="./style.css" />|<style>$$c</style>|' "$@"
	go run github.com/tdewolff/minify/v2/cmd/minify@latest -o "$@.min" "$@" && mv "$@.min" "$@"

copy-public: $(DIST_DIR)
	cp -r $(PUBLIC_DIR)/* $(DIST_DIR)/

clean:
	rm -rf $(DIST_DIR)

.PHONY: all build copy-public clean
