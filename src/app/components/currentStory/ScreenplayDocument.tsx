type BlockType =
  | "title"
  | "scene"
  | "beat"
  | "action"
  | "dialogue"
  | "state"
  | "character";

interface ScriptBlock {
  type: BlockType;
  text: string;
}

interface ScriptLine {
  text: string;
  type: BlockType | "parenthetical" | "spacer";
}

const LINES_PER_PAGE = 54;
const ACTION_WIDTH = 60;
const DIALOGUE_WIDTH = 34;
const FIELD_PATTERN =
  /^(TITLE|SETTING|SCENE HEADING|BEAT\s+\d+|ACTION|DIALOGUE|STATE):\s*(.*)$/i;
const SCENE_PATTERN = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i;

function parseDialogue(text: string): ScriptBlock[] {
  const lines = text.split("\n");
  const blocks: ScriptBlock[] = [];
  let dialogue: string[] = [];

  const flushDialogue = () => {
    const value = dialogue.join("\n").trim();
    if (value) blocks.push({ type: "dialogue", text: value });
    dialogue = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushDialogue();
      continue;
    }

    const inlineCue = /^([A-Z][A-Z0-9 .()'-]{1,34}):\s*(.*)$/.exec(line);
    if (inlineCue) {
      flushDialogue();
      blocks.push({ type: "character", text: inlineCue[1]!.trim() });
      if (inlineCue[2]?.trim()) {
        blocks.push({ type: "dialogue", text: inlineCue[2].trim() });
      }
      continue;
    }

    const isCharacterCue =
      line.length <= 35 &&
      /^[A-Z][A-Z0-9 .()'-]*$/.test(line) &&
      !/^(CONT'D|CONTINUED|MORE)$/.test(line);

    if (isCharacterCue) {
      flushDialogue();
      blocks.push({ type: "character", text: line });
      continue;
    }

    dialogue.push(rawLine);
  }

  flushDialogue();
  return blocks;
}

function parseScreenplay(content: string) {
  const blocks: ScriptBlock[] = [];
  let activeType: BlockType | null = null;
  let activeLines: string[] = [];

  const flush = () => {
    const text = activeLines.join("\n").trim();
    if (activeType && text) {
      if (activeType === "dialogue") {
        blocks.push(...parseDialogue(text));
      } else {
        blocks.push({ type: activeType, text });
      }
    }
    activeType = null;
    activeLines = [];
  };

  for (const rawLine of content
    .replace(/\r\n/g, "\n")
    .replace(/^```[^\n]*\n?/, "")
    .replace(/\n?```$/, "")
    .split("\n")) {
    const line = rawLine.trim();
    const field = FIELD_PATTERN.exec(line);

    if (field) {
      flush();
      const label = field[1]!.toUpperCase();
      const beatNumber = /^BEAT\s+\d+$/i.test(label);
      activeType = label === "TITLE"
        ? "title"
        : label === "SETTING" || label === "SCENE HEADING"
          ? "scene"
          : beatNumber
            ? "beat"
            : label.toLowerCase() as BlockType;
      if (beatNumber) {
        activeLines.push(
          field[2]?.trim() ? `${label}: ${field[2].trim()}` : label,
        );
      } else if (field[2]?.trim()) {
        activeLines.push(field[2].trim());
      }
      continue;
    }

    if (SCENE_PATTERN.test(line)) {
      flush();
      activeType = "scene";
      activeLines.push(line);
      continue;
    }

    if (!line) {
      if (activeType) activeLines.push("");
      continue;
    }

    const isCharacterCue =
      /^[A-Z][A-Z0-9 .()'-]{1,34}$/.test(line) &&
      !/^(CONT'D|CONTINUED|MORE)$/.test(line);
    if (
      isCharacterCue &&
      (!activeType ||
        (activeType === "action" && activeLines.at(-1) === ""))
    ) {
      flush();
      activeType = "character";
    } else if (!activeType) {
      activeType = "action";
    }
    activeLines.push(line);
  }
  flush();

  const titleIndex = blocks.findIndex((block) => block.type === "title");
  const title =
    titleIndex >= 0 ? blocks.splice(titleIndex, 1)[0]!.text : "Untitled";

  return { title, blocks };
}

function wrapText(text: string, width: number): string[] {
  const result: string[] = [];

  for (const paragraph of text.split("\n")) {
    if (!paragraph) {
      result.push("");
      continue;
    }

    const words = paragraph.trim().split(/\s+/);
    let line = "";
    for (const word of words) {
      if (!line) {
        line = word;
      } else if (line.length + word.length + 1 <= width) {
        line += ` ${word}`;
      } else {
        result.push(line);
        line = word;
      }

      while (line.length > width) {
        result.push(line.slice(0, width));
        line = line.slice(width);
      }
    }
    if (line) result.push(line);
  }

  return result;
}

function formatBlocks(blocks: ScriptBlock[]): ScriptLine[] {
  const lines: ScriptLine[] = [];
  let previousType: BlockType | null = null;

  const addSpacer = () => {
    if (lines.length && lines.at(-1)?.type !== "spacer") {
      lines.push({ text: "", type: "spacer" });
    }
  };

  for (const block of blocks) {
    if (previousType) addSpacer();

    if (block.type === "dialogue") {
      lines.push(
        ...wrapText(block.text, DIALOGUE_WIDTH).map((text) => ({
          text,
          type: /^\([^)]*\)$/.test(text)
            ? ("parenthetical" as const)
            : ("dialogue" as const),
        })),
      );
    } else {
      const text =
        block.type === "scene" ? block.text.toUpperCase() : block.text;
      lines.push(
        ...wrapText(text, ACTION_WIDTH).map((wrapped) => ({
          text: wrapped,
          type: block.type,
        })),
      );
    }
    previousType = block.type;
  }

  return lines;
}

function paginate(lines: ScriptLine[]) {
  const pages: ScriptLine[][] = [];
  for (let index = 0; index < lines.length; index += LINES_PER_PAGE) {
    pages.push(lines.slice(index, index + LINES_PER_PAGE));
  }
  return pages;
}

function lineClass(type: ScriptLine["type"]) {
  switch (type) {
    case "scene":
      return "font-bold uppercase";
    case "beat":
      return "font-bold";
    case "character":
      return "ml-[2.2in] uppercase";
    case "dialogue":
      return "ml-[1in] max-w-[3.5in]";
    case "parenthetical":
      return "ml-[1.5in] max-w-[2.5in]";
    case "state":
      return "italic";
    case "spacer":
      return "h-[12pt]";
    default:
      return "";
  }
}

export default function ScreenplayDocument({ content }: { content: string }) {
  const { title, blocks } = parseScreenplay(content);
  const pages = paginate(formatBlocks(blocks));

  if (!pages.length) return null;

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs font-semibold text-slate-600"
        aria-label={`${pages.length} script pages, approximately ${pages.length} minutes`}
      >
        <span>12 pt Courier · screenplay format</span>
        <span>
          {pages.length} {pages.length === 1 ? "page" : "pages"} · ~
          {pages.length} {pages.length === 1 ? "minute" : "minutes"}
        </span>
      </div>

      <div className="space-y-5 overflow-x-auto rounded-2xl bg-slate-100 p-3 sm:p-6">
        <article
          role="document"
          aria-label="Screenplay title page"
          className="relative mx-auto flex min-h-[11in] w-[8.5in] items-start justify-center border border-slate-200 bg-white px-12 pt-[3.5in] text-center text-slate-950 shadow-sm"
          style={{
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: "12pt",
            lineHeight: "12pt",
          }}
        >
          <h2 className="max-w-[6in] font-bold uppercase">{title}</h2>
          <span className="absolute right-8 bottom-12 text-xs text-slate-500">
            SCREENPLAY
          </span>
        </article>

        {pages.map((lines, index) => (
          <article
            key={index}
            role="document"
            aria-label={`Script page ${index + 1} of ${pages.length}`}
            className="relative mx-auto min-h-[11in] w-[8.5in] border border-slate-200 bg-white px-[1.5in] pt-[1in] pb-[1in] text-slate-950 shadow-sm"
            style={{
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: "12pt",
              lineHeight: "12pt",
            }}
          >
            {index > 0 && (
              <p className="absolute top-[0.5in] right-[1in]">{index + 1}.</p>
            )}
            <div>
              {lines.map((line, lineIndex) => (
                <div
                  key={`${index}-${lineIndex}`}
                  className={lineClass(line.type)}
                >
                  {line.text || "\u00a0"}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      <p className="text-right font-mono text-[11px] text-slate-500">
        Runtime is an estimate; one screenplay page is approximately one minute.
      </p>
    </div>
  );
}
