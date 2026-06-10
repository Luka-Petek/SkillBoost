# syntax=docker/dockerfile:1

# ------------------------------------------------------------
# SkillBoost single-service production image for Render
# Builds React frontend + Spring Boot backend into one container.
# Nginx listens on Render's public port and proxies /api to Spring.
# ------------------------------------------------------------

# ---------- FRONTEND BUILD ----------
FROM node:20-alpine AS frontend-build
WORKDIR /workspace/frontend

COPY frontend/package*.json ./
RUN npm ci --registry=https://registry.npmjs.org --no-audit --fund=false

COPY frontend/ ./
ARG VITE_API_BASE_URL=/api
ARG VITE_AUTH_ENABLED=false
ARG VITE_KEYCLOAK_URL=
ARG VITE_KEYCLOAK_REALM=SkillBoost
ARG VITE_KEYCLOAK_CLIENT_ID=skillboost-frontend
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_AUTH_ENABLED=${VITE_AUTH_ENABLED}
ENV VITE_KEYCLOAK_URL=${VITE_KEYCLOAK_URL}
ENV VITE_KEYCLOAK_REALM=${VITE_KEYCLOAK_REALM}
ENV VITE_KEYCLOAK_CLIENT_ID=${VITE_KEYCLOAK_CLIENT_ID}
RUN npm run build


# ---------- BACKEND BUILD ----------
FROM maven:3.9.9-eclipse-temurin-21 AS backend-build
WORKDIR /workspace/backend

COPY backend/pom.xml ./
RUN mvn -q -DskipTests dependency:go-offline

COPY backend/src ./src
RUN mvn -q -DskipTests package


# ---------- RUNTIME ----------
FROM eclipse-temurin:21-jre-jammy

RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx ca-certificates bash \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default

WORKDIR /app

COPY --from=backend-build /workspace/backend/target/*.jar /app/app.jar
COPY --from=frontend-build /workspace/frontend/dist/ /usr/share/nginx/html/
COPY render/nginx.conf /etc/nginx/conf.d/default.conf
COPY render/start.sh /app/start.sh

RUN chmod +x /app/start.sh

ENV PORT=10000
ENV SERVER_PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
ENV SKILLBOOST_SECURITY_ENABLED=false
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -XX:+UseContainerSupport"

EXPOSE 10000

CMD ["/app/start.sh"]
