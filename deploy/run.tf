resource "google_cloud_run_v2_service" "croaker_service" {
  provider            = google-beta
  launch_stage        = "BETA"
  name                = "croaker"
  location            = "asia-northeast1"
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    service_account = var.service_account_runner # "<SERVICE_ACCOUNT_ID>@<PROJECT_ID>.iam.gserviceaccount.com"

    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }

    volumes {
      name = "data"
      empty_dir {
        medium     = "MEMORY"
        size_limit = "8Mi"
      }
    }

    containers {
      name       = "croaker"
      image      = "${var.registry_location}-docker.pkg.dev/${var.project_id}/${var.repositry_name}/${var.image_name}:${var.image_tag}" # "<LOCATION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY>/<IMAGE>:latest"
      depends_on = ["restore"]

      ports {
        container_port = 3000
      }
      env {
        name = "NEXTAUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = "projects/${var.project_id}/secrets/${var.nextauth_secret_key}"
            version = "latest"
          }
        }
      }
      env {
        name = "GOOGLE_CLIENT_ID"
        value_source {
          secret_key_ref {
            secret  = "projects/${var.project_id}/secrets/${var.google_client_id_key}"
            version = "latest"
          }
        }
      }
      env {
        name = "GOOGLE_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = "projects/${var.project_id}/secrets/${var.google_client_secret_key}"
            version = "latest"
          }
        }
      }
      env {
        name = "GITHUB_ID"
        value_source {
          secret_key_ref {
            secret  = "projects/${var.project_id}/secrets/${var.gh_account_id_key}"
            version = "latest"
          }
        }
      }
      env {
        name = "GITHUB_SECRET"
        value_source {
          secret_key_ref {
            secret  = "projects/${var.project_id}/secrets/${var.gh_account_secret_key}"
            version = "latest"
          }
        }
      }
      env {
        name  = "STORAGE_BUCKET"
        value = var.file_bucket_name
      }
      env {
        name  = "STORAGE_DIRECTORY"
        value = var.file_bucket_path
      }
      env {
        name  = "NEXT_ORIGIN"
        value = var.next_origin
      }
      env {
        name  = "NEXTAUTH_URL"
        value = var.nextauth_url
      }
      env {
        name  = "SQLITE_FILE"
        value = "${var.database_path}/${var.database_file}"
      }
      volume_mounts {
        name       = "data"
        mount_path = var.database_path
      }
    }
    containers {
      name       = "replicate"
      image      = "litestream/litestream:0.3.13"
      depends_on = ["restore"]

      volume_mounts {
        name       = "data"
        mount_path = var.database_path
      }

      args = ["replicate", "${var.database_path}/${var.database_file}", "gcs://${var.db_bucket_name}/${var.db_bucket_path}/${var.database_file}"]
    }
    containers {
      name  = "restore"
      image = "litestream/litestream:0.3.13"

      volume_mounts {
        name       = "data"
        mount_path = var.database_path
      }

      startup_probe {
        initial_delay_seconds = 0
        failure_threshold     = 1
        timeout_seconds       = 1
        period_seconds        = 3
        tcp_socket {
          port = 8080
        }
      }

      # command = ["restore", "-if-db-not-exists", "-if-replica-exists", "-v", "-o", "${var.database_path}", "gcs://${var.db_bucket_name}/${var.db_bucket_path}", "&&", "nc", "-lkp", "8080", "-e", "echo", "restored"]
      # command = "restore -if-db-not-exists -if-replica-exists -v -o ${var.database_path} gcs://${var.db_bucket_name}/${var.db_bucket_path} && nc -lkp 8081 -e echo restored"
      command = ["/bin/sh", "-c", "echo restoring && /usr/local/bin/litestream restore -if-db-not-exists -if-replica-exists -v -o ${var.database_path}/${var.database_file} gcs://${var.db_bucket_name}/${var.db_bucket_path}/${var.database_file} && nc -lkp 8080 -e echo restored"]
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

resource "google_cloud_run_service_iam_binding" "croaker_service_no_auth" {
  location = google_cloud_run_v2_service.croaker_service.location
  project  = google_cloud_run_v2_service.croaker_service.project
  service  = google_cloud_run_v2_service.croaker_service.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}
