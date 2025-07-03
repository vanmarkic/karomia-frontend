# Karomia Frontend Challenge - In-Text Tagging System

A sophisticated text tagging system built with Next.js and Tiptap that allows users to highlight and tag arbitrary text ranges within documents, designed for sustainability report management.

## 🌟 Features

### Core Functionality
- **Markdown Parsing**: Converts markdown content to HTML and renders it in a rich text editor
- **Rich Text Editor**: Powered by Tiptap with support for basic formatting (bold, italic, links, etc.)
- **Text Selection & Tagging**: Select any text and create custom tags with names and colors
- **Multiple Tag Support**: Apply multiple tags to the same text selection
- **Overlapping Tags**: Support for hierarchical and overlapping tag scenarios
- **Tag Highlighting**: Click to highlight all instances of a specific tag throughout the document
- **Tag Management**: Full CRUD operations for tags with a dedicated management panel

### Technical Features
- **Static Site Generation**: Fully static export ready for GitHub Pages deployment
- **Responsive Design**: Modern, clean UI that works on desktop screens
- **TypeScript**: Full type safety throughout the application
- **Performance Optimized**: Efficient tagging system that doesn't affect editor performance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd karomia-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
# Build static export
npm run build

# Serve locally to test
npm run start
```

## 📖 How to Use

### Creating Tags
1. **Select Text**: Highlight any text in the editor by clicking and dragging
2. **Tag Dialog Opens**: A dialog automatically appears when you release the mouse
3. **Choose Option**: 
   - **Assign Existing Tag**: Click any existing tag from the grid to apply it instantly
   - **Create New Tag**: Enter a name, choose a color, and preview the result
4. **Apply**: The tag is immediately applied to your selection

### Managing Tags
- **View All Tags**: The right sidebar shows all created tags with color indicators
- **Highlight All Occurrences**: Click the eye icon to highlight ALL instances of that tag throughout the document
- **Visual Feedback**: Highlighted tags get enhanced background, borders, and pulsing animation
- **Clear Indicators**: The tag list shows which tags are currently highlighted
- **Delete Tags**: Click the trash icon to remove a tag (also removes it from all text)

### Advanced Features
- **Overlapping Tags**: You can apply multiple tags to overlapping text ranges
- **Hierarchical Tagging**: Tags can be nested within other tagged sections
- **Existing Tags**: The system automatically detects and imports existing tags from pre-tagged content

## 🏗️ Architecture

### Component Structure
```
src/
├── components/
│   ├── TiptapEditor.tsx          # Main editor component
│   ├── TagManager.tsx            # Tag list and management
│   ├── TagCreationDialog.tsx     # Tag creation modal
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── markdown-parser.ts        # Markdown to HTML conversion
│   ├── api-data.ts              # Mock API data
│   ├── tiptap-extensions/       # Custom Tiptap extensions
│   └── utils.ts                 # Utility functions
├── types/
│   └── index.ts                 # TypeScript interfaces
└── app/
    ├── page.tsx                 # Main application page
    └── globals.css              # Global styles and animations
```

### Key Technologies
- **Next.js 14+**: React framework with static export capability
- **Tiptap**: Headless rich-text editor built on ProseMirror
- **shadcn/ui**: High-quality React component library
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Static type checking
- **Showdown**: Markdown to HTML converter

### Tagging System Design
The tagging system uses a combination of:
- **HTML Spans**: Tagged content is wrapped in `<span class="my-tag" data-tag="tagId">` elements
- **State Management**: React state tracks all tags and their properties
- **Visual Feedback**: CSS animations and styling provide clear visual indicators
- **Flexible Data Structure**: Supports multiple tags per span via space-separated tag IDs

## 🎨 UI/UX Features

### Visual Design
- **Clean, Modern Interface**: Professional appearance suitable for business use
- **Color-Coded Tags**: Each tag has a unique color for easy identification
- **Smooth Animations**: Subtle animations for highlighting and interactions
- **Responsive Layout**: Optimized for desktop with sidebar tag management

### User Experience
- **Streamlined Workflow**: Select text → Dialog opens → Choose/create tag → Done
- **One-Click Tagging**: Assign existing tags with a single click
- **Visual Feedback**: Tagged text has colored backgrounds, borders, and hover effects
- **Read-Only Content**: Document content is protected from accidental edits
- **Immediate Preview**: See exactly how tags will look before applying them

## 🚀 Deployment

### GitHub Pages (Automatic)
This project is configured for automatic deployment to GitHub Pages:

1. **Push to main branch**: Triggers automatic build and deployment
2. **GitHub Actions**: Handles the build process and static file generation
3. **Live Site**: Available at `https://[username].github.io/karomia-frontend`

### Manual Deployment
```bash
# Build static files
npm run build

# Deploy the 'out' directory to any static hosting service
```

## 🧪 Testing Scenarios

The application handles various complex tagging scenarios:

### Overlapping Tags
- Text with multiple tags applied to overlapping ranges
- Proper visual indication of all active tags
- Independent highlighting of each tag

### Hierarchical Tags
- Sentences within tagged paragraphs
- Nested tag inheritance and display
- Complex document structures

### Edge Cases
- Very long text selections
- Special characters and formatting
- Multiple simultaneous tag operations

## 🔧 Configuration

### Customization Options
- **Tag Colors**: Modify preset colors in `TagCreationDialog.tsx`
- **Styling**: Update CSS variables in `globals.css`
- **Content**: Replace mock data in `lib/api-data.ts`
- **Extensions**: Add new Tiptap extensions in `lib/tiptap-extensions/`

### Environment Variables
No environment variables are required for basic functionality.

## 📝 Requirements Fulfilled

✅ **Markdown Parsing**: Converts API markdown to HTML  
✅ **Tiptap Integration**: Rich text editor with full functionality  
✅ **Text Selection**: Intuitive text selection and tagging  
✅ **Multiple Tags**: Support for multiple tags per text range  
✅ **Overlapping Tags**: Complex tag hierarchy support  
✅ **Tag Management**: Full CRUD operations for tags  
✅ **Highlighting**: Click-to-highlight functionality  
✅ **Visual Design**: Modern, professional UI  
✅ **Performance**: Optimized for smooth operation  
✅ **Static Export**: Ready for GitHub Pages deployment  

## 🤝 Contributing

This project was built as a technical challenge for Karomia. For questions or feedback, please reach out to the development team.

## 📄 License

This project was created as part of a technical assessment for Karomia.

---

**Built with ❤️ for Karomia's sustainability mission**