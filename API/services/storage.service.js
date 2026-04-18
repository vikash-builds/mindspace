const { createClient } = require('@supabase/supabase-js');

const config = require('../config');

class StorageService {
  constructor() {
    this.enabled = Boolean(config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY);
    this.client = this.enabled
      ? createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  }

  async ensureBuckets() {
    if (!this.client) {
      return;
    }

    const existing = await this.client.storage.listBuckets();
    const bucketNames = new Set((existing.data || []).map((bucket) => bucket.name));

    const desired = [
      config.SUPABASE_DOCUMENTS_BUCKET,
      config.SUPABASE_CHAT_ATTACHMENTS_BUCKET,
    ];

    for (const bucket of desired) {
      if (!bucketNames.has(bucket)) {
        await this.client.storage.createBucket(bucket, {
          public: false,
          fileSizeLimit: '50MB',
        });
      }
    }
  }

  async uploadBuffer(bucket, objectPath, buffer, contentType) {
    if (!this.client) {
      throw new Error('Supabase storage is not configured');
    }

    const { error } = await this.client.storage.from(bucket).upload(objectPath, buffer, {
      contentType,
      upsert: true,
    });
    if (error) {
      throw error;
    }
  }

  async removeObject(bucket, objectPath) {
    if (!this.client || !objectPath) {
      return;
    }
    await this.client.storage.from(bucket).remove([objectPath]);
  }

  async createSignedUrl(bucket, objectPath, expiresIn = 3600) {
    if (!this.client) {
      throw new Error('Supabase storage is not configured');
    }
    const { data, error } = await this.client.storage.from(bucket).createSignedUrl(objectPath, expiresIn);
    if (error) {
      throw error;
    }
    return data.signedUrl;
  }
}

module.exports = new StorageService();
