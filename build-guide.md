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
```bash
npx create-next-app@latest dnd-frontend --typescript --tailwind --eslint --app
cd dnd-frontend
```

**Install dependencies**:
```bash
npm install next-auth @next-auth/prisma-adapter
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react clsx tailwind-merge
npm install -D @types/node
```

### 3.2 Tailwind Configuration

**Configure red-brick/cloud-gray theme** (`tailwind.config.js`):
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

### 3.3 Authentication Setup

**Configure NextAuth** (`src/lib/auth.ts`):
- Credentials provider
- JWT strategy
- Session callbacks
- Role-based access

**Environment variables** (`.env.local`):
```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

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
