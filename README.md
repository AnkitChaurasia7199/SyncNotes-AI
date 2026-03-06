SyncNotes AI 

SyncNotesAI is an AI-powered note-taking web application that allows users to create, organize, and manage notes efficiently. It uses AI to generate summaries, extract key insights, and improve productivity. Built with modern web technologies, it provides secure authentication, real-time note management, and seamless access across devices.


---
Project Info

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher) - [Download](https://nodejs.org)
- MongoDB (local or Atlas) - [Download](https://www.mongodb.com/try/download/community)
- npm or yarn - Comes with Node.js
- Git - [Download](https://git-scm.com/downloads)
- Postman (optional, for API testing) - [Download](https://www.postman.com)

---

Project Implementation

SyncNotes AI was developed as a multi-tenant team collaboration platform that allows teams to create, manage, and organize notes within isolated workspaces. The main goal of the project was to design a system where multiple teams can work independently while maintaining data security, structured collaboration, and AI-assisted productivity.

The backend of the application was built using Node.js and Express.js to handle API routing, authentication, and note management. MongoDB was chosen as the database because its document-oriented structure fits naturally with note-based content and flexible metadata. Using Mongoose, schemas were defined for users, workspaces, and notes to maintain structured data and simplify database operations.

To ensure secure user access, the project implements JWT-based authentication. During user registration, passwords are securely encrypted using bcrypt hashing so that sensitive credentials are never stored in plain text. When a user logs in, the system verifies the hashed password and generates a JWT token, which is used to authenticate all protected API requests.

Since the platform supports multiple teams, the system follows a workspace-based multi-tenant architecture. Each user and note is associated with a specific workspace ID. The backend verifies this workspace identifier before returning or modifying any data, ensuring that users can only access information belonging to their own workspace. This approach guarantees strict workspace isolation and improved data security.

The frontend was developed using React.js, which communicates with the backend through REST APIs using Axios. After authentication, the client stores the JWT token and attaches it to API requests so that only authorized users can interact with protected endpoints.

A key feature of the platform is AI-powered note summarization. When a user creates a note, the note content is sent to the ChatGPT API, which analyzes the text and generates a concise summary along with key points. These AI-generated insights are stored in the database and displayed to users, helping teams quickly understand important information without reading the entire note.

Sensitive configuration values such as database credentials, JWT secret keys, and AI API keys are stored using environment variables to ensure security and maintain proper configuration management.

Overall, the system combines secure authentication, role-based access control, workspace isolation, and AI integration to create a scalable and intelligent collaborative notes platform.







-------------------------------------------------------------------------------------------------------------------------------------------------------------------
