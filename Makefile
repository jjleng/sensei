.PHONY: dev prod requirements.txt

dev:
	docker compose up

prod:
	paka cluster up
	chmod +x ./ops/k8s/deploy.sh
	cd ./ops/k8s && ./deploy.sh

requirements.txt:
	cd ./backend && poetry export --without dev --format requirements.txt --output requirements.txt