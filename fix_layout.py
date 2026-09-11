import re

with open('src/app/layout.tsx', 'r') as f:
    content = f.read()

old_link = '<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>'
new_link = """<link rel="preload" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" as="style" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" media="print" />
        <noscript>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
        </noscript>"""

content = content.replace(old_link, new_link)

# To fix the media='print' turning to 'all' in React, we need dangerouslySetInnerHTML or just wait!
# React 18+ does not execute inline `onLoad` well on `<link>`.
# A safer way in Next.js App Router is to use next/font or just standard blocking, but if we do this, how will the font apply?
