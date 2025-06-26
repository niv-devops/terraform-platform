import { type NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"

export async function POST(request: NextRequest) {
  try {
    const { bucketName, filePath } = await request.json()

    console.log("API received request for:", { bucketName, filePath })

    if (!bucketName || !filePath) {
      return NextResponse.json({ error: "Missing bucketName or filePath" }, { status: 400 })
    }

    // Check for GCP credentials
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    console.log("GCP credentials path:", credentialsPath)

    if (!credentialsPath) {
      return NextResponse.json(
        { error: "GOOGLE_APPLICATION_CREDENTIALS environment variable not set" },
        { status: 500 },
      )
    }

    try {
      console.log(`Fetching ${filePath} from bucket ${bucketName}`)

      // Initialize Google Cloud Storage
      const storage = new Storage({
        keyFilename: credentialsPath,
      })

      // Get the bucket
      const bucket = storage.bucket(bucketName)

      // Get the file
      const file = bucket.file(filePath)

      // Check if file exists
      const [exists] = await file.exists()
      if (!exists) {
        console.error(`File ${filePath} does not exist in bucket ${bucketName}`)
        return NextResponse.json({ error: `File ${filePath} not found in bucket ${bucketName}` }, { status: 404 })
      }

      // Download the file content
      console.log("Downloading file content...")
      const [fileContent] = await file.download()
      const stateFileContent = fileContent.toString("utf8")

      // Parse the JSON content
      let stateData
      try {
        stateData = JSON.parse(stateFileContent)
        console.log("Successfully parsed Terraform state file")
      } catch (parseError) {
        console.error("Error parsing state file as JSON:", parseError)
        return NextResponse.json({ error: "Invalid JSON in Terraform state file" }, { status: 400 })
      }

      return NextResponse.json(stateData)
    } catch (gcpError: any) {
      console.error("GCP Error:", gcpError)

      // Provide more specific error messages
      let errorMessage = "Failed to fetch from GCP bucket"
      if (gcpError.code === 403) {
        errorMessage = "Access denied. Check service account permissions."
      } else if (gcpError.code === 404) {
        errorMessage = "Bucket or file not found."
      } else if (gcpError.code === 401) {
        errorMessage = "Authentication failed. Check service account credentials."
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: gcpError.message,
          code: gcpError.code,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
