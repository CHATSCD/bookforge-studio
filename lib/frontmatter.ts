import type { Settings } from "./types";

export function copyrightText(s: Settings): string {
  const year = s.copyrightYear || String(new Date().getFullYear());
  const author = s.author || "The Author";
  return [
    `Copyright © ${year} ${author}`,
    s.isbn ? `ISBN: ${s.isbn}` : "ISBN: (pending)",
    s.rights,
    "This is a work of fiction. Names, characters, businesses, places, events, and incidents are either the products of the author's imagination or used in a fictitious manner. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.",
    "Published in the United States of America.",
    "Created with BookForge Studio.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
