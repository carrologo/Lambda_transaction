export interface IUploadDocumentsRepository {
     /**
     * Sube múltiples archivos a Google Drive y devuelve las URL del drive con los documentos subidos.
     * @param documents - Array de objetos con base64, nombre y tipo MIME de cada imagen.
     * @param folderName - El nombre de la carpeta donde se guardarán las imágenes.
     * @returns Array de URLs públicas de los archivos subidos.
     */
    uploadDocuments(images: { base64: string, name: string }[], foldername: string): Promise<string>;
}