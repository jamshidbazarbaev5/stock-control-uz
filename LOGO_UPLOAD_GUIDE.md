# Logo Upload and Resize Feature Guide

## Overview

The Receipt Designer now supports direct logo image uploads with interactive resizing capabilities, replacing the previous text-based URL input system. This makes the editor more professional and user-friendly.

## New Features

### 1. Direct Image Upload
- Click on the logo placeholder to upload an image
- Supports JPG, PNG, GIF, and WEBP formats
- Maximum file size: 5MB
- Automatic validation with user-friendly error messages

### 2. Interactive Resizing
- Drag the blue resize handle (bottom-right corner) to adjust logo size
- Real-time visual feedback during resize
- Minimum width: 50px, Maximum width: 400px
- Width indicator shows current dimensions on hover

### 3. Enhanced User Experience
- Beautiful gradient upload placeholder
- Change image button overlay for existing logos
- Hover effects and visual feedback
- Smooth animations and transitions

## How to Use

### Uploading a Logo
1. Navigate to the Receipt Designer
2. Find the logo component in the preview area
3. Click on the blue upload placeholder that says "Click to Upload Logo"
4. Select your image file from the file dialog
5. The image will be automatically converted to Base64 and displayed

### Changing an Existing Logo
1. Hover over an existing logo in edit mode
2. Click the blue upload button (📤) in the top-right corner
3. Select a new image file

### Resizing the Logo
1. Hover over the logo in edit mode
2. A blue border will appear around the image
3. Drag the blue resize handle (circle) at the bottom-right corner
4. The width indicator will show current dimensions
5. Release to apply the new size

### Fine-tuning Width
- Use the "Width" input field in the Designer Controls panel for precise measurements
- Enter values like "120px", "150px", etc.

## Technical Details

### File Processing
- Images are converted to Base64 data URLs for embedding
- No external server storage required
- Images are included directly in the template JSON

### Print Output
- Base64 images are properly rendered in thermal printer output
- Falls back to text logo if no image is provided
- Maintains aspect ratio in print format

### Browser Compatibility
- Works in all modern browsers
- Uses FileReader API for image processing
- Drag and drop functionality uses standard mouse events

## Code Changes Made

### 1. Enhanced ReceiptDesigner.tsx
- Updated `handleUpdateComponent` to handle both data and style updates
- More flexible component update system

### 2. Improved ReceiptPreview.tsx
- Added `ResizableImage` component for interactive resizing
- Enhanced upload placeholder design
- Better visual feedback and hover states
- File validation and error handling

### 3. Simplified DesignerControls.tsx
- Removed redundant logo URL input field
- Users now upload directly from preview area

### 4. Updated thermalPrinter.ts
- Enhanced logo rendering to handle both images and text fallback
- Proper Base64 image embedding in print output

## Troubleshooting

### Image Not Appearing
- Check file size (must be under 5MB)
- Ensure file format is supported (JPG, PNG, GIF, WEBP)
- Try refreshing the browser

### Resize Handle Not Visible
- Make sure you're not in preview mode
- Hover over the logo to see the resize handle
- The handle appears as a small blue circle

### Print Issues
- Base64 images should print correctly on thermal printers
- If image doesn't print, check printer compatibility with image formats

## Future Enhancements

Potential improvements for future versions:
- Image crop/editing functionality
- Multiple logo support
- Image compression options
- Cloud storage integration
- Logo library/templates

## Support

For issues or questions about the logo upload feature, please refer to the main project documentation or create an issue in the project repository.