# Architecture Overview

This document provides a high-level overview of the technical architecture for the `fim-backend` and `fim-frontend` projects.

## 1. Project Type

The application is a full-stack solution built with TypeScript, comprising a NestJS backend and a Next.js frontend.

*   **Backend (`fim-backend`):** A modern, modular backend built with the **NestJS framework**. It leverages **Prisma** as its primary Object-Relational Mapper (ORM) for database interactions. For security, it employs JWT-based authentication using `@nestjs/jwt` and `passport`. The backend also includes **Swagger** for automated API documentation.

*   **Frontend (`fim-frontend`):** A reactive, server-rendered frontend developed with **Next.js** and **React**. It uses **NextAuth.js** for handling client-side authentication and session management. The user interface is styled with **Tailwind CSS**, a utility-first CSS framework.

## 2. High-Level Architecture

The system follows a classic **client-server architecture**, where the Next.js frontend acts as the client, and the NestJS backend serves as the API server. This is a monolithic approach, with both the frontend and backend being single, comprehensive applications.

Communication between the frontend and backend is handled via a **RESTful API**. The frontend makes HTTP requests to the backend to fetch data, perform actions, and manage user authentication.

## 3. Key Components

### Backend (`fim-backend`)

The backend is organized into distinct modules, each with a specific responsibility:

*   **`AuthModule`**: Manages user authentication, including registration, login, and JWT token management.
*   **`UsersModule`**: Handles all user-related operations, such as creating, retrieving, and updating user profiles.
*   **`FoundryModule`**: A core business logic module, likely responsible for managing "Foundry" instances or similar resources.
*   **`PrismaModule`**: Provides a centralized service for interacting with the database via the Prisma client.
*   **`HealthModule`**: Exposes a health check endpoint to monitor the application's status.

### Frontend (`fim-frontend`)

The frontend's structure is defined by Next.js's App Router, with the following key routes:

*   **/ (root)**: The main landing page of the application.
*   **/login, /register, /forgot-password**: Publicly accessible routes for user authentication.
*   **/dashboard**: A protected route that serves as the main user dashboard after login.
*   **/dashboard/profile**: A sub-route for managing user profiles.
*   **/dashboard/admin**: A protected area for administrative users.

## 4. Data Management

Data management in the backend is handled by **Prisma**, which serves as the ORM. It provides a type-safe database client and manages database migrations, simplifying interactions with the underlying database. The `schema.prisma` file defines the database schema, which is then used to generate the Prisma client.

## 5. Authentication

Authentication is implemented using a **JWT (JSON Web Token)**-based strategy:

1.  **Login**: The user provides their credentials on the frontend, which are sent to the backend's `/auth/login` endpoint.
2.  **Token Generation**: If the credentials are valid, the backend generates a short-lived `accessToken` and a long-lived `refreshToken`.
3.  **Session Management**: The frontend, using NextAuth.js, stores these tokens securely. The `accessToken` is included in the authorization header of all subsequent API requests.
4.  **Token Refresh**: When the `accessToken` expires, the frontend's `refreshToken` is used to request a new `accessToken` from the backend's `/auth/refresh` endpoint, ensuring a seamless and secure user session.