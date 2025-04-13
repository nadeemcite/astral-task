import { buildResponse } from "./cors.ts";

export class CustomError extends Error {
  private statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "CustomError";
    this.statusCode = statusCode;
  }

  getErrorResponse = () => {
    return buildResponse({ error: this.message }, this.statusCode);
  };
}

export class EnvNotDefined extends CustomError {
  constructor(envKey: string) {
    super(`Env Key ${envKey} missing`);
    this.name = "EnvNotDefined";
  }
}

export class PDFSourceNotFoundError extends CustomError {
  constructor(pdfSourceId: string) {
    super(`Invalid PDF source record for id "${pdfSourceId}".`, 404);
    this.name = "PDFSourceNotFoundError";
  }
}

export class DownloadFailedError extends CustomError {
  constructor(message: string) {
    super(`Error downloading PDF from storage: ${message}`, 503);
    this.name = "DownloadFailedError";
  }
}

export class NoValidPagesError extends CustomError {
  constructor() {
    super("No valid pages to extract.", 400);
    this.name = "NoValidPagesError";
  }
}

export class ApiKeyMissingError extends CustomError {
  constructor() {
    super("Key missing for third party API.", 401);
    this.name = "ApiKeyMissingError";
  }
}

export class ApiError extends CustomError {
  constructor(status: number, message: string) {
    super(`API error (status ${status}): ${message}`, status);
    this.name = "ApiError";
  }
}

export class PDFSourceQueryError extends CustomError {
  constructor(message: string) {
    super(`PDF Source Query Error: ${message}`, 400);
    this.name = "PDFSourceQueryError";
  }
}

export class PDFPageQueryError extends CustomError {
  constructor(message: string) {
    super(`PDF Page Query Error: ${message}`, 400);
    this.name = "PDFPageQueryError";
  }
}

export class StorageUploadError extends CustomError {
  constructor(message: string) {
    super(`Storage Upload Error: ${message}`);
    this.name = "StorageUploadError";
  }
}

export class BatchInsertError extends CustomError {
  constructor(message: string) {
    super(`Batch Insert Error: ${message}`);
    this.name = "BatchInsertError";
  }
}

export class PDFCreationError extends CustomError {
  constructor(message: string) {
    super(`PDF Creation Error: ${message}`);
    this.name = "PDFCreationError";
  }
}

export class PDFMatchQueryError extends CustomError {
  constructor(message: string) {
    super(`PDF Match Query Error: ${message}`);
    this.name = "PDFMatchQueryError";
  }
}

export class SearchResultsNotFoundError extends CustomError {
  constructor() {
    super("No results found, please adjust your query.", 404);
    this.name = "SearchResultsNotFoundError";
  }
}

export class NoValidEndpointsError extends CustomError {
  constructor() {
    super("All results are invalid.", 404);
    this.name = "NoValidEndpointsError";
  }
}

export class UserSearchActivityError extends CustomError {
  constructor(message: string) {
    super(`User Search Activity Error: ${message}`);
    this.name = "UserSearchActivityError";
  }
}

export class SearchApiError extends CustomError {
  constructor(message: string) {
    super(`Search API Error: ${message}`);
    this.name = "SearchApiError";
  }
}

export class UserActivityQueryError extends CustomError {
  constructor(message: string) {
    super(`User Activity Query Error: ${message}`);
    this.name = "UserActivityQueryError";
  }
}
