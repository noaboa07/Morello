# Riot Games API | Full-Stack Proof of Concept
### Real-Time Data Integration & State Management | React & Node.js

This repository contains a technical sprint project focused on the architectural challenges of integrating a high-volume REST API into a full-stack environment. The project serves as an exploration of asynchronous data flow and nested JSON parsing using live data from the League of Legends ecosystem.

---

## 🛠️ Technical Focus

### ⚙️ Backend (Node.js)
* **Secure API Integration:** Implemented a middleware layer to handle authentication with the Riot Games developer portal and manage API headers.
* **Asynchronous Orchestration:** Utilized `async/await` patterns to manage multi-stage data fetches (e.g., retrieving a Summoner ID followed by recent Match IDs).
* **Payload Optimization:** Structured backend logic to filter and parse complex JSON responses before sending optimized objects to the frontend.

### ⚛️ Frontend (React)
* **Dynamic State Management:** Used React hooks to manage the lifecycle of API calls, including loading states and error handling for invalid player queries.
* **Data Visualization:** Built modular components to display nested player statistics, including KDA ratios, win rates, and champion-specific metadata.

---

## 🧠 Learning Objectives Achieved
* **Rate Limit Handling:** Gained experience in managing external API constraints and optimizing request frequency.
* **Full-Stack Connectivity:** Successfully bridged a decoupled frontend and backend to ensure smooth data handoffs.
* **Real-World Data Complexity:** Navigated the intricacies of large-scale gaming telemetry data.

---
**Project Status:** Archived / Learning Exercise (2024). 
This project provided the foundational full-stack architecture I now apply to Master's level AI and Big Data systems.

**Noah Russell** | Master of Science in AI (May 2026)
[LinkedIn](https://www.linkedin.com/in/noah-russell-61103128a/) | [Email](mailto:noahrussell2004@gmail.com)
