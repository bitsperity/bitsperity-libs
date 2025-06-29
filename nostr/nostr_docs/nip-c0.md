# NIP-C0: Code Snippets

## Meta
- **Status**: Draft, Optional
- **Category**: Development/Code Sharing
- **Required**: No
- **Purpose**: Specialized events for sharing code snippets

## Summary
Defines kind 1337 events for code snippets with specialized metadata including programming language, file extensions, dependencies, and runtime information. Enhances code sharing with proper syntax highlighting and execution context.

## Core Concepts
- **Code-Specific**: Designed specifically for code sharing
- **Rich Metadata**: Language, runtime, dependencies, licensing
- **Syntax Highlighting**: Language information for proper display
- **Execution Context**: Runtime and dependency specifications
- **Attribution**: Repository and licensing information

## Implementation Details
### Code Event (1337)
- Content field contains actual code
- Multiple optional tags for code metadata
- Language specification for syntax highlighting
- File naming and extension information

### Metadata Tags
- `l`: Programming language (lowercase)
- `name`: Snippet name/filename
- `extension`: File extension (without dot)
- `description`: Code functionality description
- `runtime`: Runtime/environment specification
- `license`: Code license (MIT, GPL, etc.)
- `dep`: Dependencies (repeatable)
- `repo`: Source repository reference

### Client Features
- Syntax highlighting based on language
- One-click code copying
- Proper formatting with whitespace preservation
- Runtime environment information
- Optional code execution capabilities

## Use Cases
- **Code Education**: Teaching programming concepts
- **Snippet Libraries**: Reusable code collections
- **Technical Documentation**: Code examples and tutorials
- **Open Source**: Code sharing with proper attribution
- **Development Tools**: IDE-like code sharing features

## Related NIPs
- Code sharing and development tool integration
- Software license and attribution standards 