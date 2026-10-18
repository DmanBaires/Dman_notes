import { Note } from '../types/note';

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-favorite-artists',
    title: 'Favorite Artists',
    folder: 'Art & Culture',
    tags: ['artists', 'inspiration', 'movements'],
    pinned: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
    content: `# Favorite Artists & Influences

Welcome to my personal art encyclopedia and knowledge wiki.

Notice how words in this note that match existing note titles automatically become hyperlinks! For example:
- **Vincent van Gogh** revolutionized expressionism through dynamic brushstrokes and raw color.
- **Frida Kahlo** captured profound human emotion through intimate self-portraits.
- **Leonardo da Vinci** personified the Renaissance ideal across science and art.

## Artistic Movements
I often reflect on how **Impressionism** emerged in late 19th-century Paris and paved the way for modern aesthetics, while **Surrealism** explored subconscious dreams and irrational juxtapositions.

## Key Themes Explored
- Examining [[Self Portraits]] as a mirror into psychological identity.
- Contrast between classical High Renaissance harmony and radical post-impressionist vigor.
- Color theory and energetic impasto textures.

> *"I dream my painting and I paint my dream."* — Vincent van Gogh
`
  },
  {
    id: 'note-vincent-van-gogh',
    title: 'Vincent van Gogh',
    folder: 'Artists',
    tags: ['post-impressionism', 'biography', 'dutch'],
    pinned: true,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2,
    content: `# Vincent van Gogh (1853–1890)

**Vincent van Gogh** was a seminal Dutch Post-Impressionist painter whose dramatic brushwork, vibrant color palette, and emotive intensity fundamentally shaped 20th-century modern art.

## Life & Artistic Evolution
Van Gogh produced more than 2,100 artworks in just over a decade, including approximately 860 oil paintings. After absorbing early influences in the Netherlands, he moved to Paris in 1886 where he met painters associated with **Impressionism**, dramatically brightening his dark early palette.

### Sunflowers & Arles Period
In 1888, Van Gogh relocated to Arles in the South of France, establishing the "Yellow House". Here he produced his celebrated series of *Sunflowers* and painted alongside **Paul Gauguin**.

![Vincent van Gogh - Sunflowers (1888)](https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80)

## Techniques & Visual Style
- **Impasto application**: Thick, rhythmic paint layers applied with palette knife and loaded brushes.
- **Color symbolism**: High-chroma yellows and cobalt blues evoking emotional turmoil and warmth.
- **Prolific Output**: Known for producing dozens of **Self Portraits** due to lack of funds for live models.

## Related Influences
Van Gogh deeply admired masters like Rembrandt and was fascinated by Italian masters like **Leonardo da Vinci**, though he chose a distinctly expressive and tactile direction.
`
  },
  {
    id: 'note-frida-kahlo',
    title: 'Frida Kahlo',
    folder: 'Artists',
    tags: ['mexican', 'surrealism', 'biography'],
    pinned: true,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 3,
    content: `# Frida Kahlo (1907–1954)

**Frida Kahlo** was a celebrated Mexican painter best known for uncompromising, vivid **Self Portraits** dealing with identity, the human body, suffering, and Mexican indigenous folklore.

## Artistic Career & Identity
Kahlo began painting seriously while recovering from a catastrophic bus accident in 1925. Her work often defies strict classification: André Breton declared her an archetype of **Surrealism**, though Kahlo famously resisted the label:

> *"They thought I was a Surrealist, but I wasn't. I never painted dreams. I painted my own reality."*

## Marriage & Political Engagement
In 1929, Kahlo married muralist **Diego Rivera**. Their tempestuous partnership was marked by mutual creative admiration, shared political activism, and intense personal drama.

## Distinctive Imagery
- Intricate folk costumes (*tehuana* dress) reflecting pre-Columbian pride.
- Medical and surgical motifs interwoven with native Mexican flora and fauna.
- Raw vulnerability directly confronting pain, fertility, and mortality.
`
  },
  {
    id: 'note-leonardo-da-vinci',
    title: 'Leonardo da Vinci',
    folder: 'Artists',
    tags: ['renaissance', 'polymath', 'italy'],
    pinned: false,
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 4,
    content: `# Leonardo da Vinci (1452–1519)

**Leonardo da Vinci** was the quintessential Renaissance polymath whose active disciplines encompassed painting, drafting, anatomy, optics, hydrodynamics, and engineering.

## Masterworks
- **Mona Lisa (La Gioconda)**: Celebrated for its revolutionary *sfumato* (gradual blending of tones without sharp outlines) and atmospheric perspective.
- **The Last Supper**: Masterclass in dramatic narrative tension and single-point linear perspective.
- **Vitruvian Man**: The classical synthesis of human proportion and geometric unity.

## Scientific Notebooks & Inventions
Da Vinci left thousands of pages of Codex notebooks filled with mirror script drawings, hydraulic pumps, flying machines, and anatomical dissections. His cross-disciplinary curiosity laid the bedrock for both modern science and fine art.
`
  },
  {
    id: 'note-impressionism',
    title: 'Impressionism',
    folder: 'Movements',
    tags: ['art-history', 'france', '19th-century'],
    pinned: false,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 4,
    content: `# Impressionism

**Impressionism** was a radical 19th-century art movement that originated in Paris in the 1860s and 1870s. Characterized by relatively small, thin, yet visible brushstrokes and open composition, it placed unprecedented emphasis on the accurate depiction of light in its changing qualities.

## Foundational Artists
- **Claude Monet**: The movement took its name from Monet's *Impression, soleil levant*.
- **Pierre-Auguste Renoir**: Celebrated for vibrant scenes of Parisian social life.
- **Edgar Degas**: Master of motion, particularly in ballet and horse racing.

## Evolution into Post-Impressionism
Later painters such as **Vincent van Gogh**, Paul Cézanne, and Georges Seurat extended Impressionism while rejecting its limitations, emphasizing structural composition and subjective emotional expression.
`
  },
  {
    id: 'note-self-portraits',
    title: 'Self Portraits',
    folder: 'Themes',
    tags: ['identity', 'technique'],
    pinned: false,
    createdAt: Date.now() - 86400000 * 9,
    updatedAt: Date.now() - 86400000 * 3,
    content: `# Self Portraits in Art History

A self-portrait is a representation of an artist created by that artist. Across centuries, the genre has evolved from a practical showcase of technical skill to an intimate psychoanalytic canvas.

## Masters of the Self Portrait
1. **Vincent van Gogh**: Created over 35 self-portraits between 1886 and 1889, documenting his evolving state of mind and technical experiments.
2. **Frida Kahlo**: Renowned for approximately 55 self-portraits that confront chronic physical pain and Mexican heritage.
3. **Rembrandt van Rijn**: Left an autobiography in paint spanning youth to old age.

## Recurring Functions
- **Economic Necessity**: An ever-available, unpaid model for training and experimentation.
- **Psychological Mirror**: Direct unmediated examination of the self and mortal aging.
- **Brand & Persona**: Crafting public perception, allegiance to artistic philosophies, or political statements.
`
  },
  {
    id: 'note-debian-linux-setup',
    title: 'Debian Linux Desktop Guide',
    folder: 'Debian System',
    tags: ['debian', 'linux', 'packaging', 'shortcuts'],
    pinned: false,
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 1,
    content: `# Debian Linux Desktop Guide

This note outlines system integration for **Debian GNU/Linux** (Trixie, Bookworm, Sid) and Debian-derived desktop environments (GNOME, XFCE, KDE Plasma).

## Keyboard Shortcuts
- \`Ctrl + N\`: Create a new note
- \`Ctrl + P\` or \`Ctrl + K\`: Quick Switcher / Omnibar (search notes & titles)
- \`Ctrl + E\`: Toggle Edit / Split / Preview mode
- \`Ctrl + B\`: Bold selection
- \`Ctrl + I\`: Italic selection
- \`Ctrl + H\`: Highlight text
- \`Ctrl + Z\`: Undo change
- \`Ctrl + Y\` / \`Ctrl + Shift + Z\`: Redo change
- \`Ctrl + V\`: Paste images directly from clipboard!

## Debian .deb Package Installation
To install this application on your local Debian workstation using the package builder:
\`\`\`bash
# 1. Download or generate the deb package
# 2. Install using dpkg:
sudo dpkg -i wikinote_1.0.0_amd64.deb

# 3. Resolve any missing desktop dependencies:
sudo apt-get install -f
\`\`\`

## Package Structure
- \`/DEBIAN/control\`: Package metadata and dependencies
- \`/usr/bin/wikinote\`: Desktop application launcher script
- \`/usr/share/applications/wikinote.desktop\`: Desktop entry with icon & categories
- \`/usr/share/icons/hicolor/scalable/apps/wikinote.svg\`: Debian red swirl app icon
`
  }
];
