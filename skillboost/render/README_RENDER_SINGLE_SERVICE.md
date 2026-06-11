# SkillBoost Render single-service deploy

This setup builds the React frontend and Spring Boot backend into one Docker image.

Runtime layout:

- Nginx listens on port `10000`.
- React is served from `/`.
- API calls to `/api/*` are proxied to Spring Boot on `127.0.0.1:8080`.
- MongoDB must be external, for example MongoDB Atlas.
- Keycloak is disabled by default for the first Render deploy.

Render settings:

- Runtime: Docker
- Branch: main
- Root Directory: empty
- Dockerfile Path: `./Dockerfile`
- Docker Build Context Directory: `.`
- Docker Command: empty
- Health Check Path: `/api/health`

Required environment variables:

```env
PORT=10000
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=prod
SPRING_DATA_MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/skillboost?retryWrites=true&w=majority
SKILLBOOST_SECURITY_ENABLED=false
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_FALLBACK_ENABLED=false
GEMINI_MAX_OUTPUT_TOKENS=900
GEMINI_TEMPERATURE=0.25
GEMINI_THINKING_BUDGET=0
GEMINI_THINKING_LEVEL=minimal
JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=75.0 -XX:+UseContainerSupport
```

Local test for the production image:

```bash
docker build -t skillboost-render .
docker run --rm -p 10000:10000 \
  -e SPRING_DATA_MONGODB_URI="mongodb://host.docker.internal:27017/skillboost" \
  -e SKILLBOOST_SECURITY_ENABLED=false \
  -e GEMINI_API_KEY="your-key" \
  skillboost-render
```

Then open:

- http://localhost:10000
- http://localhost:10000/api/health
