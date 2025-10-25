/*
  # Create OCR Results Table

  1. New Tables
    - `ocr_results`
      - `id` (uuid, primary key) - Unique identifier for each OCR result
      - `user_id` (uuid, references auth.users) - User who uploaded the image
      - `image_url` (text) - URL or base64 of the uploaded image
      - `extracted_text` (text) - Text extracted from the image via OCR
      - `language` (text) - Detected or specified language
      - `confidence` (decimal) - Confidence score of the OCR result
      - `status` (text) - Processing status: 'pending', 'completed', 'failed'
      - `error_message` (text, nullable) - Error message if processing failed
      - `created_at` (timestamptz) - When the OCR was requested
      - `processed_at` (timestamptz, nullable) - When processing completed

  2. Security
    - Enable RLS on `ocr_results` table
    - Add policy for users to insert their own OCR requests
    - Add policy for users to view their own OCR results
    - Add policy for users to delete their own OCR results
    - Add policy for users to update their own OCR results

  3. Indexes
    - Index on user_id for fast queries
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS ocr_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  extracted_text text DEFAULT '',
  language text DEFAULT 'unknown',
  confidence decimal DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE ocr_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own OCR results"
  ON ocr_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own OCR results"
  ON ocr_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own OCR results"
  ON ocr_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own OCR results"
  ON ocr_results
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ocr_results_user_id ON ocr_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_created_at ON ocr_results(created_at DESC);