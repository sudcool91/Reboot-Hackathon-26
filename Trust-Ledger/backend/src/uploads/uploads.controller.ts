import {
  Controller, Post, UploadedFile, UseInterceptors,
  Body, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const UPLOADS_DIR = join(process.cwd(), '..', 'uploads');

@Controller('api/v1/uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
          cb(null, UPLOADS_DIR);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('docType') docType: string,
    @Body('customerId') customerId: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return {
      success: true,
      docType: docType || 'unknown',
      customerId: customerId || 'guest',
      originalName: file.originalname,
      savedAs: file.filename,
      size: file.size,
      path: `/uploads/${file.filename}`,
      uploadedAt: new Date().toISOString(),
    };
  }
}
