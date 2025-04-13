# PDF Search! An AI Solution to find relavat docs

This project is a full-stack PDF search and extraction application built using Next.js for the frontend and Supabase as the backend. It allows users to:

- Search for PDFs using query parameters and filtering (such as grade).
- Display search results with a preview image generated via a backend API.
- Process PDFs to extract pages and evaluate the relevance of individual pages.
- Track user search activity.
- Print extracted PDF data.

## Table of Contents

- [Features](#features)
- [Setup and Installation](#setup-and-installation)
- [How It Works](#how-it-works)
  - [Data Flow](#data-flow)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)

## Features

- **Next.js Stack**: Enjoy both the App and Pages router with seamless integration.
- **Supabase Integration**: Leverage Supabase for backend and authentication functionality.
- **Drag-and-Drop Interface**: Powered by @dnd-kit for dynamic UI interactions.
- **Radix UI Components**: Utilize ready-to-use, accessible UI components.
- **Tailwind CSS**: Fast, responsive, and modern styling.
- **Bun Runtime**: Benefit from an ultra-fast JavaScript runtime for frontend development.
- **Docker Support**: Streamline your development environment with containerized services.
- **Modern Development Practices**: Includes typescript, prettier formatting and seamless local development setup.

## Setup and Installation

Before getting started, ensure you have the following prerequisites installed on your system:

- [Bun](https://bun.sh/) – For managing and running frontend dependencies.
- [Docker](https://www.docker.com/) – For containerizing and running your backend services.

### Step 1: Install Dependencies 
1. Open your terminal and navigate to the project root.
2. Run the following command to install the frontend dependencies using Bun:

   bun install

### Step 2: Setup Environment Variables
1. Copy `.env.example` to create a `.env.local` file in the root directory.
2. Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_PROJECT_URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_API_ANON_KEY]
   ```
3. We also need to setup `supabase/functions/.env` file for supabase:
    ```
    OPENAI_API_KEY=openai-key
    PDFCO_API_KEY=pdfco-api-key
    TAVILY_API_KEY=tavily-api-key
    VERCEL_URL=http://localhost:3000
    BUCKET_NAME=pdffiles
    ```

### Step 3: Starting the Backend
To start the Supabase backend locally via Docker, use:

   npm run supabase-start

This command sets up the Supabase environment locally. Make sure Docker is running on your system.

Make sure to run migrations and add bucket w.r.t. env variables setup in step 2.3

### Step 4: Running the Development Server
Finally, start the Next.js development server with Bun:

   bun dev

Once running, navigate to http://localhost:3000 in your browser to see the application UI.

## How It Works

The project integrates a modern frontend built with Next.js that communicates with a Supabase backend. Below are diagrams explaining the data flow and user journey.

### Data Flow

Below is a diagram that outlines how data flows through the system:

```mermaid
flowchart TD
    A["User Interface (Next.js)"]
    B[SearchBar & GradeDropdown Components]
    C[API Endpoint for PDF Search]
    D["SearchPDF Function (Backend)"]
    E[Supabase Database]
    F["PDF Parsing & Processing (pdf-parse)"]
    G[Image Generation API Endpoint]
    H[User Search Activity Logging]
    I[Final Result with relavance]

    A --> B
    B --> C
    C --> D
    D --> E
    D --> F
    F --> G
    D --> H
    E --> H
    H --> I
```

## Running the Project

To sum up, follow these commands to get the project up and running locally:

1. Install frontend dependencies:
   bun install

2. Start backend services:
   npm run supabase-start

3. Launch the Next.js development server:
   bun dev

Visit http://localhost:3000 to interact with the application.

## Project Structure

A quick glance at the core files and their purposes:

- package.json: Contains all project dependencies and scripts.
- .env.local: Local environment configuration (copy from .env.example).
- app/: Next.js pages or application directories.
- components/: Reusable UI components using dnd-kit and Radix UI.
- styles/: Tailwind CSS configuration and global styles.
