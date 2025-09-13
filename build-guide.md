# D&D Session Manager - Complete Build Instructions

## Project Overview

Build a web application for professional dungeon masters to manage player access to campaign resources. Players can create accounts, sign in, and access links assigned by admins. Admins have a dashboard to create pages and assign them to users.

## Technical Requirements

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: NestJS, PostgreSQL, Prisma ORM
- **Authentication**: JWT tokens, NextAuth.js
- **Testing**: Jest, React Testing Library, Supertest
- **Quality**: ESLint, Prettier, Husky pre-commit hooks

### Design Requirements
- **Color Scheme**: Red-brick (#d14545) on cloud-gray (#64748b) 
- **Style**: Minimalist design with clean typography
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: Input validation, XSS/CSRF protection, secure headers

## Phase 1: Project Setup and Database

### 1.1 Initialize Backend (NestJS)
```bash
<s>npm i -g @nestjs/cli</s>
<s>nest new dnd-backend --package-manager npm</s>
<s>cd dnd-backend</s>
```

**Install dependencies**:
```bash
<s>npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/swagger @nestjs/throttler</s>
<s>npm install @prisma/client bcryptjs class-transformer class-validator helmet</s>
<s>npm install passport passport-jwt passport-local reflect-metadata rxjs swagger-ui-express</s>
<s>npm install -D @types/bcryptjs @types/passport-jwt @types/passport-local prisma ts-node</s>
```

### 1.2 Setup Database with Prisma

**Initialize Prisma**:
```bash
<s>npx prisma init</s>
```

**Create schema** (`prisma/schema.prisma`):
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  firstName String   @map("first_name")
  lastName  String   @map("last_name")
  role      Role     @default(PLAYER)
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  createdPages Page[]
  assignments  UserPageAssignment[]
  sessions     Session[]

  @@map("users")
}

model Page {
  id          Int      @id @default(autoincrement())
  title       String
  url         String
  description String?
  isActive    Boolean  @default(true) @map("is_active")
  createdById Int      @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  createdBy   User                 @relation(fields: [createdById], references: [id])
  assignments UserPageAssignment[]

  @@map("pages")
}

model UserPageAssignment {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  pageId     Int      @map("page_id")
  assignedAt DateTime @default(now()) @map("assigned_at")
  assignedBy Int?     @map("assigned_by")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  page Page @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@unique([userId, pageId])
  @@map("user_page_assignments")
}

model Session {
  id        String   @id @default(cuid())
  userId    Int      @map("user_id")
  expires   DateTime
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int      @map("user_id")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("refresh_tokens")
}

enum Role {
  ADMIN
  PLAYER
}
```

<s>**Environment variables** (`.env`):</s>
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/dnd_manager?schema=public"
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
THROTTLE_TTL=60
THROTTLE_LIMIT=100
BCRYPT_ROUNDS=10
```

### 1.3 Create Database Migration and Seed
```bash
<s>npm run db:migrate -- --name init</s>
```

**Create seed file** (`prisma/seed.ts`) with:
- [x] Admin user: admin@dndmanager.com / admin123
- [x] 4 player accounts (Fellowship theme)
- [x] 6 sample campaign pages
- [x] Realistic page assignments

## Phase 2: Backend API Implementation

### 2.1 Authentication Module

**Create auth module**:
```bash
nest g module auth
nest g service auth
nest g controller auth
```

**Required auth features**:
- JWT strategy with access/refresh tokens
- Local strategy for login
- Password hashing with bcrypt
- Role-based guards (Admin/Player)
- Register, login, refresh token endpoints

### 2.2 Users Module

**Create users module**:
```bash
<s>nest g module users</s>
<s>nest g service users</s>
<s>nest g controller users</s>
```

**User endpoints**:
- [x] `GET /users` (admin only) - List all users
- [x] `GET /users/profile` - Get current user profile
- [x] `PUT /users/profile` - Update profile
- [x] `DELETE /users/:id` (admin only) - Soft delete user

### 2.3 Pages Module

**Create pages module**:
```bash
nest g module pages
nest g service pages
nest g controller pages
```

**Page endpoints**:
- `GET /pages` (admin) - List all pages
- `GET /pages/assigned` (player) - Get user's assigned pages
- `POST /pages` (admin) - Create new page
- `PUT /pages/:id` (admin) - Update page
- `DELETE /pages/:id` (admin) - Soft delete page

### 2.4 Assignments Module

**Create assignments module**:
```bash
nest g module assignments
nest g service assignments
nest g controller assignments
```

**Assignment endpoints**:
- `POST /assignments` (admin) - Assign page to user
- `DELETE /assignments/:id` (admin) - Remove assignment
- `GET /assignments/user/:userId` (admin) - Get user's assignments

### 2.5 Security Configuration

**Main app configuration** (`main.ts`):
- <s>Helmet for security headers</s>
- <s>CORS configuration</s>
- <s>Global validation pipe</s>
- <s>Swagger API documentation</s>
- <s>Rate limiting with throttler</s>

## Phase 3: Frontend Setup (Next.js)

### 3.1 Initialize Frontend
1.  **Create Next.js Application**:
    ```bash
    npx create-next-app@latest dnd-frontend --typescript --tailwind --eslint --app
    cd dnd-frontend
    ```
    *   This command initializes a new Next.js project named `dnd-frontend` with TypeScript, Tailwind CSS, ESLint, and the App Router enabled.

2.  **Configure ESLint and Prettier**:
    *   The `create-next-app` command already sets up ESLint. Ensure your `.eslintrc.json` (or equivalent) includes recommended Next.js and React rules.
    *   Install Prettier for code formatting:
        ```bash
        npm install -D prettier prettier-plugin-tailwindcss
        ```
    *   Create a `.prettierrc` file at the root of `dnd-frontend` for consistent code style:
        ```json
        {
          "semi": true,
          "singleQuote": true,
          "printWidth": 100,
          "tabWidth": 2,
          "trailingComma": "es5",
          "plugins": ["prettier-plugin-tailwindcss"]
        }
        ```
    *   Add a `.prettierignore` file to exclude specific files from formatting:
        ```
        .next/
        node_modules/
        ```
    *   Integrate Prettier with ESLint by adding `prettier` to your ESLint configuration (e.g., in `extends` array).

3.  **Install Frontend Dependencies**:
    ```bash
    npm install next-auth @next-auth/prisma-adapter
    npm install react-hook-form @hookform/resolvers zod
    npm install lucide-react clsx tailwind-merge
    npm install -D @types/node
    ```
    *   `next-auth`: For authentication in Next.js applications.
    *   `@next-auth/prisma-adapter`: Adapter to integrate NextAuth.js with Prisma.
    *   `react-hook-form`: For efficient and flexible form management.
    *   `@hookform/resolvers`: Integrates form validation libraries like Zod with React Hook Form.
    *   `zod`: A TypeScript-first schema declaration and validation library.
    *   `lucide-react`: A collection of beautiful open-source icons.
    *   `clsx`, `tailwind-merge`: Utilities for conditionally joining CSS class names and merging Tailwind CSS classes without style conflicts.
    *   `@types/node`: TypeScript type definitions for Node.js.

### 3.2 Tailwind Configuration
1.  **Configure Theme Colors** (`tailwind.config.js`):
    ```js
    module.exports = {
      content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
      theme: {
        extend: {
          colors: {
            brick: {
              50: '#fef7f7',
              500: '#e66f6f',
              700: '#b83535',
              800: '#9a2e2e',
            },
            gray: {
              50: '#f8fafc',
              500: '#64748b',
              700: '#334155',
              900: '#0f172a',
            }
          }
        },
      },
      plugins: [],
    }
    ```
    *   This configuration extends Tailwind's default color palette to include custom `brick` (red-brick) and `gray` (cloud-gray) shades, aligning with the project's design requirements.

2.  **Update Global CSS** (`src/app/globals.css`):
    *   Ensure Tailwind's base, components, and utilities are imported:
        ```css
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
        ```
    *   This ensures Tailwind CSS is correctly integrated and applied throughout the application.

### 3.3 Authentication Setup
1.  **Configure NextAuth.js** (`src/lib/auth.ts`):
    *   Implement a Credentials provider for email/password login.
    *   Configure JWT strategy for session management.
    *   Set up session callbacks to include user roles and custom data in the session object.
    *   Define role-based access control within NextAuth.js to protect routes and API calls.

2.  **Set Environment Variables** (`.env.local`):
    ```bash
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="your-nextauth-secret"
    NEXT_PUBLIC_API_URL="http://localhost:3001"
    ```
    *   `NEXTAUTH_URL`: The base URL of your Next.js application.
    *   `NEXTAUTH_SECRET`: A secret used to sign and encrypt session tokens. Generate a strong, random string for this.
    *   `NEXT_PUBLIC_API_URL`: The URL of the backend API, used for making authentication requests.

3.  **Create API Utility for Backend Interaction** (`src/lib/api.ts`):
    *   Develop a utility to handle API requests to the NestJS backend, including setting up Axios or Fetch with interceptors for JWT token attachment and error handling.
    *   Example structure:
        ```typescript
        // src/lib/api.ts
        import axios from 'axios';

        const api = axios.create({
          baseURL: process.env.NEXT_PUBLIC_API_URL,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Add a request interceptor to include the JWT token
        api.interceptors.request.use(
          (config) => {
            // Retrieve token from session or local storage
            // const token = getSessionToken();
            // if (token) {
            //   config.headers.Authorization = `Bearer ${token}`;
            // }
            return config;
          },
          (error) => {
            return Promise.reject(error);
          }
        );

        export default api;
        ```
    *   This utility will centralize API calls and ensure consistent authentication headers.

### 3.4 Core UI Components for Authentication
1.  **Create Reusable UI Components** (`src/components/ui/`):
    *   `Button.tsx`: A versatile button component with different styles (primary, secondary, ghost) and loading states.
    *   `Input.tsx`: A styled input component that can display validation errors.
    *   `Card.tsx`: A container component for grouping related content, often used for forms or data displays.
    *   `LoadingSpinner.tsx`: A visual indicator for asynchronous operations.
    *   `Alert.tsx`: Components for displaying success, error, or informational messages.

2.  **Implement Form Validation Schema** (`src/lib/validation/auth.ts`):
    *   Use Zod to define schemas for login and registration forms, ensuring data integrity and providing clear error messages.
    *   Example for login schema:
        ```typescript
        // src/lib/validation/auth.ts
        import { z } from 'zod';

        export const loginSchema = z.object({
          email: z.string().email({ message: 'Invalid email address' }),
          password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
        });

        export type LoginInput = z.infer<typeof loginSchema>;
        ```

### 3.5 Authentication Pages
1.  **Login Page** (`src/app/(auth)/login/page.tsx`):
    *   Design a user-friendly login form using `react-hook-form` and Zod for validation.
    *   Handle form submission by calling the NextAuth `signIn` function, interacting with the backend API.
    *   Implement error handling for invalid credentials or API failures.
    *   Redirect authenticated users to their respective dashboards (admin or player).

2.  **Registration Page** (`src/app/(auth)/register/page.tsx`):
    *   Create a registration form for new users, including fields for email, password, first name, and last name.
    *   Utilize `react-hook-form` and Zod for client-side validation.
    *   Submit registration data to the backend API.
    *   Provide clear success or error feedback to the user.

### 3.6 Layout and Navigation
1.  **Authentication Layout** (`src/app/(auth)/layout.tsx`):
    *   Create a dedicated layout for authentication pages (login, register) that provides a consistent visual experience, separate from the main application layout.

2.  **Root Layout** (`src/app/layout.tsx`):
    *   Wrap the application with `SessionProvider` from `next-auth/react` to make session data available throughout the app.
    *   Integrate the main application layout components (Header, Footer, Sidebar) as needed, ensuring they adapt based on authentication status and user roles.

### 3.7 Best Practices for Frontend Development
1.  **Component Reusability**: Design UI components to be generic and reusable across different parts of the application.
2.  **Client-Side Validation**: Implement robust client-side validation using libraries like Zod and `react-hook-form` to provide immediate feedback to users and reduce server load.
3.  **Error Handling**: Implement comprehensive error handling for API calls and user input, displaying clear and actionable messages.
4.  **Loading States**: Provide visual feedback (e.g., loading spinners, disabled buttons) during asynchronous operations to improve user experience.
5.  **Accessibility (A11y)**: Ensure all interactive elements are keyboard-navigable, have appropriate ARIA attributes, and maintain sufficient color contrast.
6.  **Responsive Design**: Use Tailwind CSS to build a responsive UI that adapts seamlessly to various screen sizes.
7.  **Environment Variables**: Properly manage environment variables for API endpoints and secrets, separating development and production configurations.
8.  **Code Organization**: Maintain a clear and consistent file structure (e.g., `components/ui`, `lib/auth`, `app/(auth)`) for better maintainability.
9.  **TypeScript**: Leverage TypeScript for type safety, improving code quality and reducing runtime errors.
10. **Security**:
    *   **HTTPS**: Ensure all communication with the backend API uses HTTPS.
    *   **Input Sanitization**: Although primarily a backend concern, be mindful of potential XSS vulnerabilities when rendering user-generated content on the frontend.
    *   **Secure Cookies**: Configure NextAuth.js to use secure, HTTP-only cookies for session management.
    *   **CSRF Protection**: NextAuth.js includes built-in CSRF protection for forms.

## Phase 4: Core Frontend Components

### 4.1 Layout Components

**Create base layout** (`src/components/layout/`):
- `Header.tsx` - Navigation with user menu
- `Sidebar.tsx` - Role-based navigation
- `Footer.tsx` - Simple footer
- `Layout.tsx` - Main layout wrapper

### 4.2 Authentication Pages

**Login page** (`src/app/(auth)/login/page.tsx`):
- Email/password form with validation
- Error handling and loading states
- Redirect to appropriate dashboard

**Register page** (`src/app/(auth)/register/page.tsx`):
- Full registration form
- Client-side validation with Zod
- Success/error feedback

### 4.3 UI Components

**Create reusable components** (`src/components/ui/`):
- `Button.tsx` - Various button styles
- `Input.tsx` - Form input with validation
- `Card.tsx` - Content cards
- `Modal.tsx` - Modal dialogs
- `Loading.tsx` - Loading spinners
- `Alert.tsx` - Success/error alerts

## Phase 5: Admin Dashboard

### 5.1 Admin Layout

**Admin dashboard** (`src/app/admin/dashboard/page.tsx`):
- User statistics
- Recent page assignments
- Quick actions

### 5.2 User Management

**Users page** (`src/app/admin/users/page.tsx`):
- Data table with search/filter
- Create new user modal
- User actions (view, edit, delete)

### 5.3 Page Management

**Pages page** (`src/app/admin/pages/page.tsx`):
- List all pages
- Create/edit page modal
- Assign pages to users interface

### 5.4 Assignment Management

**Assignments interface**:
- Bulk assignment functionality
- Visual assignment matrix
- Assignment history

## Phase 6: Player Dashboard

### 6.1 Player Dashboard

**Player dashboard** (`src/app/player/dashboard/page.tsx`):
- Welcome message
- Assigned pages list
- Recent activity

### 6.2 Page Access

**Page cards with**:
- Title and description
- External link button
- Last accessed timestamp
- Responsive grid layout

## Phase 7: Advanced Features

### 7.1 Search and Filtering

**Implement search**:
- Global search across pages
- Filter by assignment status
- Sort options

### 7.2 Audit Logging

**Add audit trails**:
- User login history
- Page access logs
- Admin actions tracking

### 7.3 Notifications

**Notification system**:
- New page assignments
- System announcements
- Email notifications

## Phase 8: Foundry VTT Integration

### 8.1 Foundry VTT Module

**Create foundry module**:
```bash
nest g module foundry
nest g service foundry
nest g controller foundry
```

**Foundry VTT features**:
- Endpoints to manage Foundry VTT Docker container (admin only): start, stop, delete, status
- Docker command execution
- Error handling for Docker commands

### 8.2 Docker Configuration for Foundry VTT

**Add Foundry VTT service to `docker-compose.yml`**:
```yaml
  foundry:
    image: felddy/foundryvtt:release
    container_name: foundryvtt
    hostname: foundryvtt
    ports:
      - "30000:30000"
    volumes:
      - ./foundryvtt-data:/data
    environment:
      - FOUNDRY_VTT_PASSWORD=your_foundry_password
      - FOUNDRY_VTT_ADMIN_KEY=your_admin_key
    restart: unless-stopped
```

## Phase 9: Testing Implementation

### 9.1 Backend Testing

**Unit tests**:
```bash
npm run test
```
- Service layer tests
- Controller tests
- Auth guard tests

**E2E tests**:
```bash
npm run test:e2e
```
- Authentication flows
- CRUD operations
- Authorization checks

### 9.2 Frontend Testing

**Component tests**:
- React Testing Library
- User interaction tests
- Form validation tests

**Integration tests**:
- Authentication flows
- API integration
- Router navigation

## Phase 10: Security & Performance

### 9.1 Security Hardening

**Backend security**:
- Input sanitization
- SQL injection prevention
- Rate limiting
- HTTPS enforcement

**Frontend security**:
- XSS protection
- CSRF tokens
- Secure cookie settings

### 9.2 Performance Optimization

**Backend optimization**:
- Database indexing
- Query optimization
- Caching strategy

**Frontend optimization**:
- Code splitting
- Image optimization
- Bundle analysis

## Phase 11: Documentation & Deployment

### 10.1 API Documentation

**Swagger documentation**:
- Endpoint documentation
- Schema definitions
- Authentication examples

### 10.2 Deployment Setup

**Backend deployment**:
- Docker containerization
- Environment configuration
- Database migrations

**Frontend deployment**:
- Static site generation
- Environment variables
- CDN configuration

## Quality Checklist

### Code Quality
- [ ] ESLint configuration with strict rules
- [ ] Prettier formatting
- [ ] Husky pre-commit hooks
- [ ] TypeScript strict mode
- [ ] 80%+ test coverage

### Security
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Secure headers
- [ ] Rate limiting

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast ratios
- [ ] Focus management
- [ ] Alt text for images

### Performance
- [ ] Database query optimization
- [ ] Frontend bundle optimization
- [ ] Image optimization
- [ ] Lazy loading
- [ ] Caching strategies

### User Experience
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Form validation
- [ ] Success feedback
- [ ] Intuitive navigation

## Development Workflow

1. **Start with database and backend API**
2. **Implement authentication system**
3. **Build admin functionality first**
4. **Add player dashboard**
5. **Implement testing throughout**
6. **Add advanced features**
7. **Security and performance optimization**
8. **Documentation and deployment**

## Success Criteria

- [ ] Admins can create accounts and manage users
- [ ] Admins can create pages and assign them to players
- [ ] Players can log in and access assigned pages
- [ ] Secure authentication with role-based access
- [ ] Responsive design works on all devices
- [ ] Application passes security audit
- [ ] 95%+ uptime after deployment
- [ ] Fast loading times (< 3 seconds)

This comprehensive guide provides all the steps needed to build a production-ready D&D session manager application from scratch.

## Tech Debt

### Phase 1: Project Setup and Database

*   **1.1 Initialize Backend (NestJS) - Install dependencies**: The `build-guide.md` specifies `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/swagger`, `@nestjs/throttler`, `@prisma/client`, `bcryptjs`, `class-transformer`, `class-validator`, `helmet`, `passport`, `passport-jwt`, `passport-local`, `reflect-metadata`, `rxjs`, and `swagger-ui-express` as direct dependencies. However, in `fim-backend/package.json`, these packages are listed under `devDependencies`. This discrepancy should be addressed to align with the guide's intended dependency structure.
