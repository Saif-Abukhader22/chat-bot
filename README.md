# AI Chat Application

A modern, responsive chat application built with React, TypeScript, and Vite, supporting multiple AI providers (OpenAI and Google Gemini).

## 🚀 Features

- **Multi-AI Provider Support**: Integrated support for OpenAI GPT and Google Gemini
- **Modern UI/UX**: Built with shadcn/ui components and Tailwind CSS
- **Real-time Chat Interface**: Responsive chat interface with message history
- **Local Storage**: Persistent chat history and settings
- **TypeScript**: Full type safety throughout the application
- **Component-Based Architecture**: Modular and maintainable code structure
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 📁 Project Structure

```
my-app/
├── public/                          # Static assets
├── src/
│   ├── components/                  # React components
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── accordion.tsx       # Collapsible content sections
│   │   │   ├── alert-dialog.tsx    # Modal dialogs for alerts
│   │   │   ├── alert.tsx           # Alert notifications
│   │   │   ├── aspect-ratio.tsx    # Responsive aspect ratio container
│   │   │   ├── avatar.tsx          # User profile pictures
│   │   │   ├── badge.tsx           # Status indicators and labels
│   │   │   ├── breadcrumb.tsx      # Navigation breadcrumbs
│   │   │   ├── button.tsx          # Interactive buttons
│   │   │   ├── calendar.tsx        # Date picker component
│   │   │   ├── card.tsx            # Content containers
│   │   │   ├── carousel.tsx        # Image/content carousel
│   │   │   ├── chart.tsx           # Data visualization
│   │   │   ├── checkbox.tsx        # Form checkboxes
│   │   │   ├── collapsible.tsx     # Expandable content
│   │   │   ├── command.tsx         # Command palette
│   │   │   ├── context-menu.tsx    # Right-click menus
│   │   │   ├── dialog.tsx          # Modal dialogs
│   │   │   ├── drawer.tsx          # Slide-out panels
│   │   │   ├── dropdown-menu.tsx   # Dropdown menus
│   │   │   ├── form.tsx            # Form components
│   │   │   ├── hover-card.tsx      # Hover tooltips
│   │   │   ├── input-otp.tsx       # OTP input fields
│   │   │   ├── input.tsx           # Text input fields
│   │   │   ├── label.tsx           # Form labels
│   │   │   ├── menubar.tsx         # Application menu bar
│   │   │   ├── navigation-menu.tsx # Navigation menus
│   │   │   ├── pagination.tsx      # Page navigation
│   │   │   ├── popover.tsx         # Floating content
│   │   │   ├── progress.tsx        # Progress indicators
│   │   │   ├── radio-group.tsx     # Radio button groups
│   │   │   ├── resizable.tsx       # Resizable panels
│   │   │   ├── scroll-area.tsx     # Custom scrollbars
│   │   │   ├── select.tsx          # Dropdown selects
│   │   │   ├── separator.tsx       # Visual separators
│   │   │   ├── sheet.tsx           # Side panels
│   │   │   ├── sidebar.tsx         # Application sidebar
│   │   │   ├── skeleton.tsx        # Loading placeholders
│   │   │   ├── slider.tsx          # Range sliders
│   │   │   ├── sonner.tsx          # Toast notifications
│   │   │   ├── switch.tsx          # Toggle switches
│   │   │   ├── table.tsx           # Data tables
│   │   │   ├── tabs.tsx            # Tab navigation
│   │   │   ├── textarea.tsx        # Multi-line text input
│   │   │   ├── toast.tsx           # Toast notifications
│   │   │   ├── toaster.tsx         # Toast container
│   │   │   ├── toggle-group.tsx    # Toggle button groups
│   │   │   ├── toggle.tsx          # Toggle buttons
│   │   │   ├── tooltip.tsx         # Hover tooltips
│   │   │   └── use-toast.ts        # Toast hook utility
│   │   ├── ChatHistory.tsx         # Chat message history display
│   │   ├── ChatInput.tsx           # Message input component
│   │   ├── ChatInterface.tsx       # Main chat interface container
│   │   ├── CodeBlock.tsx           # Syntax-highlighted code display
│   │   ├── MessageBubble.tsx       # Individual message display
│   │   └── SettingsDialog.tsx      # App settings modal
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-mobile.tsx          # Mobile device detection
│   │   ├── use-toast.ts            # Toast notification management
│   │   └── useChat.ts              # Chat state management
│   ├── lib/                        # Utility libraries
│   │   └── utils.ts                # Common utility functions
│   ├── pages/                      # Page components
│   │   ├── ChatApp.tsx             # Main chat application page
│   │   ├── Index.tsx               # Landing/home page
│   │   └── NotFound.tsx            # 404 error page
│   ├── services/                   # External service integrations
│   │   ├── geminiService.ts        # Google Gemini AI service
│   │   ├── openaiService.ts        # OpenAI GPT service
│   │   └── storageService.ts       # Local storage management
│   ├── App.css                     # Global application styles
│   ├── App.tsx                     # Root application component
│   ├── index.css                   # Global CSS imports
│   └── main.tsx                    # Application entry point
├── .gitignore                      # Git ignore rules
├── components.json                 # shadcn/ui configuration
├── eslint.config.js               # ESLint configuration
├── index.html                     # HTML template
├── package.json                   # Project dependencies
├── postcss.config.js              # PostCSS configuration
├── README.md                      # Project documentation
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.app.json              # TypeScript app configuration
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.node.json             # TypeScript Node.js configuration
└── vite.config.ts                 # Vite bundler configuration
```

## Project Structure and Flow Diagram

graph TB
    %% Entry Points
    HTML[index.html] --> MAIN[main.tsx]
    MAIN --> APP[App.tsx]
    
    %% Main Application Flow
    APP --> CHAT_APP[pages/ChatApp.tsx]
    APP --> INDEX[pages/Index.tsx]
    APP --> NOT_FOUND[pages/NotFound.tsx]
    
    %% Chat Application Core
    CHAT_APP --> CHAT_INTERFACE[components/ChatInterface.tsx]
    
    %% Chat Interface Components
    CHAT_INTERFACE --> CHAT_HISTORY[components/ChatHistory.tsx]
    CHAT_INTERFACE --> CHAT_INPUT[components/ChatInput.tsx]
    CHAT_INTERFACE --> SETTINGS[components/SettingsDialog.tsx]
    
    %% Message Components
    CHAT_HISTORY --> MESSAGE_BUBBLE[components/MessageBubble.tsx]
    MESSAGE_BUBBLE --> CODE_BLOCK[components/CodeBlock.tsx]
    
    %% Custom Hooks Layer
    CHAT_INTERFACE --> USE_CHAT[hooks/useChat.ts]
    CHAT_INPUT --> USE_CHAT
    CHAT_HISTORY --> USE_CHAT
    SETTINGS --> USE_MOBILE[hooks/use-mobile.tsx]
    CHAT_INTERFACE --> USE_TOAST[hooks/use-toast.ts]
    
    %% Services Layer
    USE_CHAT --> OPENAI_SERVICE[services/openaiService.ts]
    USE_CHAT --> GEMINI_SERVICE[services/geminiService.ts]
    USE_CHAT --> STORAGE_SERVICE[services/storageService.ts]
    SETTINGS --> STORAGE_SERVICE
    
    %% UI Components (shadcn/ui)
    subgraph UI_COMPONENTS["UI Components (shadcn/ui)"]
        BUTTON[ui/button.tsx]
        CARD[ui/card.tsx]
        DIALOG[ui/dialog.tsx]
        INPUT[ui/input.tsx]
        TEXTAREA[ui/textarea.tsx]
        TOAST[ui/toast.tsx]
        SCROLL_AREA[ui/scroll-area.tsx]
        AVATAR[ui/avatar.tsx]
        BADGE[ui/badge.tsx]
        SEPARATOR[ui/separator.tsx]
    end
    
    %% Component Dependencies
    CHAT_INPUT --> BUTTON
    CHAT_INPUT --> TEXTAREA
    CHAT_INTERFACE --> CARD
    SETTINGS --> DIALOG
    SETTINGS --> INPUT
    MESSAGE_BUBBLE --> AVATAR
    MESSAGE_BUBBLE --> BADGE
    CHAT_HISTORY --> SCROLL_AREA
    CHAT_HISTORY --> SEPARATOR
    
    %% Utility Layer
    subgraph UTILS["Utilities"]
        UTILS_LIB[lib/utils.ts]
        TAILWIND_CONFIG[tailwind.config.ts]
        VITE_CONFIG[vite.config.ts]
    end
    
    %% External APIs
    subgraph EXTERNAL["External Services"]
        OPENAI_API[OpenAI API]
        GEMINI_API[Google Gemini API]
        LOCAL_STORAGE[Browser LocalStorage]
    end
    
    %% Service Connections
    OPENAI_SERVICE --> OPENAI_API
    GEMINI_SERVICE --> GEMINI_API
    STORAGE_SERVICE --> LOCAL_STORAGE
    
    %% Data Flow
    subgraph DATA_FLOW["Data Flow"]
        direction TB
        USER_INPUT[User Input] --> PROCESS[Process Message]
        PROCESS --> AI_CALL[AI Service Call]
        AI_CALL --> RESPONSE[AI Response]
        RESPONSE --> UPDATE_UI[Update UI]
        UPDATE_UI --> SAVE_HISTORY[Save to Storage]
    end
    
    %% Styling System
    subgraph STYLING["Styling System"]
        CSS_MAIN[index.css]
        CSS_APP[App.css]
        TAILWIND[Tailwind Classes]
    end
    
    %% Configuration Files
    subgraph CONFIG["Configuration"]
        PACKAGE[package.json]
        TSCONFIG[tsconfig.json]
        ESLINT[eslint.config.js]
        POSTCSS[postcss.config.js]
        COMPONENTS_JSON[components.json]
    end
    
    %% State Management Flow
    subgraph STATE_FLOW["State Management"]
        direction LR
        USER_ACTION[User Action] --> HOOK_UPDATE[Hook State Update]
        HOOK_UPDATE --> COMPONENT_RERENDER[Component Re-render]
        COMPONENT_RERENDER --> UI_UPDATE[UI Update]
    end
    
    %% Error Handling
    subgraph ERROR_HANDLING["Error Handling"]
        TRY_CATCH[Try/Catch Blocks]
        ERROR_BOUNDARIES[Error Boundaries]
        TOAST_NOTIFICATIONS[Toast Notifications]
    end
    
    %% Component Lifecycle
    subgraph LIFECYCLE["Component Lifecycle"]
        MOUNT[Component Mount]
        UPDATE[State Update]
        UNMOUNT[Component Unmount]
        CLEANUP[Cleanup Effects]
    end
    
    %% Styling
    classDef entryPoint fill:#e1f5fe
    classDef component fill:#f3e5f5
    classDef hook fill:#e8f5e8
    classDef service fill:#fff3e0
    classDef ui fill:#fce4ec
    classDef external fill:#ffebee
    classDef config fill:#f1f8e9
    
    class HTML,MAIN,APP entryPoint
    class CHAT_APP,INDEX,NOT_FOUND,CHAT_INTERFACE,CHAT_HISTORY,CHAT_INPUT,SETTINGS,MESSAGE_BUBBLE,CODE_BLOCK component
    class USE_CHAT,USE_MOBILE,USE_TOAST hook
    class OPENAI_SERVICE,GEMINI_SERVICE,STORAGE_SERVICE service
    class BUTTON,CARD,DIALOG,INPUT,TEXTAREA,TOAST,SCROLL_AREA,AVATAR,BADGE,SEPARATOR ui
    class OPENAI_API,GEMINI_API,LOCAL_STORAGE external
    class PACKAGE,TSCONFIG,ESLINT,POSTCSS,COMPONENTS_JSON,TAILWIND_CONFIG,VITE_CONFIG config

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Hooks (useState, useReducer)
- **AI Services**: OpenAI GPT, Google Gemini
- **Storage**: Browser LocalStorage
- **Linting**: ESLint with TypeScript support

## 📋 Prerequisites

- Node.js 18+ and npm
- API keys for OpenAI and/or Google Gemini

## 🚀 Quick Start

### 1. Create and Setup Project

```bash
# Create new Vite project
npm create vite@latest my-app -- --template react-ts
cd my-app

# Install dependencies
npm install

# Add Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Add utilities
npm install clsx tailwind-merge
npm install -D @types/node

# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add all UI components
npx shadcn-ui@latest add accordion alert-dialog alert aspect-ratio avatar badge breadcrumb button calendar card carousel chart checkbox collapsible command context-menu dialog drawer dropdown-menu form hover-card input input-otp label menubar navigation-menu pagination popover progress radio-group resizable scroll-area select separator sheet sidebar skeleton slider sonner switch table tabs textarea toast toggle-group toggle tooltip
```

### 2. Create Directory Structure

```bash
# Create directories
mkdir -p src/{components/ui,hooks,lib,pages,services}

# Create component files
touch src/components/{ChatHistory,ChatInput,ChatInterface,CodeBlock,MessageBubble,SettingsDialog}.tsx

# Create hook files
touch src/hooks/{use-mobile,useChat}.tsx src/hooks/use-toast.ts

# Create utility files
touch src/lib/utils.ts

# Create page files
touch src/pages/{ChatApp,Index,NotFound}.tsx

# Create service files
touch src/services/{geminiService,openaiService,storageService}.ts
```

### 3. Start Development

```bash
npm run dev
```

## 🔧 Component Architecture

### Core Components

#### `ChatInterface.tsx`
Main container component that orchestrates the entire chat experience:
- Manages layout structure
- Coordinates between ChatHistory and ChatInput
- Handles settings integration

#### `ChatHistory.tsx`
Displays the conversation history:
- Renders message list with infinite scroll
- Manages message grouping and timestamps
- Handles loading states and empty states

#### `ChatInput.tsx`
Message input interface:
- Multi-line text input with auto-resize
- Send button with loading states
- File attachment support (future enhancement)

#### `MessageBubble.tsx`
Individual message display:
- User vs AI message styling
- Code syntax highlighting integration
- Copy message functionality
- Timestamp display

#### `CodeBlock.tsx`
Syntax-highlighted code display:
- Multiple language support
- Copy to clipboard functionality
- Line numbering
- Theme switching support

#### `SettingsDialog.tsx`
Application configuration:
- AI provider selection
- API key management
- Theme preferences
- Chat history management

### Custom Hooks

#### `useChat.ts`
Central chat state management:
```typescript
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentProvider: 'openai' | 'gemini';
  apiKeys: Record<string, string>;
}

// Key functions:
- sendMessage(content: string)
- clearHistory()
- switchProvider(provider: string)
- loadHistory()
- saveHistory()
```

#### `use-mobile.tsx`
Responsive design hook:
- Detects mobile/desktop viewport
- Provides responsive behavior logic
- Handles touch vs mouse interactions

#### `use-toast.ts`
Toast notification system:
- Success/error message display
- Auto-dismiss functionality
- Queue management for multiple toasts

### Services Layer

#### `openaiService.ts`
OpenAI integration:
```typescript
class OpenAIService {
  async generateResponse(prompt: string): Promise<string>
  async generateStreamResponse(prompt: string): Promise<ReadableStream>
  validateApiKey(): Promise<boolean>
}
```

#### `geminiService.ts`
Google Gemini integration:
```typescript
class GeminiService {
  async generateResponse(prompt: string): Promise<string>
  async generateStreamResponse(prompt: string): Promise<ReadableStream>
  validateApiKey(): Promise<boolean>
}
```

#### `storageService.ts`
Local storage management:
```typescript
class StorageService {
  setItem<T>(key: string, value: T): void
  getItem<T>(key: string): T | null
  removeItem(key: string): void
  clear(): void
}
```

## 🔄 Application Flow

### 1. Application Initialization
```
main.tsx → App.tsx → ChatApp.tsx → ChatInterface.tsx
```

### 2. Message Flow
```
User Input (ChatInput) → useChat Hook → AI Service → Response → ChatHistory Update
```

### 3. Settings Flow
```
SettingsDialog → StorageService → useChat Hook → Service Reconfiguration
```

### 4. State Management Flow
```
User Action → Hook State Update → Component Re-render → UI Update
```

## 🎨 Styling System

### Tailwind Configuration
- Custom color palette for chat themes
- Responsive breakpoints for mobile/desktop
- Dark/light mode support
- Custom animations for message transitions

### Component Styling
- Consistent spacing using Tailwind spacing scale
- Semantic color usage (primary, secondary, accent)
- Responsive typography scale
- Accessible contrast ratios

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- Touch-friendly button sizes (min 44px)
- Optimized keyboard interaction
- Gesture support for navigation
- Reduced animation for performance

## 🔐 Security Considerations

### API Key Management
- Client-side storage only (for demo purposes)
- Input validation for API keys
- Error handling for invalid credentials

### Data Privacy
- No server-side data storage
- Local-only chat history
- Clear data functionality

## 🧪 Testing Strategy

### Unit Tests
- Component rendering tests
- Hook behavior tests
- Service integration tests
- Utility function tests

### Integration Tests
- Complete user flows
- API service mocking
- Storage persistence tests

### E2E Tests
- Full application workflows
- Cross-browser compatibility
- Mobile responsiveness

## 📦 Build and Deployment

### Development Build
```bash
npm run dev          # Start development server
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
```

### Production Build
```bash
npm run build        # Create production build
npm run preview      # Preview production build
```

### Deployment Options
- **Vercel**: Optimized for Vite projects
- **Netlify**: Static site deployment
- **GitHub Pages**: Free hosting option
- **Docker**: Containerized deployment

## 🔮 Future Enhancements

### Features Roadmap
- [ ] Real-time streaming responses
- [ ] File upload and analysis
- [ ] Voice input/output
- [ ] Multiple conversation threads
- [ ] Export chat history
- [ ] Custom AI model parameters
- [ ] Plugin system for extensions
- [ ] Collaborative chat rooms
- [ ] Advanced code execution
- [ ] Integration with external APIs

### Technical Improvements
- [ ] Service worker for offline support
- [ ] Progressive Web App (PWA)
- [ ] Advanced caching strategies
- [ ] Performance monitoring
- [ ] Automated testing pipeline
- [ ] Accessibility enhancements
- [ ] Internationalization (i18n)

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Code Standards
- TypeScript strict mode
- ESLint configuration compliance
- Consistent component patterns
- Comprehensive documentation

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation update
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Tailwind CSS](https://tailwindcss.com/) for styling system
- [Vite](https://vitejs.dev/) for build tooling
- [React](https://reactjs.org/) for the framework
- OpenAI and Google for AI services



---

**Happy Coding! 🚀**