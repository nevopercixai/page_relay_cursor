# PageRelay Configuration Guide

## Overview

PageRelay now supports selective data collection based on a JSON configuration file. The extension only collects data from configured websites and extracts only the specified fields.

## Configuration File

The configuration is stored in `config.json` at the root of the extension directory.

## Configuration Structure

```json
{
  "websites": [
    {
      "urlPattern": "*://forms.google.com/*",
      "pages": [
        {
          "pathPattern": "/d/*/viewform",
          "fields": [
            {
              "name": "formTitle",
              "selector": "h1",
              "type": "text"
            },
            {
              "name": "emailInput",
              "selector": "input[type='email']",
              "type": "value"
            }
          ]
        }
      ]
    }
  ]
}
```

## URL Pattern Matching

- Supports wildcards: `*` matches any characters
- Examples:
  - `*://forms.google.com/*` - Matches all Google Forms
  - `*://example.com/*` - Matches all pages on example.com
  - `https://example.com/*` - Matches only HTTPS pages on example.com

## Path Pattern Matching

- Supports wildcards: `*` matches any path segment
- Examples:
  - `/d/*/viewform` - Matches `/d/123/viewform`, `/d/abc/viewform`, etc.
  - `/contact` - Exact match
  - `/*/details` - Matches any path ending in `/details`

## Field Types

### `text`
Extracts the text content of the element.

```json
{
  "name": "formTitle",
  "selector": "h1",
  "type": "text"
}
```

### `value`
Extracts the value attribute or input value.

```json
{
  "name": "emailInput",
  "selector": "input[type='email']",
  "type": "value"
}
```

### `html`
Extracts the innerHTML or outerHTML of the element.

```json
{
  "name": "contactForm",
  "selector": "form",
  "type": "html"
}
```

### `attribute`
Extracts a specific attribute value. Requires `attribute` property.

```json
{
  "name": "imageSrc",
  "selector": "img",
  "type": "attribute",
  "attribute": "src"
}
```

### `href`
Extracts the href attribute (for links).

```json
{
  "name": "linkUrl",
  "selector": "a.important-link",
  "type": "href"
}
```

## Field Properties

- **name** (required): The field name used as JSON key in the output
- **selector** (required): CSS selector to find the element
- **type** (required): One of: `text`, `value`, `html`, `attribute`, `href`
- **attribute** (optional): Required if `type` is `attribute`
- **default** (optional): Default value if element not found or extraction fails

## Output Format

The extension sends JSON with:
- Always included: `url` and `timestamp`
- Custom fields: Based on field names from config

Example output:
```json
{
  "url": "https://forms.google.com/d/123/viewform",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "formTitle": "Contact Form",
  "emailInput": "user@example.com",
  "formDescription": "Please fill out this form"
}
```

## Behavior

- **If page matches config**: Data is collected and sent to backend
- **If page doesn't match**: Extension does nothing (silent, no data sent)
- **If config.json missing**: Extension logs warning but doesn't crash
- **If field not found**: Uses default value or empty string

## Example Configuration

```json
{
  "websites": [
    {
      "urlPattern": "*://forms.google.com/*",
      "pages": [
        {
          "pathPattern": "/d/*/viewform",
          "fields": [
            {
              "name": "formTitle",
              "selector": "h1",
              "type": "text",
              "default": ""
            },
            {
              "name": "emailInput",
              "selector": "input[type='email']",
              "type": "value",
              "default": ""
            }
          ]
        }
      ]
    },
    {
      "urlPattern": "*://example.com/*",
      "pages": [
        {
          "pathPattern": "/contact",
          "fields": [
            {
              "name": "pageTitle",
              "selector": "title",
              "type": "text"
            },
            {
              "name": "contactForm",
              "selector": "form",
              "type": "html"
            }
          ]
        }
      ]
    }
  ]
}
```

## Testing

1. Edit `config.json` with your website patterns and fields
2. Reload the extension in Chrome (`chrome://extensions/`)
3. Visit a matching website
4. Check backend logs for JSON data with field names

