declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    JOURNAL_OWNER_EMAIL?: string;
  }
}
