# Chomp UI Component Style Guide

This style guide documents the standardized UI components used throughout the Chomp application. It provides guidelines for consistent usage, styling, and behavior of components.

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Components](#components)
   - [Buttons](#buttons)
   - [Forms](#forms)
   - [Cards](#cards)
   - [Modals](#modals)
   - [Feedback](#feedback)
   - [Loaders](#loaders)
   - [Pagination](#pagination)
6. [Best Practices](#best-practices)

## Design Principles

The Chomp UI is built on the following principles:

- **Consistency**: Use standardized components to maintain a consistent look and feel.
- **Accessibility**: Ensure all components are accessible to users with disabilities.
- **Responsiveness**: Design components to work well on all device sizes.
- **Simplicity**: Keep components simple and focused on their primary purpose.
- **Reusability**: Create components that can be reused across the application.

## Color Palette

### Primary Colors

- **Primary**: `#FF5A5F` - Used for primary actions, links, and emphasis
- **Secondary**: `#484848` - Used for secondary actions and text
- **Background**: `#FFFFFF` - Main background color
- **Text**: `#333333` - Primary text color

### Semantic Colors

- **Success**: `#2E8540` - Used for success messages and actions
- **Warning**: `#AD5700` - Used for warning messages and actions
- **Error**: `#E31C3D` - Used for error messages and actions
- **Info**: `#0050B3` - Used for informational messages and actions

### Neutral Colors

- **Gray-100**: `#F5F5F5` - Lightest gray, used for backgrounds
- **Gray-200**: `#EEEEEE` - Used for dividers and borders
- **Gray-300**: `#DBDBDB` - Used for borders and disabled states
- **Gray-400**: `#CCCCCC` - Used for disabled text
- **Gray-500**: `#767676` - Used for secondary text
- **Gray-600**: `#484848` - Used for primary text

## Typography

### Font Family

- **Primary Font**: System font stack
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  ```

### Font Sizes

- **XS**: `0.75rem` (12px) - Used for small labels and captions
- **SM**: `0.875rem` (14px) - Used for secondary text and small components
- **MD**: `1rem` (16px) - Base font size, used for body text
- **LG**: `1.125rem` (18px) - Used for section headings
- **XL**: `1.25rem` (20px) - Used for page headings
- **2XL**: `1.5rem` (24px) - Used for major headings

### Font Weights

- **Regular**: `400` - Used for body text
- **Medium**: `500` - Used for emphasis and labels
- **Bold**: `600` - Used for headings and important text

## Spacing

Chomp uses a consistent spacing scale to maintain visual harmony:

- **XS**: `0.25rem` (4px)
- **SM**: `0.5rem` (8px)
- **MD**: `1rem` (16px)
- **LG**: `1.5rem` (24px)
- **XL**: `2rem` (32px)
- **2XL**: `3rem` (48px)

## Components

### Buttons

Buttons are used for actions and navigation. They come in different variants and sizes.

#### Variants

- **Primary**: Used for primary actions
- **Secondary**: Used for secondary actions
- **Outline**: Used for less prominent actions
- **Text**: Used for the least prominent actions
- **Danger**: Used for destructive actions
- **Success**: Used for positive actions

#### Sizes

- **Small (sm)**: Compact size for tight spaces
- **Medium (md)**: Default size for most contexts
- **Large (lg)**: Larger size for emphasis

#### Usage

```jsx
import { Button, IconButton } from '@/components/common';

// Primary button
<Button>Click Me</Button>

// Secondary button with custom size
<Button variant="secondary" size="lg">Secondary Action</Button>

// Disabled button
<Button disabled>Disabled</Button>

// Loading button
<Button isLoading>Loading</Button>

// Full width button
<Button fullWidth>Full Width</Button>

// Icon button
<IconButton icon={<SomeIcon />}>With Icon</IconButton>

// Icon-only button
<IconButton icon={<SomeIcon />} iconOnly>Icon Only</IconButton>
```

### Forms

Forms are used for user input. They include various input components and validation.

#### Components

- **Form**: Container for form elements
- **Input**: Text input field
- **Textarea**: Multi-line text input
- **Select**: Dropdown selection
- **Checkbox**: Boolean input
- **Radio**: Single selection from multiple options

#### Usage

```jsx
import { Form, Input } from '@/components/common';

<Form onSubmit={handleSubmit}>
  <Input
    name="username"
    label="Username"
    placeholder="Enter your username"
    value={username}
    onChange={handleChange}
    required
  />
  
  <Input
    name="password"
    type="password"
    label="Password"
    value={password}
    onChange={handleChange}
    required
    error={errors.password}
    helperText="Must be at least 8 characters"
  />
  
  <Button type="submit">Submit</Button>
</Form>
```

### Cards

Cards are used to group related content and actions.

#### Variants

- **Default**: Standard card with subtle border
- **Outlined**: Card with more prominent border
- **Elevated**: Card with shadow for emphasis

#### Usage

```jsx
import { Card } from '@/components/common';

// Basic card
<Card>
  <p>Card content</p>
</Card>

// Card with title
<Card title="Card Title">
  <p>Card content</p>
</Card>

// Card with custom header and footer
<Card
  header={<div>Custom Header</div>}
  footer={<Button>Action</Button>}
>
  <p>Card content</p>
</Card>

// Interactive card
<Card
  hoverable
  clickable
  onClick={handleClick}
>
  <p>Clickable card</p>
</Card>
```

### Modals

Modals are used for focused interactions that require user attention.

#### Sizes

- **Small (sm)**: For simple messages or confirmations
- **Medium (md)**: Default size for most content
- **Large (lg)**: For complex forms or detailed content
- **Extra Large (xl)**: For content that requires more space
- **Full**: Full-screen modal for immersive experiences

#### Usage

```jsx
import { Modal, Button } from '@/components/common';
import { useState } from 'react';

function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        footer={
          <div>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm}>Confirm</Button>
          </div>
        }
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

### Feedback

Feedback components are used to communicate the status of an action or process to the user.

#### Components

- **Alert**: Used for important messages
- **Toast**: Used for temporary notifications

#### Alert Variants

- **Info**: For general information
- **Success**: For successful operations
- **Warning**: For potential issues
- **Error**: For errors and failures

#### Usage

```jsx
import { Alert } from '@/components/common';

// Info alert
<Alert>This is an informational message</Alert>

// Success alert with title
<Alert variant="success" title="Success!">
  Your changes have been saved.
</Alert>

// Warning alert
<Alert variant="warning">
  This action cannot be undone.
</Alert>

// Error alert with dismiss button
<Alert 
  variant="error" 
  dismissible 
  onDismiss={handleDismiss}
>
  An error occurred while saving your changes.
</Alert>
```

### Loaders

Loaders are used to indicate that content is being loaded or an action is in progress.

#### Components

- **Spinner**: Animated loading indicator

#### Sizes

- **Small (sm)**: For inline or small components
- **Medium (md)**: Default size for most contexts
- **Large (lg)**: For page-level loading

#### Usage

```jsx
import { Spinner } from '@/components/common';

// Default spinner
<Spinner />

// Large spinner with custom variant
<Spinner size="lg" variant="secondary" />

// Full-page spinner
<Spinner fullPage />
```

### Pagination

Pagination is used for navigating through multi-page content.

#### Usage

```jsx
import { Pagination } from '@/components/common';
import { useState } from 'react';

function PaginationExample() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;
  
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  );
}
```

## Best Practices

### Component Usage

1. **Use standardized components**: Always use the standardized components from the common directory instead of creating custom ones.

2. **Follow naming conventions**: Use PascalCase for component names and camelCase for props.

3. **Provide meaningful props**: Use descriptive prop names and provide appropriate default values.

4. **Handle loading and error states**: Always account for loading and error states in your components.

5. **Maintain accessibility**: Ensure all components are accessible by using appropriate ARIA attributes and semantic HTML.

### Styling

1. **Use the component's built-in styling options**: Customize components using their props rather than applying custom styles.

2. **Follow the spacing scale**: Use the defined spacing values for margins and padding.

3. **Maintain color consistency**: Use the defined color palette for all UI elements.

4. **Responsive design**: Ensure components work well on all screen sizes.

### Performance

1. **Memoize components**: Use React.memo for components that don't need frequent re-renders.

2. **Optimize event handlers**: Use useCallback for event handlers to prevent unnecessary re-renders.

3. **Lazy load components**: Use React.lazy and Suspense for components that aren't immediately needed.

### Testing

1. **Write unit tests**: Test each component in isolation to ensure it behaves as expected.

2. **Test different states**: Test components in different states (loading, error, empty, etc.).

3. **Test accessibility**: Ensure components meet accessibility standards.

4. **Test responsiveness**: Verify that components work well on different screen sizes.

---

This style guide is a living document and will be updated as the Chomp UI evolves. If you have any questions or suggestions, please contact the UI team.
