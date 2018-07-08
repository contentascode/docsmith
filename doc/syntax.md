# Syntax

## Transclusion

### Section Transclusion

Using the **basic section transclusion** syntax `:[](file.md#some-header)`, the content of the header in `file.md` will be transcluded.

Using **sub section transclusion** syntax `:[](file.md##some-header)` (note the `##` instead of `#`) the content of the header until the header of the same header level will be transcluded (in other words, this will transclude sub header content).

`#some-header` will match the following (according to typical html anchor id generation):
   - `# Some Header`
   - `# some_header`
   - `# sOme-heAder`
   - `###### some&header`

#### Basic Example

`index.md`
```md
:[](section.md#header)
```

`section.md`
```md
# Header

Content

## SubHeader

More Content
```

Will yield:
```md
# Header 1

Content
```

#### Sub Section Example

`index.md`
```md
:[](section.md##header)
```

`section.md`
```md
Some other content

# Header

Content

## SubHeader

More Content
```

Will yield:
```md
# Header 1

Content

## SubHeader

More Content
```

### Header Auto Levels

The heading level of the transcluded content will automatically be adjusted to match the level in the context of the transcluding link.

This allows making each markdown file have headings that start at level one (`#`) and let the transclusion process figure out which level the transluded content should be adjusted to.

#### Example

It's possible to write:

`index.md`
```md
# Header

Intro...

:[](section.md)
```

`section.md`
```md
# Section

Content
```

Which will yield:
```md
# Header

Intro...

## Section

Content
```

In this case, since section.md is transcluded under `# Header`, the level in this context is 1, so the `# Section` will be transformed by adding one level into `## Section`

#### Advanced

In some cases it's desirable to customise the level of the transcluded content.

## Footnotes

Footnote content is best managed via a single file transcluded in the files where footnotes exist. Pandoc will automatically display only the footnotes that are present in the file where a footnote exists.

> When footnotes are transcluded several times, pandoc will output an error about duplicate references.
