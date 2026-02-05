FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

ARG REQUIREMENTS_FILE=requirements/local.txt

COPY requirements/ /app/requirements/
RUN pip install --upgrade pip \
    && pip install -r ${REQUIREMENTS_FILE}

COPY . /app/

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
