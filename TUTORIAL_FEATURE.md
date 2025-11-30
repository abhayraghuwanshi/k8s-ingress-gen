# Tutorial Feature - Learn YAML Step-by-Step

## Overview

The tutorial feature provides an interactive, story-driven learning experience for creating Kubernetes YAML configurations. Users are guided through building a complete deployment step-by-step, with real-time YAML preview.

## Features

### 1. Step-by-Step Progression
- Each step focuses on ONE Kubernetes resource
- Users must complete current step before moving to next
- Progress bar shows overall completion
- Visual step indicators at bottom

### 2. Interactive Learning
- Simple form fields with only essential information
- Help text and examples for each field
- Tips and explanations for each resource type
- Real-time validation before proceeding

### 3. Live YAML Preview
- Right panel shows YAML building up as you complete steps
- Copy and download functionality
- Monaco editor with syntax highlighting
- Shows cumulative YAML from all completed steps

### 4. Tutorial Scenarios

#### Simple Web App (Current)
Teaches the basic flow: Deployment → Service → Ingress

**Step 1: Create a Deployment**
- Deployment name
- Container name and image
- Number of replicas
- Container port

**Step 2: Create a Service**
- Service name and type
- Port mapping
- Automatic selector linking to deployment

**Step 3: Create an Ingress**
- Domain name configuration
- Path routing
- Backend service linking
- Optional TLS/HTTPS

## File Structure

```
src/
├── types/
│   └── tutorial.ts                    # TypeScript types for tutorial system
├── utils/
│   └── tutorialScenarios.ts           # Tutorial scenario definitions
├── components/
│   └── tutorial/
│       ├── StoryScreen.tsx            # Main tutorial container
│       ├── StepForm.tsx               # Dynamic form renderer
│       └── YamlPreview.tsx            # Live YAML preview panel
└── pages/
    └── Tutorial.tsx                   # Tutorial page route
```

## How It Works

### 1. Scenario Definition
Each tutorial scenario is defined in `tutorialScenarios.ts` with:
- Title, description, estimated duration
- Array of steps (each representing a K8s resource)
- Field definitions for each step

### 2. Tutorial State Management
The `StoryScreen` component manages:
- Current step index
- Completed steps (Set)
- Form data for all steps
- Validation state

### 3. Field Types Supported
- `text` - String input
- `number` - Numeric input
- `select` - Dropdown selection
- `toggle` - Boolean switch
- `keyvalue` - Key-value pairs (future)

### 4. Validation
Each field has:
- `required` flag
- Help text with examples
- Type-specific validation
- User can only proceed when all required fields are filled

### 5. YAML Generation
The `YamlPreview` component:
- Reads form data from all steps
- Generates appropriate YAML for each resource type
- Combines with `---` separator
- Updates in real-time as user types

## Adding New Tutorial Scenarios

To add a new tutorial scenario:

1. Define the scenario in `tutorialScenarios.ts`:

```typescript
export const myNewScenario: TutorialScenarioDefinition = {
  id: 'my-scenario',
  title: 'My Tutorial',
  description: 'Learn something new',
  duration: '10 minutes',
  steps: [
    {
      id: 'step-1',
      title: 'Step 1: ...',
      description: '...',
      resourceType: 'deployment',
      explanation: 'What this resource does...',
      tips: ['Tip 1', 'Tip 2'],
      fields: [
        {
          name: 'fieldName',
          label: 'Display Label',
          type: 'text',
          required: true,
          helpText: 'Help text here',
          example: 'Example value'
        }
      ]
    }
  ]
};
```

2. Add YAML generation logic in `YamlPreview.tsx` if using new resource types

3. Export the scenario from `tutorialScenarios.ts`

## Usage

### For Users
1. Click "Learn YAML" button in main UI
2. Follow step-by-step instructions
3. Fill in required fields
4. Watch YAML build up in real-time
5. Click "Complete & Build" to finish

### For Developers
Import and use the tutorial components:

```typescript
import StoryScreen from '@/components/tutorial/StoryScreen';

function MyPage() {
  return <StoryScreen />;
}
```

## Future Enhancements

### Potential Features
1. More tutorial scenarios:
   - API with Database (ConfigMap, Secret, StatefulSet)
   - Microservices Architecture
   - Job and CronJob workflows

2. Interactive diagram integration
   - Show visual representation alongside form
   - Highlight connections between resources

3. Validation improvements
   - Real-time field validation
   - Better error messages
   - Suggest fixes for common mistakes

4. Save and resume
   - Save progress to localStorage
   - Resume incomplete tutorials

5. Export to builder
   - Import tutorial result into main diagram builder
   - Continue editing in visual mode

## Design Principles

1. **Progressive Disclosure**: Show only what's needed for current step
2. **Learning by Doing**: Users fill forms and see immediate YAML output
3. **Context & Examples**: Every field has help text and examples
4. **Validation First**: Can't proceed with invalid data
5. **Visual Feedback**: Progress indicators, completion states
6. **Escape Hatch**: Can exit tutorial anytime

## Technical Notes

- Uses React Hook Form principles but with custom state management
- Real-time YAML generation without network calls
- Monaco editor for professional YAML viewing
- Responsive design with Tailwind CSS
- TypeScript for type safety
- shadcn/ui components for consistent UI
