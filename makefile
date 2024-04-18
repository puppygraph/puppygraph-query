.PHONY: run tidy html docker

tidy:
	go mod tidy

build/server: tidy
	go build -o $@ cmd/server/*

html:
	cd html && npm install && npm run build

run: build/server html
	build/server

docker:
	docker build -t puppygraph/puppygraph-query:latest -f ./Dockerfile .
