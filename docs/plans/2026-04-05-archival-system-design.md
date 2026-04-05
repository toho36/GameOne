# Archival System Design for Cold Data

## Overview
A lightweight, low-cost archival system for moving cold structured data (AuditLog, RegistrationHistory, NotificationLog) from the primary database to Cloudflare R2 object storage.

## Goals
- **Minimize Cost**: Use Cloudflare R2's $0 egress model to avoid retrieval fees.
- **Simplicity**: Use NDJSON (Newline Delimited JSON) for its simplicity and append-only compatibility.
- **Performance**: Compress data with Gzip to reduce storage footprints by ~80%.
- **Queryability**: Ensure data can be queried directly from R2 using DuckDB without a full download.

## Design

### 1. Storage Backend
- **Provider**: Cloudflare R2 (S3-Compatible API)
- **Bucket Structure**:
  `archive/{table_name}/y={YYYY}/m={MM}/d={DD}/{timestamp}.ndjson.gz`

### 2. Format & Compression
- **Format**: NDJSON (Newline Delimited JSON)
- **Compression**: Gzip (standard zlib)
- **Media Type**: `application/x-ndjson`
- **Content Encoding**: `gzip`

### 3. Pipeline (Next.js Cron Job)
- **Schedule**: Weekly (Sunday at 03:00)
- **Process**:
  1. **Fetch**: Query Prisma for records older than 30 days in specific tables.
  2. **Chunking**: Process in batches (e.g., 5000 rows) to keep memory usage low on serverless functions.
  3. **Stream**: Serialize to NDJSON, compress, and upload to R2 using `@aws-sdk/client-s3`.
  4. **Verification**: Confirm upload success via S3 `HeadObject` or checksum.
  5. **Prune**: Delete successfully archived rows from the primary database.

### 4. Query Strategy
- **Tool**: DuckDB
- **Method**: Use `httpfs` extension to read Gzipped NDJSON from R2 directly.
- **Example Query**:
  ```sql
  SELECT * FROM read_json_auto('s3://bucket/archive/AuditLog/y=2026/m=04/*/*.ndjson.gz')
  WHERE action = 'DELETE_ACCOUNT';
  ```

## Error Handling
- **Partial Failure**: If an upload fails, rows remain in the DB and will be picked up by the next run.
- **Logging**: Log success counts and R2 keys to an internal `ArchivalHistory` table or a dedicated logging service.

## Cost Analysis (10GB/yr)
- **Storage**: $1.80 / year
- **Egress**: $0.00
- **Ops (Class A)**: ~52 writes/year = well within free tier.
