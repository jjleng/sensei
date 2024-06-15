FROM python:3.11-slim-bullseye

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

ENV ENV=development
ENV LOGURU_LEVEL=INFO

CMD ["uvicorn", "sensei_search.server:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]