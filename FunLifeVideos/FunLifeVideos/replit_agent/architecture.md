# Architecture Overview - FunLife Application

## 1. Overview

FunLife is a full-stack web application for sharing and discovering 60-second videos. The application follows a modern client-server architecture, with a React frontend, Express.js backend, and PostgreSQL database. The application uses a RESTful API pattern for communication between the client and server.

The codebase is structured as a monorepo with the following main directories:
- `client`: Contains the React application
- `server`: Contains the Express.js server
- `shared`: Contains schema definitions and types shared between client and server

## 2. System Architecture

### 2.1 Technology Stack

- **Frontend**: React with TypeScript, built using Vite
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: React Query for server state, React Context for UI state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **API Pattern**: RESTful API

### 2.2 High-Level Architecture

```
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│                   │      │                   │      │                   │
│   React Client    │◄────►│   Express Server  │◄────►│  PostgreSQL DB    │
│                   │      │                   │      │                   │
└───────────────────┘      └───────────────────┘      └───────────────────┘
```

The application follows a three-tier architecture:
1. **Presentation Layer**: React application with UI components
2. **Application Layer**: Express.js server with business logic and API endpoints
3. **Data Layer**: PostgreSQL database for persistent storage

## 3. Key Components

### 3.1 Frontend Architecture

The frontend is built with React and TypeScript, using a component-based architecture. Key patterns and structures include:

#### Directory Structure

- `client/src/pages`: Page components for different routes
- `client/src/components`: Reusable UI components
- `client/src/components/ui`: UI component library (shadcn/ui)
- `client/src/lib`: Utility functions and hooks
- `client/src/hooks`: Custom React hooks

#### State Management

- **Server State**: Managed with React Query
- **UI State**: Managed with React Context (FunLifeProvider)

The main context is `FunLifeProvider` which handles:
- Current user
- Modal states
- Current video for comments

#### Routing

Client-side routing is handled by Wouter, with the following main routes:
- `/`: Home/Feed page
- `/profile/:id?`: User profile page
- `/discover`: Search and discovery page
- `/inbox`: Notifications and messages

#### UI Components

UI components use shadcn/ui, which is built on:
- Tailwind CSS for styling
- Radix UI for accessible UI primitives
- Class Variance Authority for component variants

### 3.2 Backend Architecture

The backend is an Express.js server structured around RESTful API principles:

#### Directory Structure

- `server/index.ts`: Entry point for the Express server
- `server/routes.ts`: API route definitions
- `server/storage.ts`: Data access layer for database operations
- `server/vite.ts`: Integration with Vite for development

#### API Endpoints

The backend implements RESTful API endpoints including:
- User management (profile, follow)
- Video management (upload, like, comment)
- Feed and discovery services

#### Data Access

The backend implements a repository pattern through the `storage.ts` file, which provides an abstraction layer over the database operations. The `IStorage` interface defines all the data access methods needed by the application.

### 3.3 Database Schema

The database uses a relational PostgreSQL schema defined with Drizzle ORM:

- `users`: Stores user accounts and profile information
- `videos`: Stores video metadata and references to video files
- `likes`: Stores user likes on videos
- `comments`: Stores user comments on videos
- `follows`: Stores user follow relationships

Key relationships:
- Users can have many videos (one-to-many)
- Users can like many videos (many-to-many via likes)
- Users can comment on many videos (many-to-many via comments)
- Users can follow many users (many-to-many via follows)

## 4. Data Flow

### 4.1 Video Feed Flow

1. Client requests video feed from `/api/videos/feed`
2. Server fetches videos from database with pagination
3. Server returns videos with user information
4. Client renders videos in scrollable feed
5. Client loads more videos when user scrolls to bottom

### 4.2 Video Upload Flow

1. User selects video file and fills caption/tags
2. Client uploads video to server via multipart form data
3. Server stores video file in filesystem
4. Server creates video record in database
5. Server returns success response
6. Client updates UI to show success

### 4.3 Social Interaction Flow

For likes, comments, and follows:
1. User performs social action (like, comment, follow)
2. Client sends request to appropriate API endpoint
3. Server updates database
4. Server returns updated data
5. Client updates UI with optimistic updates and refetches data

## 5. External Dependencies

### 5.1 Core Dependencies

- **React**: UI library
- **Express**: Web server framework
- **Drizzle ORM**: Database ORM
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching and state management
- **Zod**: Schema validation
- **Radix UI**: Accessible UI primitives
- **Wouter**: Client-side routing
- **Multer**: File upload handling

### 5.2 Development Dependencies

- **TypeScript**: Type checking
- **Vite**: Build tool and development server
- **ESBuild**: JavaScript bundler
- **Drizzle Kit**: Schema migration tools

## 6. Deployment Strategy

The application is configured for deployment on Replit with the following strategy:

### 6.1 Build Process

1. Client-side code is built with Vite
2. Server-side code is bundled with ESBuild
3. Static assets are served from `dist/public` directory

### 6.2 Runtime Configuration

- Using environment variables for configuration
- Production mode uses bundled assets
- Development mode uses Vite development server

### 6.3 Database Connectivity

- Database connection via environment variables
- Connection pooling for production use

### 6.4 File Storage

- Uploaded videos are stored in the filesystem
- File uploads are processed with Multer

## 7. Authentication and Security

### 7.1 Authentication

The current implementation uses a simplified authentication approach with user IDs in request headers. In a production environment, this would be replaced with:
- JWT-based authentication
- Session management
- CSRF protection

### 7.2 Data Validation

- Input validation using Zod schemas
- Database schema validation with Drizzle ORM

## 8. Future Considerations

Areas for potential architectural improvements:

1. **Scalability**: Implement video CDN for better video delivery
2. **Authentication**: Implement proper user authentication and authorization
3. **Cloud Storage**: Move video storage to cloud providers for better scalability
4. **Caching**: Implement cache layer for frequently accessed data
5. **Real-time Features**: Add WebSocket support for real-time notifications