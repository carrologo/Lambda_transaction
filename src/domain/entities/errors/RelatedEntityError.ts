export class RelatedEntityError extends Error {
  public readonly code = "RelatedEntityError";
  public readonly details: string[];

  constructor(message: string, details: string[]) {
    super(message);
    this.name = "RelatedEntityError";
    this.details = details;
  }
}
