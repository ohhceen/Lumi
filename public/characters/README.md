# Character images

The app shows character illustrations from this folder. **No artwork is
included in the repository**: add your own image files here. Toy Story
characters are © Disney/Pixar, so use only images you have the right to use.

| File name | Character | Where it appears |
|---|---|---|
| `woody.png` | Woody | Dashboard hero, Pengeluaran page, achievement banner |
| `buzz.png` | Buzz Lightyear | Dashboard hero, Pemasukan page, achievement banner |
| `aliens.png` | Little Green Men | Anggaran page, every empty state |
| `jessie.png` | Jessie | Pengaturan page, loading screen |
| `rex.png` | Rex | Kategori page, loading screen |
| `hamm.png` | Hamm | Laporan page, loading screen |
| `lotso.png` | Lotso | Login page |

Tips
- Formats: `.webp`, `.png`, `.avif`, `.jpg` or `.svg` (same base name).
- Use a **transparent background**, character facing the viewer, cropped
  close to the figure. About 600 × 600 px is plenty.
- After adding or removing files, restart `npm run dev` (or rebuild): the
  list of available images is regenerated automatically
  (`scripts/gen-character-manifest.mjs`). Missing images simply don't render.
- To see every slot as a dashed outline while placing images, set
  `NEXT_PUBLIC_SHOW_CHARACTER_SLOTS=1` in `.env.local`.
