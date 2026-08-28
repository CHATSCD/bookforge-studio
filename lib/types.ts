export interface Chapter {
  id: string;
  title: string;
  body: string;
}

export interface Settings {
  author?: string;
  pageSize: "6x9" | "5x8" | "8.5x11";
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  indent: boolean;
  chapterStyle: "classic" | "modern" | "minimal";
  includePrelude: boolean;
  includeCopyright: boolean;
  includeDedication: boolean;
  includeToc: boolean;
  copyrightYear: string;
  isbn: string;
  rights: string;
  dedication: string;
  blurb: string;
  authorBio: string;
  tocTitle: string;
}

export interface CoverConfig {
  bgType: "gradient" | "solid" | "image";
  bgFrom: string;
  bgTo: string;
  bgSolid: string;
  imageUrl: string;
  titleColor: string;
  authorColor: string;
  accentColor: string;
  titleFontSize: number;
  showSubtitle: boolean;
  showSeries: boolean;
  seriesText: string;
  showTagline: boolean;
  tagline: string;
  layout: "centered" | "modern" | "classic";
  renderedDataUrl: string;
  aiPrompt: string;
}

export interface FrontMatterConfig {
  prelude: string;
  dedication: string;
  copyright: string;
  acknowledgements: string;
  epigraph: string;
}

export interface Project {
  id?: string;
  title: string;
  subtitle: string;
  author: string;
  rawText: string;
  chapters: Chapter[];
  settings: Settings;
  cover: CoverConfig;
  frontMatter: FrontMatterConfig;
}

export function defaultProject(): Project {
  return {
    title: "My Book",
    subtitle: "",
    author: "Your Name",
    rawText: "",
    chapters: [],
    settings: {
      pageSize: "6x9",
      fontFamily: "Georgia",
      fontSize: 12,
      lineHeight: 1.6,
      indent: true,
      chapterStyle: "classic",
      includePrelude: true,
      includeCopyright: true,
      includeDedication: false,
      includeToc: true,
      copyrightYear: String(new Date().getFullYear()),
      isbn: "",
      rights: "All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.",
      dedication: "",
      blurb: "",
      authorBio: "",
      tocTitle: "Contents",
    },
    cover: {
      bgType: "gradient",
      bgFrom: "#1e293b",
      bgTo: "#0f172a",
      bgSolid: "#1e293b",
      imageUrl: "",
      titleColor: "#ffffff",
      authorColor: "#cbd5e1",
      accentColor: "#f59e0b",
      titleFontSize: 72,
      showSubtitle: true,
      showSeries: false,
      seriesText: "",
      showTagline: false,
      tagline: "",
      layout: "centered",
      renderedDataUrl: "",
      aiPrompt: "",
    },
    frontMatter: {
      prelude: "Every book begins as a blank page. This one began with you.",
      dedication: "",
      copyright: "",
      acknowledgements: "",
      epigraph: "",
    },
  };
}
