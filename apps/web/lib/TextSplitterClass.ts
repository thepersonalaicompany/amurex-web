export interface Document {
  pageContent: string;
}

export interface TextSplitterConfig {
  chunkSize?: number;
  chunkOverlap?: number;
}

export class TextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor({ chunkSize = 200, chunkOverlap = 50 }: TextSplitterConfig = {}) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  async createDocuments(texts: string | string[]): Promise<Document[]> {
    const textArray = Array.isArray(texts) ? texts : [texts];

    return textArray.flatMap((text: string) => {
      const cleanText = text.trim().replace(/\s+/g, " ");

      if (cleanText.length <= this.chunkSize) {
        return [{ pageContent: cleanText }];
      }

      const chunks: Document[] = [];
      let startIndex = 0;

      while (startIndex < cleanText.length) {
        chunks.push({
          pageContent: cleanText
            .slice(startIndex, startIndex + this.chunkSize)
            .trim(),
        });
        startIndex += this.chunkSize - this.chunkOverlap;
      }

      return chunks;
    });
  }
}
