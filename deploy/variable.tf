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
variable "db_backet_name" {
}
variable "db_backet_path" {
}

# applocation env
variable "database_path" {
}
variable "service_account_runner" {
}
# TODO 環境変数はsecretから取るが、このあたりの変数はgithub actionsで直にbindしても問題ないの？
