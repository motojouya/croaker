# terraformの設定
terraform {
  required_version = "= 1.9.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.56.0"
    }
  }
  backend "gcs" {}
}

# terraformで利用するプロバイダーの設定
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}
