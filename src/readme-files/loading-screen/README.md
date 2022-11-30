# Customizable Loading-Screen
With the reactUI it is possible to customize the loading-screen which is visible on startup, by editing the index.html file in the public directory.

## Getting Started
Add a span with the id: "custom-loading-screen" and add style="visibility: hidden;".


```html
    <span 
      id="custom-loading-screen"
      style="visibility: hidden;"></span>
```

## Available Properties/Attributes
There are multiple properties whcih can be added to the span as attribute, which customize the loading-screen:

### Elements
Attribute | Description
--- | --- |
loading-image | Replaces the default Loading-Screen image. Set the path to the image in the public directory.
loading-spinner | Replaces the default Loading-Screen spinner. Set the path to the spinner in the public directory.
loading-text | Text to display in the Loading-Screen.
loading-order | The order of which the elements are being displayed, even if not everything is used, use all 3 elements. Default: "image spinner text"

### Positioning
Available values are based on vertical and horizontal keywords. 

**vertical:** 
- top 
- center 
- bottom
      
**horizontal:** 
- left 
- center 
- bottom

Vertical and horizontal values can be combined like: "top left" or "bottom center", also it's possible to only use one keyword.
Whether this is a vertical or horizontal keyword, the other one will automatically be "center".

Attribute | Description
--- | --- |
loading-image-position | The place where the image will be placed.
loading-spinner-position | The place where the spinner will be placed.
loading-text-position | The place where the text will be placed.

### Style
The style can be entered either in a JSON string format with CSS properties in them or just as string.

If JSON.parse can't parse the string, the string will be used as background variable.

Attribute | Description
--- | --- |
loading-background-style | The style for the background of the loading-screen.
loading-image-style | The style for the image.
loading-spinner-style | The style for the spinner.
loading-text-style | The style for the text.

### HTML
Attribute | Description
--- | --- |
loading-html | A custom HTML page can also be displayed. Add the path to the HTML file in the public directory.

### Removing
Attribute | Description
--- | --- |
loading-image-disabled | Removes the Loading-Screen image.
loading-spinner-disabled | Removes the Loading-screen spinner.

## Exmaple
This example will show how to use the attributes to create a customized loading-screen.

### Before (Default)
![loading-screen-before](../../readme-imgs/loading-screen-before.PNG)

### After
![loading-screen-after](../../readme-imgs/loading-screen-after.PNG)

```html
    <span 
      id="custom-loading-screen"
      loading-image="assets/loading_screen_image.png"
      loading-spinner="assets/loading_screen_spinner.gif"
      loading-text="This is the loading-text"
      loading-order="image spinner text"
      loading-image-position="center"
      loading-spinner-position="center"
      loading-text-position="center"
      loading-background-style='{"background":"linear-gradient(135deg, #e1e1e1 25%, transparent 25%) -50px 0, linear-gradient(225deg, #e1e1e1 25%, transparent 25%) -50px 0, linear-gradient(315deg, #e1e1e1 25%, transparent 25%), linear-gradient(45deg, #e1e1e1 25%, transparent 25%)", "background-size":"100px 100px", "background-color":"#cfd8dc"}'
      loading-image-style='{"width": "300px"}'
      loading-spinner-style='{"margin-top": "0.5rem"}'
      loading-text-style='{"margin-top": "1.5rem"}'
      style="visibility: hidden;"></span>
```