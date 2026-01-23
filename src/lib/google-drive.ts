import { google } from 'googleapis';
import { Readable } from 'stream';

export interface GoogleDriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
  mimeType: string;
}

const globalForGoogleDrive = global as unknown as {
  googleDriveService: GoogleDriveService | undefined;
};

class GoogleDriveService {
  private drive;
  private folderId: string;
  private isConfigured: boolean;

  constructor() {
    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Handle different private key formats
    if (privateKey) {
      // Remove surrounding quotes if the entire value is quoted
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      // Also handle case where only starting quote exists (partial copy)
      if (privateKey.startsWith('"')) {
        privateKey = privateKey.slice(1);
      }
      if (privateKey.endsWith('"')) {
        privateKey = privateKey.slice(0, -1);
      }

      // Replace literal \n with actual newlines (handles \\n in env vars)
      privateKey = privateKey.replace(/\\n/g, '\n');

      // Remove any extra whitespace around the key
      privateKey = privateKey.trim();

      // Ensure the key has proper format
      if (!privateKey.includes('-----BEGIN')) {
        console.error('Private key does not contain BEGIN marker');
      }
    }

    this.isConfigured = !!(clientEmail && privateKey && folderId);
    this.folderId = folderId || '';

    if (this.isConfigured && privateKey) {
      try {
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: clientEmail,
            private_key: privateKey,
          },
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        this.drive = google.drive({ version: 'v3', auth });
      } catch (error) {
        console.error('Failed to initialize Google Drive auth:', error);
        this.isConfigured = false;
      }
    }
  }

  checkConfiguration(): { configured: boolean; error?: string } {
    if (!this.isConfigured) {
      return {
        configured: false,
        error: 'Google Drive is not configured. Please set GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, and GOOGLE_DRIVE_FOLDER_ID environment variables.',
      };
    }
    return { configured: true };
  }

  async uploadFile(buffer: Buffer, fileName: string, mimeType: string): Promise<GoogleDriveUploadResult> {
    if (!this.drive) {
      throw new Error('Google Drive service is not initialized');
    }

    const stream = Readable.from(buffer);

    const response = await this.drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType,
        parents: [this.folderId],
      },
      media: {
        mimeType: mimeType,
        body: stream,
      },
      fields: 'id, name, webViewLink, webContentLink, mimeType',
    });

    const fileId = response.data.id;
    if (!fileId) {
      throw new Error('Failed to get file ID from Google Drive');
    }

    await this.makeFilePublic(fileId);

    return {
      fileId: fileId,
      fileName: response.data.name || fileName,
      webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink: `https://drive.google.com/uc?id=${fileId}&export=download`,
      mimeType: response.data.mimeType || mimeType,
    };
  }

  private async makeFilePublic(fileId: string): Promise<void> {
    if (!this.drive) {
      throw new Error('Google Drive service is not initialized');
    }

    await this.drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.drive) {
      throw new Error('Google Drive service is not initialized');
    }

    await this.drive.files.delete({
      fileId: fileId,
    });
  }
}

export const googleDriveService =
  globalForGoogleDrive.googleDriveService ?? new GoogleDriveService();

if (process.env.NODE_ENV !== 'production') {
  globalForGoogleDrive.googleDriveService = googleDriveService;
}
