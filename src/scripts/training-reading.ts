// Les mêmes liens que dans l’application : cours marqués et chapitres des exercices vus.
// Une étoile seule et les sujets de concours ne comptent pas comme une lecture.
export function studiedChapters(
  marks: Record<string, { st: string | null }>,
  exerciseChapters: Record<string, string>,
): Set<string> {
  const chapters = new Set<string>();
  for (const [item, mark] of Object.entries(marks)) {
    if (!mark || !mark.st) continue;
    if (item.startsWith('cours:')) chapters.add(item.slice(6));
    if (item.startsWith('exo:')) {
      const chapter = exerciseChapters[item.slice(4)];
      if (chapter) chapters.add(chapter);
    }
  }
  return chapters;
}
