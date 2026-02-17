

## Enhance Presentation Visuals and Diagrams

### Problem
The current presentations only include structured visuals on "roughly half" of content slides, and the visuals generated often lack relevance to the actual slide content. This makes presentations feel text-heavy and indistinguishable from study plans.

### Changes

#### 1. Backend -- Strengthen Visual Prompting (`supabase/functions/generate-presentation/index.ts`)

- Change the visual instruction from "roughly half of content slides" to **"every content slide MUST include a visual"**
- Add a strict relevance rule: "The visual MUST directly illustrate the slide's topic -- never use a generic or placeholder visual"
- Add **two new visual types** to give the AI more options:
  - `"cause-effect"` -- for showing cause-and-effect chains (e.g., pollution causes, effects of gravity)
  - `"labeled-diagram"` -- for labeled part diagrams (e.g., parts of a cell, layers of the atmosphere) with a title and labeled items with descriptions
- Add explicit guidance per visual type on when to use each (e.g., "Use timeline for historical events, use comparison for contrasting two concepts, use labeled-diagram for anatomy or structure topics")

#### 2. Frontend -- Add New Visual Renderers (`src/components/study-plan/SlideViewer.tsx`)

- Add a `CauseEffectRenderer` -- displays a chain of cause-to-effect items with arrows connecting them vertically
- Add a `LabeledDiagramRenderer` -- displays a central title with labeled items arranged around it, each with a short description
- Both renderers will use the existing styling patterns (rounded cards, primary colors, backdrop blur) for visual consistency

### Technical Details

**New visual type interfaces:**

```text
SlideVisualCauseEffect {
  type: "cause-effect"
  items: { cause: string, effect: string }[]
}

SlideVisualLabeledDiagram {
  type: "labeled-diagram"
  title: string
  parts: { name: string, description: string }[]
}
```

**Updated prompt snippet:**

```text
VISUAL RULES:
- Every "content" slide MUST include exactly one visual object.
- The visual MUST directly illustrate the specific topic of that slide.
- Choose the most appropriate visual type:
  - comparison: for contrasting two concepts, organisms, events, etc.
  - timeline: for chronological events or historical sequences
  - diagram: for concept webs, relationships between ideas
  - stats: for numerical data, percentages, measurements
  - steps: for processes, procedures, sequences of actions
  - cause-effect: for showing causes and their results
  - labeled-diagram: for anatomy, structure, or parts of a system
- Do NOT reuse the same visual type on consecutive slides.
```

### Expected Result
- Every content slide will have a relevant, topic-specific visual element
- More visual variety (7 types instead of 5) prevents repetitive layouts
- Presentations will feel significantly more visual and distinct from text-based study plans
