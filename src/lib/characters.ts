/**
 * Character illustration slots.
 *
 * The app ships WITHOUT character artwork. Add your own image files to
 * `public/characters/` using the file names below (png, webp, jpg or svg),
 * then run `npm run dev` / `npm run build`: the manifest is regenerated and
 * the images appear in their slots. Missing images render nothing, so the
 * layout never shows broken images or placeholders.
 */
export const CHARACTER_SLOTS = {
  woody: { name: "Woody", usedOn: "Dashboard hero, halaman Pengeluaran, progres/pencapaian" },
  buzz: { name: "Buzz Lightyear", usedOn: "Dashboard hero, halaman Pemasukan, progres/pencapaian" },
  aliens: { name: "Little Green Men", usedOn: "Anggaran, semua empty state" },
  jessie: { name: "Jessie", usedOn: "Pengaturan, loading" },
  rex: { name: "Rex", usedOn: "Kategori, loading" },
  hamm: { name: "Hamm", usedOn: "Laporan (celengan babi), loading" },
  lotso: { name: "Lotso", usedOn: "Halaman login" },
} as const;

export type CharacterKey = keyof typeof CHARACTER_SLOTS;
export const CHARACTER_KEYS = Object.keys(CHARACTER_SLOTS) as CharacterKey[];
