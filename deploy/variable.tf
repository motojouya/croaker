# basics
variable "project_id" {
  description = "The GCP project ID."
}
variable "region" {
  description = "The GCP region."
  default     = "asia-northeast1"
}
variable "zone" {
  description = "The GCP zone."
  default     = "asia-northeast1-a"
}

# container image registry
variable "registry_location" {
}
variable "repositry_name" {
}
variable "image_name" {
}
variable "image_tag" {
}

# database storage bucket
variable "db_bucket_name" {
}
variable "db_bucket_path" {
}

# applocation env
variable "database_path" {
}
variable "database_file" {
}
variable "service_account_runner" {
}
variable "file_bucket_name" {
}
variable "file_bucket_path" {
}
variable "next_origin" {
}
variable "nextauth_url" {
}
variable "nextauth_secret_key" {
}
variable "google_client_id_key" {
}
variable "google_client_secret_key" {
}
variable "gh_account_id_key" {
}
variable "gh_account_secret_key" {
}
