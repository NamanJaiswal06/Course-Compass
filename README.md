# Course  - MERN Stack Assessment

This repository contains the complete MERN stack application built for the technical assessment, featuring an Express/MongoDB backend and a Next.js frontend.

##  How to Run the Project

1. **Backend Setup**
   ```bash
   cd Backend
   npm install
   # Ensure Redis and MongoDB are running locally
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

---

##  Design Choices & Assumptions

**Design Choices:**
* **RESTful Architecture:** The frontend and backend are completely decoupled. The Next.js frontend acts purely as a client consuming the Express API, allowing both to be scaled independently.
* **CSV Data Mapping:** Instead of forcing the frontend UI to match a simplified database schema, the backend intelligently maps the complex, verbose CSV headers into clean MongoDB fields during the upload process. This preserves the beautiful public-facing UI while satisfying data storage requirements.
* **Graceful Degradation:** The Redis cache and Gemini AI are wrapped in `try/catch` blocks with fallback mechanisms. If Redis crashes, the backend safely falls back to standard MongoDB queries. If the Gemini API key is missing or fails, it returns formatted mock recommendations.

**Assumptions Made:**
* **Admin Authentication:** Assumed "admin only" meant a straightforward administrative login layer for managing course data, so a standard JWT-based authentication system was implemented using `localStorage` without complex Role-Based Access Control (RBAC).
* **Gemini Recommendations:** Assumed the AI generates dynamic, conceptual course ideas based on user input, rather than picking strictly from the database. Therefore, they are displayed as standalone informative cards rather than clickable links to non-existent pages.

---

##  Part 2: DevOps

### 2a. CI/CD Pipeline Sketch
1. **Code Commit (GitHub):** Developer pushes code to the `main` branch.
2. **Build & Test (GitHub Actions):** 
   * A GitHub Action triggers on push.
   * Runs `npm install` and `npm run lint` for both frontend and backend.
   * Runs any automated unit tests (e.g., using Jest).
3. **Docker Build:** If tests pass, GitHub Actions builds the Docker images for the frontend and backend.
4. **Push to Registry:** The images are pushed to Docker Hub or AWS ECR.
5. **Deploy (AWS/DigitalOcean):** A webhook notifies the production server to pull the latest images and restart the containers using Docker Compose.

### 2b. Dockerization (Dockerfile Example)
*A conceptual `Dockerfile` for the Node.js Backend:*
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### 2c. Linux Hosting Considerations
To deploy this project on a standard Linux server (e.g., Ubuntu on AWS EC2):
* **Process Manager:** I would use **PM2** to run the Node.js backend. PM2 ensures the app automatically restarts if it crashes and handles log rotation.
* **Reverse Proxy:** I would use **Nginx** to route port 80/443 (HTTP/HTTPS) traffic to the internal ports (5000 for backend, 3000 for frontend). Nginx also handles SSL certificates (via Certbot) and static file caching.
* **Environment Variables:** Sensitive data (JWT secret, DB URIs, Gemini API Keys) would be stored securely in an `.env` file on the server, completely out of version control.
* **Managing Multiple Projects:** I would use Docker Compose. By containerizing the frontend, backend, Redis, and MongoDB, they run in isolated environments without dependency conflicts, allowing multiple different projects to share the same Linux instance safely.

### 2d. Kafka Usage (Conceptual)
If this application grew into a massive enterprise system, Apache Kafka would be highly beneficial for asynchronous event streaming:
1. **Asynchronous Bulk Processing:** Processing a massive CSV file synchronously blocks the main thread. We could use Kafka to publish a `CourseCSVUploaded` event. A separate background worker microservice would consume this event and parse/upload the data at its own pace, preventing API timeouts.
2. **Real-Time Analytics:** We could publish every user search query to a Kafka `SearchActivity` topic. A separate analytics service could consume this stream in real-time to generate trending topics without adding latency to the user's actual search experience.

---

##  Part 3: Frontend Explanations

### 3b. State Management
For this application, we utilized **React's built-in State Management (React Hooks like `useState` and `useMemo`)** combined with `localStorage` for persistent data, rather than introducing a heavy external library like Redux. 

**Choice Explanation:** The application's global state requirements are straightforward, primarily revolving around the admin authentication token and UI-level filtering states. React's native hooks provide a lightweight, efficient way to manage local component state without the boilerplate overhead of Redux, while `localStorage` perfectly handles session persistence.

### 3c. Caching (Frontend)
**Implementation:** Client-side caching was implemented using `sessionStorage` inside the API utility functions for course fetching. 

**Benefits:** 
1. **Reduced Server Load:** By caching the course list locally, navigating between the dashboard and other pages doesn't trigger redundant network requests to the backend.
2. **Instant UX:** Fetching from `sessionStorage` is instantaneous, creating a snappy user experience. 
3. **Smart Invalidation:** The cache is explicitly cleared (`sessionStorage.removeItem`) whenever an admin successfully uploads a new CSV, ensuring the user immediately sees the fresh, updated data without needing a hard browser refresh.
