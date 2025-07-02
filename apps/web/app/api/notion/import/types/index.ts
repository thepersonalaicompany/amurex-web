interface RichText {
  plain_text: string;
}

interface FileObject {
  url: string;
}

interface ExternalObject {
  url: string;
}

type MediaObject =
  | { type: "external"; external: ExternalObject }
  | { type: "file"; file: FileObject };

interface ParagraphBlock {
  type: "paragraph";
  paragraph: { rich_text: RichText[] };
}

interface Heading1Block {
  type: "heading_1";
  heading_1: { rich_text: RichText[] };
}

interface Heading2Block {
  type: "heading_2";
  heading_2: { rich_text: RichText[] };
}

interface Heading3Block {
  type: "heading_3";
  heading_3: { rich_text: RichText[] };
}

interface BulletedListItemBlock {
  type: "bulleted_list_item";
  bulleted_list_item: { rich_text: RichText[] };
}

interface NumberedListItemBlock {
  type: "numbered_list_item";
  numbered_list_item: { rich_text: RichText[] };
}

interface ToDoBlock {
  type: "to_do";
  to_do: { checked: boolean; rich_text: RichText[] };
}

interface ToggleBlock {
  type: "toggle";
  toggle: { rich_text: RichText[] };
}

interface CodeBlock {
  type: "code";
  code: { language?: string; rich_text: RichText[] };
}

interface QuoteBlock {
  type: "quote";
  quote: { rich_text: RichText[] };
}

interface CalloutBlock {
  type: "callout";
  callout: { rich_text: RichText[] };
}

interface DividerBlock {
  type: "divider";
}

interface TableBlock {
  type: "table";
}

interface TableRowBlock {
  type: "table_row";
  table_row: { cells: RichText[][] };
}

interface ImageBlock {
  type: "image";
  image: { caption?: RichText[] } & MediaObject;
}

interface VideoBlock {
  type: "video";
  video: { caption?: RichText[] } & MediaObject;
}

interface FileBlock {
  type: "file";
  file: { caption?: RichText[] } & MediaObject;
}

interface PdfBlock {
  type: "pdf";
  pdf: { caption?: RichText[] } & MediaObject;
}

interface BookmarkBlock {
  type: "bookmark";
  bookmark: { url: string };
}

interface LinkPreviewBlock {
  type: "link_preview";
  link_preview: { url: string };
}

interface EmbedBlock {
  type: "embed";
  embed: { url: string };
}

interface EquationBlock {
  type: "equation";
  equation: { expression: string };
}

interface SyncedBlock {
  type: "synced_block";
}

interface TemplateBlock {
  type: "template";
  template: { rich_text: RichText[] };
}

interface LinkToPageBlock {
  type: "link_to_page";
}

interface ChildPageBlock {
  type: "child_page";
  child_page: { title?: string };
}

interface ChildDatabaseBlock {
  type: "child_database";
  child_database: { title?: string };
}

interface ColumnListBlock {
  type: "column_list";
}

interface ColumnBlock {
  type: "column";
}

interface TableOfContentsBlock {
  type: "table_of_contents";
}

interface BreadcrumbBlock {
  type: "breadcrumb";
}

interface UnsupportedBlock {
  type: "unsupported";
}

export type Block =
  | ParagraphBlock
  | Heading1Block
  | Heading2Block
  | Heading3Block
  | BulletedListItemBlock
  | NumberedListItemBlock
  | ToDoBlock
  | ToggleBlock
  | CodeBlock
  | QuoteBlock
  | CalloutBlock
  | DividerBlock
  | TableBlock
  | TableRowBlock
  | ImageBlock
  | VideoBlock
  | FileBlock
  | PdfBlock
  | BookmarkBlock
  | LinkPreviewBlock
  | EmbedBlock
  | EquationBlock
  | SyncedBlock
  | TemplateBlock
  | LinkToPageBlock
  | ChildPageBlock
  | ChildDatabaseBlock
  | ColumnListBlock
  | ColumnBlock
  | TableOfContentsBlock
  | BreadcrumbBlock
  | UnsupportedBlock;
