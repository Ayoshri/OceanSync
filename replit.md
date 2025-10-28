# Overview

OceanSync is a full-stack web application for ocean hazard reporting and marine safety awareness. The platform allows users to report ocean hazards (like rip currents, debris, dangerous conditions) with location data, images, and audio recordings. It features a mobile-first design with a social feed of hazard reports, real-time ocean conditions dashboard, and community engagement features.

The application serves as a safety tool for beachgoers, surfers, and coastal communities by crowdsourcing hazard information and providing current ocean conditions in an easy-to-use interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Optimized for mobile devices with responsive breakpoints

## Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **Development**: Hot reload with Vite integration for full-stack development experience
- **API Design**: RESTful endpoints with structured error handling and request logging
- **Data Storage**: In-memory storage implementation with interface for future database migration

## Authentication System
- **Strategy**: Simple email/password authentication with session management
- **Storage**: Client-side localStorage for session persistence
- **Security**: Basic credential validation with plans for enhanced security measures

## Database Schema
- **ORM**: Drizzle ORM with PostgreSQL dialect configuration
- **Tables**: 
  - Users table with authentication credentials and profile data
  - Hazard reports table with geolocation, media URLs, and timestamps
- **Relationships**: Foreign key relationship between users and their hazard reports
- **Migrations**: Configured for database schema evolution

## Data Flow Patterns
- **Client-Server Communication**: HTTP JSON APIs with standardized request/response formats
- **Real-time Features**: Geolocation API integration for location-based reporting
- **Media Handling**: File upload support for images and audio recordings
- **Caching Strategy**: Query-based caching with React Query for optimal performance

## Development Workflow
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation
- **Development Server**: Hot module replacement and error overlay for rapid development
- **Code Quality**: TypeScript strict mode with path mapping for clean imports

# External Dependencies

## Core Framework Dependencies
- **@tanstack/react-query**: Server state management and API caching
- **wouter**: Lightweight routing solution for single-page application navigation
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **@neondatabase/serverless**: PostgreSQL database driver for serverless environments

## UI and Styling
- **@radix-ui/***: Comprehensive collection of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Utility for managing CSS class variants
- **clsx** and **tailwind-merge**: Class name management utilities

## Media and Interaction
- **embla-carousel-react**: Touch-friendly carousel component for media display
- **date-fns**: Date manipulation and formatting utilities
- **react-hook-form**: Form state management and validation

## Development Tools
- **vite**: Build tool and development server with hot module replacement
- **@vitejs/plugin-react**: React support for Vite
- **tsx**: TypeScript execution environment for Node.js
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Validation and Schemas
- **zod**: TypeScript-first schema validation library
- **drizzle-zod**: Integration between Drizzle ORM and Zod for type-safe validation
- **@hookform/resolvers**: Form validation resolver for react-hook-form

## Planned Integrations
- **PostgreSQL Database**: Production-ready database with connection pooling
- **File Storage Service**: Cloud storage for user-uploaded images and audio
- **Geolocation Services**: Enhanced location services and mapping integration
- **Push Notifications**: Real-time alerts for critical ocean hazards