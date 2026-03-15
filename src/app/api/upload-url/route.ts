import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKETS } from "@/lib/aws/config";
import { z } from "zod/v4";

const UploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().default("text/csv"),
});

/**
 * POST /api/upload-url
 *
 * Generates an S3 presigned URL for direct browser upload.
 * Body: { filename: "companies.csv", contentType?: "text/csv" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = UploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { filename, contentType } = parsed.data;
    const key = `uploads/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKETS.DATA,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.json({
      uploadUrl,
      key,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Failed to generate upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
