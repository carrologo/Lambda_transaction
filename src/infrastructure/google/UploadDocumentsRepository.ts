import { google } from "googleapis";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { IUploadDocumentsRepository } from "../../domain/repositories/IUploadDocumentsRepository";
import { fileTypeFromBuffer } from "file-type";
import { getGoogleSecrets } from "./helperGoogleSecrets";

export class UploadDocumentsRepository implements IUploadDocumentsRepository {
  private drive;

  private secrets: Record<string, string> | null = null;

  private async init() {
    if (!this.secrets) {
      this.secrets = await getGoogleSecrets();
      const auth = new google.auth.GoogleAuth({
        credentials: {
          type: this.secrets.GOOGLE_TYPE,
          project_id: this.secrets.GOOGLE_PROJECT_ID,
          private_key_id: this.secrets.GOOGLE_PRIVATE_KEY_ID,
          private_key: this.secrets.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          client_email: this.secrets.GOOGLE_CLIENT_EMAIL,
          client_id: this.secrets.GOOGLE_CLIENT_ID,
          universe_domain: this.secrets.GOOGLE_UNIVERSE_DOMAIN,
        },
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
      this.drive = google.drive({ version: "v3", auth });
    }
  }

  async uploadDocuments(documents: { base64: string; name: string }[], foldername: string): Promise<string> {
    await this.init();
    try {
      const folderId = await this.getOrCreateFolder(foldername);
      const documentUrls: string[] = [];

      for (const document of documents) {
        const buffer = Buffer.from(document.base64, "base64");
        const fileType = await fileTypeFromBuffer(buffer);
        if (!fileType) {
          throw new Error("No se pudo determinar el tipo MIME del archivo.");
        }

        const mimeType = fileType.mime;
        const extension = fileType.ext;

        const name = document.name || `file-${Date.now()}.${extension}`;

        const filePath = path.join(os.tmpdir(), name);
        fs.writeFileSync(filePath, buffer);

        const file = await this.drive.files.create({
          requestBody: {
            name,
            parents: [folderId],
          },
          media: {
            mimeType,
            body: fs.createReadStream(filePath),
          },
          fields: "id", // Obtener el ID del archivo creado
        });

        const fileId = file.data.id!;
        const fileUrl = `https://drive.google.com/uc?id=${fileId}`;
        documentUrls.push(fileUrl);
      }

      await this.drive.permissions.create({
        fileId: folderId,
        requestBody: { type: "anyone", role: "reader" },
      });

      return `https://drive.google.com/drive/folders/${folderId}`;
    } catch (error) {
      console.error("Error uploading files:", error);
      throw new Error("Error uploading files to Google Drive");
    }
  }

  private async getOrCreateFolder(folderName: string): Promise<string> {
    await this.init();
    try {
      // Buscar la carpeta por nombre
      const res = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id, name)",
      });

      if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id!;
      }

      // Crear la carpeta si no existe
      const folder = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });

      const folderId = folder.data.id!;

      // Compartir la carpeta con una cuenta personal
      await this.shareFolderWithPersonalAccount(
        folderId,
        this.secrets!.SHARED_FOLDER_EMAIL
      );

      return folderId;
    } catch (error) {
      console.error("Error getting or creating folder:", error);
      throw new Error("Error getting or creating folder in Google Drive");
    }
  }

  private async shareFolderWithPersonalAccount(
    folderId: string,
    email: string
  ): Promise<void> {
    await this.init();
    try {
      await this.drive.permissions.create({
        fileId: folderId,
        requestBody: {
          type: "user", // Compartir con un usuario específico
          role: "writer", // Permisos: "writer" (Editor) o "reader" (Lector)
          emailAddress: email, // Correo de la cuenta personal
        },
      });

      console.log(`Folder shared successfully with ${email}`);
    } catch (error) {
      console.error("Error sharing folder:", error);
      throw new Error("Error sharing folder in Google Drive");
    }
  }
}
