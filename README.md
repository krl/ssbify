# ssbify

Takes an url and returns a ssb blob-id representing the contents of the site.

Uses node-readability, and imports any images as hash-links.

## usage

```
ssbify http://blog.codinghorror.com/the-eternal-lorem-ipsum/
# => &m9VsxJCJ4GMwkiSXolovyOOFjoICWoEyXjz7uAImq4w=.sha256
```

```
sbot blobs.get "&m9VsxJCJ4GMwkiSXolovyOOFjoICWoEyXjz7uAImq4w=.sha256"
```

Will output the markdown.
