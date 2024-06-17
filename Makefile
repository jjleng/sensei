.PHONY: run-dev provision-prod requirements.txt deploy-backend deploy-frontend

run-dev:
	docker compose up

provision-prod:
	paka cluster up
	chmod +x ./ops/k8s/deploy.sh
	cd ./ops/k8s && ./deploy.sh

requirements.txt:
	cd ./backend && poetry export --without dev --format requirements.txt --output requirements.txt

deploy-backend:
	cd ./backend && \
	paka function deploy --name sensei-backend --source . --entrypoint serve --cluster sensei --scale-down-delay 5m

deploy-frontend:
	cd ./frontend && \
	paka function deploy --name sensei-frontend --source . --entrypoint web --cluster sensei