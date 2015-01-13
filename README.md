# canvas_react_i18n

Write HTML markup inside a special `<Text />` React component and it will be used as `defaultValue` to a translated phrase, with wrappers automatically extracted. Best described with an example.

This JSX:

```javascript
<Text key="greeting">
    <p>Hello World!</p>
</Text>
```

Compiles into something like this:

```javascript
<div dangerouslySetInnerHTML={
    {
        __html: (function() {
            var wrapper = {
                "*": "<p>$1</p>"
            };

            return I18n.t("greeting", "* Hello World! *", { "wrapper": wrapper });
        }())
    }
} />
```

The output will be more compact than the above making it ready to be injected *anywhere*. And of course, we're assuming that an `I18n` variable is in-scope. canvas_react_i18n assumes you are using [i18n-js](https://github.com/fnando/i18n-js) in conjunction with [i18nliner](https://github.com/jenseng/i18nliner-js)

See the `test/fixtures/` folder for more examples. It contains pairs of files; raw JSX inputs and their compiled outputs.

## Usage

Just require the module and use the function on a block of text; a script that contains any number of `<Text />` tags.

```javascript
/* jshint node: true */
var transform = require('canvas_react_i18n');
var fs = require('fs');

var component = fs.readFileSync('./some/jsx/component.jsx');
var transformedComponent = transform(component);

fs.writeFileSync('./some/jsx/component-transformed.jsx', transformedComponent);
```

A [sample implementation](https://github.com/amireh/canvas_react_i18n/wiki/The-Text-Component) of the `<Text />` component can be found in the Wiki.

## Internals

The transformation is done in three passes:

### Pass 1: extracting blocks

Go through the source and locate `<Text />` tags, extract the I18n phrase, any interpolation variables, and the actual markup.

### Pass 2: wrapping the markup

Scan for HTML tags, replace them with "I18n wrappers" (stuff like `*content*` and `**content**`), and build the `wrapper` set that will be injected into the `I18n.t()` directive later on.

The transformer fully supports any level of tag-nesting. An input like this is totally valid:

```html
<p>
  <span>
    Hello
    <span>%{name}!</span>
  </span>

  <a href="http://google.com">Click me!</a>

  <iframe src="%{page_url}"></iframe>
</p>
```

Output would be:

```text
*
  **
    Hello
    ***%{name}!***
  **

  ****Click me!****

  **********
*
```

The generated `"wrapper": {}` set for the example above looks something like this:

```javascript
var wrapper = {
    "*": "<p>$1</p>",
    "**": "<span>$1</span>",
    "***": "<span>$1</span>",
    "****": "<a href=\"http://google.com\">$1</a>",
    "*****": "<iframe src=\"%{page_url}\">$1</iframe>"
};
```

### Pass 3: transform

Using the extracted I18n parameters and the "wrapped" markup, we go over the source and replace the original, raw `<Text ... >...</Text>` contents with the compiled `I18n.t()` directive.

## Running tests

```bash
npm install
npm run test
```

## LICENSE

MIT
