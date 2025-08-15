# AI Teacher Assistant: Feature Overview

This document provides a comprehensive overview of the features available in the AI Teacher Assistant application, detailing what is currently implemented and what is planned for future development.

---

## ✅ Completed Features (v2.5.1)

These features are fully implemented, tested, and available in the current version of the application.

### Core Platform & User Experience
-   **Secure Authentication**: Full user sign-up and login system supporting both Email/Password and Google OAuth, powered by Supabase.
-   **User Profile Management**: Users can update their professional details (name, title, school), avatar, and personal bio.
-   **Application Preferences**:
    -   **Theme Customization**: Switch between a polished Light and Dark mode.
    -   **Accent Colors**: Personalize the UI with a choice of accent colors.
    -   **Default Curriculum**: Set a preferred curriculum year to load automatically.
-   **Freemium Subscription Model**:
    -   **Free Plan**: New users start on a free plan with a limited number of AI generations per month.
    -   **Premium Plan**: Upgrade path available for increased limits and access to exclusive features.
-   **Interactive Guided Tour**: A step-by-step tour for new users to quickly learn the main features of the application.
-   **Responsive Design**: A fully responsive interface that works seamlessly on desktop, tablet, and mobile devices.

### 🧑‍💼 Admin Dashboard
-   **Role-Based Access Control**: Dashboard is exclusively available to users with the `admin` role.
-   **Comprehensive User Management**: View, search, and manage all registered users in a centralized table.
-   **User Editing**: Admins have full CRUD capabilities to modify user details, including:
    -   Subscription Plan (`free` / `premium`)
    -   User Role (`user` / `admin`)
    -   Lesson & Image Generation Credits

### 📝 AI Lesson Planner
-   **Official Curriculum Integration**: Pre-loaded with official Algerian primary school curriculums for **Years 3, 4, and 5**.
-   **Granular Lesson Selection**: A cascading accordion UI allows users to navigate from Sequence > Section > specific Lesson.
-   **Context-Aware Planning**: Displays relevant curriculum objectives, vocabulary, and official textbook activities as you plan.
-   **Advanced AI Customization**:
    -   **Detail Level**: Control the verbosity of the generated plan (Concise, Standard, Detailed).
    -   **Creativity Level**: Adjust the AI's adherence to the curriculum (Focused, Balanced, Creative).
-   **Dual Prompting Modes**:
    -   **Structured Mode**: A guided experience using curriculum selections.
    -   **Custom Mode**: Full control to write a detailed, custom prompt from scratch.
-   **Resource-Aware Generation**: Specify available classroom materials (e.g., "Projector", "Worksheets") for the AI to incorporate into the lesson plan.
-   **Professional Export**: Download generated lesson plans as formatted **Microsoft Word (.docx)** or **PDF** documents.
-   **Save & Manage Plans**: Save generated plans to your account and load them later from the "Saved Plans" view.

### 🖼️ AI Flashcard Generator
-   **Text-to-Image Generation**: Create high-quality images from simple text prompts.
-   **Artistic Style Control**: Choose from a variety of styles (Cartoon, Watercolor, Line Art, Photorealistic, etc.) for visual consistency.
-   **Multiple Aspect Ratios**: Generate images in various dimensions (1:1, 4:3, 16:9, etc.) to fit any need.
-   **Image Preview & Download**: Preview the generated image in a full-screen modal and download it as a PNG file.

### 🗓️ Timetable Editor
-   **Full School & Class Management**: Complete CRUD functionality for creating, updating, and deleting schools and their associated classes.
-   **Interactive Timetable Grid**: A visual weekly schedule where classes can be assigned to time slots with a single click.
-   **Persistent Data**: All schools, classes, and timetable assignments are securely saved to the user's account in the database.
-   **Professional Export**: Download the complete timetable as a formatted **Microsoft Word (.docx)** or **PDF** document.

### ✨ Premium Features
-   **Curriculum Overview**:
    -   **Yearly Plan View**: A high-level overview of all sequences and their objectives for the academic year.
    -   **Monthly Distribution View**: See how sequences are planned to be distributed across the academic months.
    -   **Detailed Monthly Plan**: A week-by-week breakdown of lessons for any given month, providing a detailed teaching calendar.
-   **Customizable School Calendar**:
    -   Comes pre-loaded with official national and religious holidays.
    -   Premium users can **add, edit, and delete** their own custom events (e.g., parent-teacher conferences, school trips).

---

## 🚀 Future Implementation

This section outlines planned features for upcoming versions of the AI Teacher Assistant.

### ✍️ AI-Powered Assessment Tools
-   **AI Exam Generator**:
    -   Generate comprehensive exams based on selected curriculum sequences or sections.
    -   Support for multiple question types (Multiple Choice, Short Answer, True/False, Fill-in-the-Blank).
    -   Ability to specify the number of questions and overall difficulty level.
    -   Automatic generation of a corresponding answer key.
    -   Exportable to Word and PDF formats for easy printing and distribution.
-   **AI Task & Worksheet Generator**:
    -   Create targeted worksheets and homework tasks for specific skills (e.g., vocabulary matching, grammar exercises, phonics drills).
    -   Generate creative activities like crosswords, word searches, and jumbled sentences based on lesson content.

### 📊 Classroom Management & Grading
-   **Grading Sheet Templates**:
    -   Generate and download customizable grading sheets for tracking student performance.
    -   Templates for different subjects and assessment types.
-   **Rubric Generator**:
    -   An interface to create, save, and manage assessment rubrics for projects, presentations, and writing tasks.
    -   (Future) AI-assisted rubric creation based on a task description.
-   **Student & Class Management**:
    -   Ability to create and manage student lists within each class.
    -   A foundation for future grade tracking and performance analysis features.

### 🌐 Platform Enhancements
-   **Collaboration Features**:
    -   Allow teachers (potentially within a "School" group) to share saved lesson plans, timetables, and custom calendar events.
-   **Expanded Curriculum Library**:
    -   Incorporate additional grade levels and potentially other subjects beyond English.
-   **Differentiated Instruction AI**:
    -   An advanced feature where the AI can suggest modifications to a generated lesson plan to cater to different learning needs (e.g., activities for advanced learners or support for struggling students).
-   **Localization (i18n)**:
    -   Translate the application interface into other languages, such as French and Arabic, to broaden its accessibility.

---
